// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../adapters/MoonwellAdapter.sol";
import "../ReferralManager.sol";

/**
 * @title LeverageManager
 * @notice Manages recursive leverage strategies with tier-based limits.
 * @dev Integrates with ReferralManager to enforce tier-based max leverage.
 */
contract LeverageManager is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant STRATEGY_ROLE = keccak256("STRATEGY_ROLE");

    ReferralManager public referralManager;
    MoonwellAdapter public moonwellAdapter;

    // Health Factor targets (basis points, 10000 = 1.0)
    uint256 public constant TARGET_HEALTH_FACTOR = 15000; // 1.5
    uint256 public constant MIN_HEALTH_FACTOR = 12000;    // 1.2 (emergency threshold)

    // Max loop iterations to prevent gas issues
    uint256 public constant MAX_LOOPS = 10;
    
    // Maximum leverage allowed (10x = 100000 basis points)
    uint256 public constant MAX_LEVERAGE = 100000; // 10x maximum

    struct LeveragePosition {
        address user;
        uint256 collateral;      // Initial collateral
        uint256 totalDeposited;  // Total deposited (including borrowed)
        uint256 totalBorrowed;   // Total borrowed amount
        uint256 leverage;        // Actual leverage ratio (basis points)
        uint256 lastUpdate;
    }

    mapping(address => LeveragePosition) public positions;

    event LeveragePositionOpened(
        address indexed user,
        uint256 collateral,
        uint256 totalDeposited,
        uint256 leverage
    );

    event LeveragePositionClosed(
        address indexed user,
        uint256 withdrawn,
        uint256 profit
    );

    event EmergencyUnwind(
        address indexed user,
        uint256 healthFactor,
        uint256 repaid
    );

    constructor(
        address _referralManager,
        address _moonwellAdapter
    ) {
        require(_referralManager != address(0), "Invalid referral manager");
        require(_moonwellAdapter != address(0), "Invalid adapter");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(STRATEGY_ROLE, msg.sender);

        referralManager = ReferralManager(_referralManager);
        moonwellAdapter = MoonwellAdapter(_moonwellAdapter);
    }

    /**
     * @notice Open leveraged position with recursive loop.
     * @param initialAmount Initial collateral amount
     * @param targetLeverage Desired leverage (basis points, e.g. 20000 = 2.0x)
     */
    function openLeveragePosition(
        uint256 initialAmount,
        uint256 targetLeverage
    ) external nonReentrant {
        require(initialAmount > 0, "Amount zero");
        require(targetLeverage > 10000, "Leverage too low");
        require(targetLeverage <= MAX_LEVERAGE, "Leverage exceeds maximum");

        // Check user's tier and max leverage
        ReferralManager.Tier tier = referralManager.getUserTier(msg.sender);
        uint256 maxLeverage = referralManager.getMaxLeverage(tier);
        require(targetLeverage <= maxLeverage, "Exceeds tier limit");

        // Transfer collateral from user
        address asset = moonwellAdapter.asset();
        IERC20(asset).safeTransferFrom(msg.sender, address(this), initialAmount);

        uint256 totalDeposited = initialAmount;
        uint256 totalBorrowed = 0;

        // Approve adapter
        IERC20(asset).approve(address(moonwellAdapter), type(uint256).max);

        // Recursive leverage loop
        uint256 remainingLeverage = targetLeverage - 10000; // Subtract base 1.0x
        uint256 currentAmount = initialAmount;

        for (uint256 i = 0; i < MAX_LOOPS && remainingLeverage > 100; i++) {
            // Deposit current amount
            moonwellAdapter.deposit(currentAmount);

            // Calculate how much to borrow (70% LTV to maintain health)
            uint256 borrowAmount = (currentAmount * 7000) / 10000;

            // Check if this would exceed target leverage
            uint256 potentialTotal = totalDeposited + borrowAmount;
            uint256 potentialLeverage = (potentialTotal * 10000) / initialAmount;

            if (potentialLeverage > targetLeverage) {
                // Adjust borrow to hit exact target
                borrowAmount = ((targetLeverage * initialAmount) / 10000) - totalDeposited;
                if (borrowAmount == 0) break;
            }

            // Borrow
            moonwellAdapter.borrow(borrowAmount);
            totalBorrowed += borrowAmount;
            totalDeposited += borrowAmount;
            currentAmount = borrowAmount;

            // Check if we've reached target
            if (potentialLeverage >= targetLeverage) break;

            remainingLeverage = targetLeverage - potentialLeverage;
        }

        // Calculate actual leverage
        uint256 actualLeverage = (totalDeposited * 10000) / initialAmount;

        // Store position
        positions[msg.sender] = LeveragePosition({
            user: msg.sender,
            collateral: initialAmount,
            totalDeposited: totalDeposited,
            totalBorrowed: totalBorrowed,
            leverage: actualLeverage,
            lastUpdate: block.timestamp
        });

        emit LeveragePositionOpened(msg.sender, initialAmount, totalDeposited, actualLeverage);
    }

    /**
     * @notice Close leveraged position and return funds.
     */
    function closeLeveragePosition() external nonReentrant {
        LeveragePosition storage position = positions[msg.sender];
        require(position.collateral > 0, "No position");

        // Get current balances
        uint256 supplied = moonwellAdapter.balanceOf();
        uint256 borrowed = moonwellAdapter.getBorrowBalance();

        // Withdraw enough to repay debt
        if (borrowed > 0) {
            // Withdraw from supply to repay
            uint256 toWithdraw = borrowed;
            if (toWithdraw > supplied) toWithdraw = supplied;

            moonwellAdapter.withdraw(toWithdraw);

            // Get asset address
            address assetAddr = moonwellAdapter.asset();

            // Repay borrow
            IERC20(assetAddr).approve(address(moonwellAdapter), borrowed);
            moonwellAdapter.repayBorrow(borrowed);
        }

        // Withdraw remaining balance
        uint256 remaining = moonwellAdapter.balanceOf();
        if (remaining > 0) {
            moonwellAdapter.withdraw(remaining);
        }

        // Transfer all assets back to user
        address asset = moonwellAdapter.asset();
        uint256 finalBalance = IERC20(asset).balanceOf(address(this));
        uint256 profit = finalBalance > position.collateral ? finalBalance - position.collateral : 0;

        IERC20(asset).safeTransfer(msg.sender, finalBalance);

        emit LeveragePositionClosed(msg.sender, finalBalance, profit);

        // Clear position
        delete positions[msg.sender];
    }

    /**
     * @notice Get current health factor with enhanced calculation.
     * @dev Health Factor = (Collateral * Liquidation Threshold) / Total Borrowed
     *      HF > 1.0 = safe, HF < 1.0 = liquidatable
     * @return healthFactor Health factor in basis points (15000 = 1.5)
     */
    function getHealthFactor(address user) public view returns (uint256 healthFactor) {
        LeveragePosition memory position = positions[user];
        if (position.totalBorrowed == 0) return type(uint256).max;

        // Get real-time account liquidity from Moonwell
        (uint256 liquidity, uint256 shortfall) = moonwellAdapter.getAccountLiquidity();

        if (shortfall > 0) {
            // Underwater - calculate how far underwater
            // HF = 0 if completely underwater
            return 0;
        }

        // Enhanced calculation using Compound's account liquidity
        // liquidity = (collateral * collateralFactor) - borrowBalance
        // HF = (liquidity + borrowBalance) / borrowBalance
        
        uint256 borrowBalance = position.totalBorrowed;
        
        // Calculate health factor
        // HF = (availableLiquidity + currentBorrow) / currentBorrow
        uint256 totalCollateralValue = liquidity + borrowBalance;
        
        if (borrowBalance == 0) return type(uint256).max;
        
        healthFactor = (totalCollateralValue * 10000) / borrowBalance;
    }

    /**
     * @notice Get detailed position health metrics.
     * @return healthFactor Current health factor (basis points)
     * @return collateralValue USD value of collateral
     * @return borrowValue USD value of borrowed assets
     * @return availableToBorrow Remaining borrow capacity
     * @return isHealthy True if HF >= MIN_HEALTH_FACTOR
     */
    function getPositionHealth(address user) external view returns (
        uint256 healthFactor,
        uint256 collateralValue,
        uint256 borrowValue,
        uint256 availableToBorrow,
        bool isHealthy
    ) {
        LeveragePosition memory position = positions[user];
        
        healthFactor = getHealthFactor(user);
        borrowValue = position.totalBorrowed;
        
        (uint256 liquidity, uint256 shortfall) = moonwellAdapter.getAccountLiquidity();
        
        if (shortfall == 0) {
            availableToBorrow = liquidity;
            collateralValue = liquidity + borrowValue;
        } else {
            availableToBorrow = 0;
            collateralValue = borrowValue; // Simplified when underwater
        }
        
        isHealthy = healthFactor >= MIN_HEALTH_FACTOR && shortfall == 0;
    }

    /**
     * @notice Emergency unwind if health factor drops too low.
     * @dev Can be called by anyone to protect position.
     */
    function emergencyUnwind(address user) external nonReentrant {
        uint256 hf = getHealthFactor(user);
        require(hf < MIN_HEALTH_FACTOR, "Position healthy");

        LeveragePosition storage position = positions[user];
        require(position.collateral > 0, "No position");

        // Get current balances
        uint256 borrowed = moonwellAdapter.getBorrowBalance();

        if (borrowed > 0) {
            // Withdraw to repay
            uint256 toWithdraw = (borrowed * 11000) / 10000; // 110% to ensure full repay
            uint256 supplied = moonwellAdapter.balanceOf();
            if (toWithdraw > supplied) toWithdraw = supplied;

            moonwellAdapter.withdraw(toWithdraw);

            // Repay
            address asset = moonwellAdapter.asset();
            IERC20(asset).approve(address(moonwellAdapter), borrowed);
            moonwellAdapter.repayBorrow(borrowed);
        }

        emit EmergencyUnwind(user, hf, borrowed);

        // Note: Position not deleted, user can still withdraw remaining
    }

    /**
     * @notice Check if position needs rebalancing.
     */
    function needsRebalance(address user) external view returns (bool) {
        uint256 hf = getHealthFactor(user);
        return hf < MIN_HEALTH_FACTOR;
    }

    /**
     * @notice Get user's total debt.
     * @param user User address
     * @return Total borrowed amount
     */
    function getUserDebt(address user) external view returns (uint256) {
        return positions[user].totalBorrowed;
    }

    /**
     * @notice Get user's total collateral.
     * @param user User address
     * @return Total deposited amount
     */
    function getUserCollateral(address user) external view returns (uint256) {
        return positions[user].totalDeposited;
    }

    /**
     * @notice Liquidate an underwater position.
     * @param user User to liquidate
     * @param liquidator Address receiving liquidation bonus
     * @return debtRepaid Amount of debt repaid
     * @return collateralSeized Amount of collateral seized
     */
    function liquidate(
        address user,
        address liquidator
    ) external onlyRole(STRATEGY_ROLE) nonReentrant returns (uint256 debtRepaid, uint256 collateralSeized) {
        require(user != address(0), "Invalid user");
        require(liquidator != address(0), "Invalid liquidator");
        
        LeveragePosition storage position = positions[user];
        require(position.totalBorrowed > 0, "No position");
        
        // Check health factor
        uint256 hf = getHealthFactor(user);
        require(hf < MIN_HEALTH_FACTOR, "Position healthy");
        
        // Calculate liquidation amounts (max 50% of debt)
        debtRepaid = position.totalBorrowed / 2;
        
        // Calculate collateral needed with 10% liquidation bonus
        collateralSeized = (debtRepaid * 11000) / 10000; // 110%
        
        require(collateralSeized <= position.totalDeposited, "Insufficient collateral");
        
        // Withdraw collateral from Moonwell
        address asset = moonwellAdapter.asset();
        moonwellAdapter.withdraw(collateralSeized);
        
        // Transfer to liquidator
        IERC20(asset).safeTransfer(liquidator, collateralSeized);
        
        // Update position
        position.totalBorrowed -= debtRepaid;
        position.totalDeposited -= collateralSeized;
        position.lastUpdate = block.timestamp;
        
        emit LiquidationExecuted(user, liquidator, debtRepaid, collateralSeized);
    }

    event LiquidationExecuted(
        address indexed user,
        address indexed liquidator,
        uint256 debtRepaid,
        uint256 collateralSeized
    );
}
