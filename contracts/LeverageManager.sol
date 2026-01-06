// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ReferralManager.sol";
import "./interfaces/IStrategyController.sol";
import "./oracles/ChainlinkOracle.sol";
import "./adapters/MoonwellAdapter.sol";

/**
 * @title LeverageManager
 * @notice Manages leveraged positions based on user tiers
 * @dev Handles 2x, 3x, 5x leverage for Scout, Captain, Whale tiers
 */
contract LeverageManager is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");

    ReferralManager public referralManager;
    IStrategyController public strategyController;
    ChainlinkOracle public oracle;
    MoonwellAdapter public lendingAdapter;
    IERC20 public immutable USDC;

    struct Position {
        address user;
        uint256 initialDeposit;    // User's initial deposit
        uint256 totalDeposited;    // Total including borrowed
        uint256 totalBorrowed;     // Amount borrowed
        uint256 currentLeverage;   // Current leverage (basis points)
        uint256 timestamp;
        bool active;
    }

    // User => Position
    mapping(address => Position) public positions;

    // Tier leverage limits (basis points: 10000 = 1x)
    mapping(ReferralManager.Tier => uint256) public tierLeverage;

    // Health factor thresholds (basis points)
    uint256 public constant LIQUIDATION_THRESHOLD = 12000; // 1.2x
    uint256 public constant DANGER_THRESHOLD = 13000;      // 1.3x
    uint256 public constant SAFE_THRESHOLD = 15000;        // 1.5x

    event PositionOpened(address indexed user, uint256 deposit, uint256 leverage);
    event PositionClosed(address indexed user, uint256 withdrawn);
    event PositionRebalanced(address indexed user, uint256 newHealthFactor, uint256 amountRepaid);
    event Liquidated(address indexed user, uint256 loss);
    event StrategyControllerUpdated(address indexed newController);
    event OracleUpdated(address indexed newOracle);
    event LendingAdapterUpdated(address indexed newAdapter);

    constructor(address _referralManager, address _usdc) {
        require(_referralManager != address(0), "Invalid referral manager");
        require(_usdc != address(0), "Invalid USDC");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);

        referralManager = ReferralManager(_referralManager);
        USDC = IERC20(_usdc);

        // Set tier leverage limits
        tierLeverage[ReferralManager.Tier.Novice] = 10000;  // 1.0x (no leverage)
        tierLeverage[ReferralManager.Tier.Scout] = 20000;   // 2.0x
        tierLeverage[ReferralManager.Tier.Captain] = 30000; // 3.0x
        tierLeverage[ReferralManager.Tier.Whale] = 50000;   // 5.0x
    }

    /**
     * @notice Open leveraged position based on user tier
     */
    function openPosition(uint256 depositAmount) external nonReentrant {
        require(depositAmount > 0, "Invalid deposit");
        require(!positions[msg.sender].active, "Position already active");

        ReferralManager.Tier tier = referralManager.getUserTier(msg.sender);
        require(tier != ReferralManager.Tier.Novice, "Novice tier cannot leverage");

        uint256 maxLeverage = tierLeverage[tier];
        uint256 borrowAmount = (depositAmount * (maxLeverage - 10000)) / 10000;

        // Transfer user deposit
        USDC.safeTransferFrom(msg.sender, address(this), depositAmount);

        // Simulate borrowing (in real implementation, integrate with lending protocol)
        uint256 totalPosition = depositAmount + borrowAmount;

        positions[msg.sender] = Position({
            user: msg.sender,
            initialDeposit: depositAmount,
            totalDeposited: totalPosition,
            totalBorrowed: borrowAmount,
            currentLeverage: maxLeverage,
            timestamp: block.timestamp,
            active: true
        });

        emit PositionOpened(msg.sender, depositAmount, maxLeverage);
    }

    /**
     * @notice Close leveraged position
     */
    function closePosition() external nonReentrant {
        Position storage position = positions[msg.sender];
        require(position.active, "No active position");

        // Calculate current value (simplified)
        uint256 currentValue = position.totalDeposited; // In real implementation, get from strategy
        uint256 debt = position.totalBorrowed;

        require(currentValue >= debt, "Position underwater");

        uint256 userShare = currentValue - debt;
        position.active = false;

        // Return user funds
        USDC.safeTransfer(msg.sender, userShare);

        emit PositionClosed(msg.sender, userShare);
    }

    /**
     * @notice Get position health factor
     */
    function getHealthFactor(address user) external view returns (uint256) {
        Position memory position = positions[user];
        if (!position.active || position.totalBorrowed == 0) return type(uint256).max;

        // Health Factor = Collateral Value / Borrowed Amount
        return (position.totalDeposited * 10000) / position.totalBorrowed;
    }

    /**
     * @notice Get detailed position health
     */
    function getPositionHealth(address user) external view returns (
        uint256 healthFactor,
        uint256 collateralValue,
        uint256 borrowValue,
        uint256 availableToBorrow,
        bool isHealthy
    ) {
        Position memory position = positions[user];
        
        if (!position.active) {
            return (0, 0, 0, 0, true);
        }

        collateralValue = position.totalDeposited;
        borrowValue = position.totalBorrowed;
        
        if (borrowValue == 0) {
            healthFactor = type(uint256).max;
            isHealthy = true;
        } else {
            healthFactor = (collateralValue * 10000) / borrowValue;
            isHealthy = healthFactor >= SAFE_THRESHOLD;
        }

        // Calculate available to borrow based on tier
        ReferralManager.Tier tier = referralManager.getUserTier(user);
        uint256 maxLeverage = tierLeverage[tier];
        uint256 maxBorrow = (position.initialDeposit * (maxLeverage - 10000)) / 10000;
        availableToBorrow = maxBorrow > borrowValue ? maxBorrow - borrowValue : 0;
    }

    /**
     * @notice Rebalance position to safe health factor
     */
    function rebalance(address user, uint256 minHealthFactor) external onlyRole(KEEPER_ROLE) nonReentrant {
        Position storage position = positions[user];
        require(position.active, "No active position");
        require(address(strategyController) != address(0), "Controller not set");
        require(address(lendingAdapter) != address(0), "Adapter not set");

        // Get real-time health factor using oracle if available
        uint256 healthFactor = _calculateHealthFactor(user);
        uint256 repayAmount = 0; // Declare at function scope for event
        
        if (healthFactor < DANGER_THRESHOLD) {
            // Calculate how much debt to repay to reach safe threshold
            uint256 targetDebt = (position.totalDeposited * 10000) / SAFE_THRESHOLD;
            repayAmount = position.totalBorrowed > targetDebt ? position.totalBorrowed - targetDebt : 0;
            
            if (repayAmount > 0) {
                // Withdraw funds from strategies to repay debt
                uint256 withdrawn = strategyController.withdrawForRepayment(user, repayAmount);
                require(withdrawn >= repayAmount, "Insufficient withdrawal");
                
                // Approve lending adapter to take the funds
                USDC.approve(address(lendingAdapter), repayAmount);
                
                // Actually repay the debt
                lendingAdapter.repayBorrow(repayAmount);
                
                // Update position
                position.totalBorrowed -= repayAmount;
                position.totalDeposited -= repayAmount;
                position.currentLeverage = (position.totalDeposited * 10000) / position.initialDeposit;
            }
        }

        uint256 newHealthFactor = _calculateHealthFactor(user);
        require(newHealthFactor >= minHealthFactor, "Slippage: HF too low");
        
        emit PositionRebalanced(user, newHealthFactor, repayAmount);
    }

    /**
     * @notice Check if position needs rebalancing
     */
    function needsRebalance(address user) external view returns (bool) {
        if (!positions[user].active) return false;
        
        uint256 healthFactor = this.getHealthFactor(user);
        return healthFactor < DANGER_THRESHOLD;
    }

    /**
     * @notice Get all active positions (for keeper bot)
     */
    /**
     * @notice Get all active positions (for keeper bot)
     */
    function getActivePositions(address[] calldata users) external view returns (address[] memory activeUsers) {
        uint256 count = 0;
        
        // Count active positions
        for (uint256 i = 0; i < users.length; i++) {
            if (positions[users[i]].active) {
                count++;
            }
        }
        
        // Build array
        activeUsers = new address[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < users.length; i++) {
            if (positions[users[i]].active) {
                activeUsers[index] = users[i];
                index++;
            }
        }
    }

    /**
     * @notice Calculate health factor with oracle pricing (if available)
     * @dev Falls back to simple calculation if oracle not set
     */
    function _calculateHealthFactor(address user) internal view returns (uint256) {
        Position memory position = positions[user];
        if (!position.active || position.totalBorrowed == 0) return type(uint256).max;

        // If oracle is set, use it for accurate pricing
        if (address(oracle) != address(0) && address(strategyController) != address(0)) {
            // Get real value from strategies
            uint256 realValue = strategyController.getTotalValue(user);
            
            // Get oracle price for accurate valuation
            // Note: This assumes USDC so no price conversion needed
            // For other assets, would need: oracle.getUSDValue(asset, realValue, decimals)
            
            return (realValue * 10000) / position.totalBorrowed;
        }
        
        // Fallback to simple calculation
        return (position.totalDeposited * 10000) / position.totalBorrowed;
    }

    /**
     * @notice Set StrategyController address (admin only)
     * @param _controller StrategyController address
     */
    function setStrategyController(address _controller) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_controller != address(0), "Invalid controller");
        strategyController = IStrategyController(_controller);
        emit StrategyControllerUpdated(_controller);
    }

    /**
     * @notice Set ChainlinkOracle address (admin only)
     * @param _oracle Oracle address
     */
    function setOracle(address _oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_oracle != address(0), "Invalid oracle");
        oracle = ChainlinkOracle(_oracle);
        emit OracleUpdated(_oracle);
    }

    /**
     * @notice Set MoonwellAdapter address (admin only)
     * @param _adapter Adapter address
     */
    function setLendingAdapter(address _adapter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_adapter != address(0), "Invalid adapter");
        lendingAdapter = MoonwellAdapter(_adapter);
        emit LendingAdapterUpdated(_adapter);
    }

    /**
     * @notice Withdraw funds from strategies for debt repayment
     * @dev Called by rebalance function
     * @param user User address
     * @param amount Amount to withdraw
     * @return Amount actually withdrawn
     */
    function withdrawForRepayment(address user, uint256 amount) external onlyRole(KEEPER_ROLE) returns (uint256) {
        require(address(strategyController) != address(0), "Controller not set");
        return strategyController.withdrawForRepayment(user, amount);
    }
}