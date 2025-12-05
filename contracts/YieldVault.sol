// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./BaobabVaultBase.sol";
import "./interfaces/IStrategyAdapter.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title YieldVault
 * @notice Concrete vault implementation that integrates with strategy adapters.
 * @dev M-1 FIX: Implements virtual shares to prevent first depositor attack
 */
contract YieldVault is BaobabVaultBase {
    using SafeERC20 for IERC20;

    // Virtual shares to prevent first depositor attack (donation attack)
    uint256 private constant VIRTUAL_SHARES = 1e3;
    uint256 private constant VIRTUAL_ASSETS = 1;

    IStrategyAdapter public activeStrategy;
    
    // Strategy whitelist for security
    mapping(address => bool) public approvedStrategies;
    
    mapping(address => uint256) public lastDepositTime;
    uint256 public constant MIN_DEPOSIT_PERIOD = 1 days;

    // Events
    event StrategyApproved(address indexed strategy);
    event StrategyRevoked(address indexed strategy);

    // event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares); // Inherited from ERC4626

    constructor(
        IERC20 asset_, 
        string memory name_, 
        string memory symbol_, 
        address _pointsTracker,
        address _initialStrategy
    ) BaobabVaultBase(asset_, name_, symbol_, _pointsTracker) {
        require(_initialStrategy != address(0), "Invalid strategy address");
        activeStrategy = IStrategyAdapter(_initialStrategy);
        approvedStrategies[_initialStrategy] = true; // Auto-approve initial strategy
    }

    function deposit(uint256 assets, address receiver) 
        public 
        override 
        whenNotPaused 
        nonReentrant 
        returns (uint256 shares) 
    {
        require(assets >= MIN_DEPOSIT, "Below minimum");
        require(assets <= MAX_DEPOSIT, "Exceeds maximum");
        
        // Calculate shares based on current exchange rate
        shares = previewDeposit(assets);
        
        // Transfer assets from user
        IERC20(asset()).safeTransferFrom(msg.sender, address(this), assets);
        
        // Deposit to active strategy
        IERC20(asset()).approve(address(activeStrategy), assets);
        activeStrategy.deposit(assets);
        
        // Mint shares to receiver
        _mint(receiver, shares);
        
        // Award points
        _awardDepositPoints(receiver, assets);
        
        // Track deposit time
        lastDepositTime[receiver] = block.timestamp;
        
        emit Deposit(msg.sender, receiver, assets, shares);
        
        return shares;
    }
    
    function withdraw(uint256 assets, address receiver, address owner) public override nonReentrant returns (uint256) {
        require(assets <= maxWithdraw(owner), "ERC4626: withdraw more than max");

        uint256 shares = previewWithdraw(assets);
        
        // Withdraw from strategy
        activeStrategy.withdraw(assets);
        
        _burn(owner, shares);
        
        IERC20(asset()).safeTransfer(receiver, assets);
        
        emit Withdraw(msg.sender, receiver, owner, assets, shares);

        return shares;
    }

    function redeem(uint256 shares, address receiver, address owner) public override nonReentrant returns (uint256) {
        require(shares <= maxRedeem(owner), "ERC4626: redeem more than max");

        uint256 assets = previewRedeem(shares);
        
        // Withdraw from strategy
        activeStrategy.withdraw(assets);
        
        _burn(owner, shares);
        
        IERC20(asset()).safeTransfer(receiver, assets);
        
        emit Withdraw(msg.sender, receiver, owner, assets, shares);

        return assets;
    }

    function totalAssets() public view override returns (uint256) {
        return activeStrategy.balanceOf();
    }
    
    /**
     * @notice Converts assets to shares with virtual shares offset.
     * @dev M-1 FIX: Prevents first depositor attack by adding virtual shares/assets
     */
    function _convertToShares(uint256 assets, Math.Rounding rounding) 
        internal 
        view 
        virtual 
        override 
        returns (uint256) 
    {
        uint256 supply = totalSupply() + VIRTUAL_SHARES;
        uint256 totalAssets_ = totalAssets() + VIRTUAL_ASSETS;
        
        return Math.mulDiv(assets, supply, totalAssets_, rounding);
    }
    
    /**
     * @notice Converts shares to assets with virtual shares offset.
     * @dev M-1 FIX: Prevents first depositor attack by adding virtual shares/assets
     */
    function _convertToAssets(uint256 shares, Math.Rounding rounding) 
        internal 
        view 
        virtual 
        override 
        returns (uint256) 
    {
        uint256 supply = totalSupply() + VIRTUAL_SHARES;
        uint256 totalAssets_ = totalAssets() + VIRTUAL_ASSETS;
        
        return Math.mulDiv(shares, totalAssets_, supply, rounding);
    }
    
    /**
     * @notice Rebalances funds between strategies with slippage protection.
     * @param newStrategy Address of the new strategy to deposit into
     * @param amount Amount to rebalance
     * @param minReceived Minimum amount expected after withdrawal (slippage protection)
     * @dev H-1 FIX: Added slippage protection to prevent front-running attacks
     */
    function rebalance(address newStrategy, uint256 amount, uint256 minReceived) 
        external 
        onlyRole(STRATEGY_CONTROLLER_ROLE)
        nonReentrant
    {
        require(amount > 0, "Zero amount");
        require(newStrategy != address(0), "Invalid strategy");
        require(approvedStrategies[newStrategy], "Strategy not approved"); // WHITELIST CHECK
        require(minReceived > 0, "Invalid min received");
        
        // Withdraw from current strategy
        uint256 withdrawn = activeStrategy.withdraw(amount);
        
        // Slippage protection: ensure we received at least minReceived
        require(withdrawn >= minReceived, "Excessive slippage");
        
        // Approve and deposit to new strategy (use actual withdrawn amount)
        IERC20(asset()).approve(newStrategy, withdrawn);
        IStrategyAdapter(newStrategy).deposit(withdrawn);
        
        // Update active strategy if full rebalance (simplified logic for now)
        // In a real scenario, we might have multiple strategies or partial rebalances.
        // Here we assume we are moving funds to a new active strategy.
        if (amount == totalAssets()) {
             activeStrategy = IStrategyAdapter(newStrategy);
             emit StrategyChanged(address(activeStrategy), newStrategy);
        }
        
        emit Rebalanced(withdrawn, address(activeStrategy), newStrategy);
    }
    
    /**
     * @notice Emergency withdrawal with early withdrawal penalty enforcement.
     * @param shares Number of shares to redeem
     * @dev H-2 FIX: Implemented 10% penalty for withdrawals before 30-day maturity
     */
    function emergencyWithdraw(uint256 shares) 
        external 
        nonReentrant 
    {
        require(shares > 0, "Zero shares");
        require(balanceOf(msg.sender) >= shares, "Insufficient shares");
        
        uint256 assets = previewRedeem(shares);
        uint256 penalty = 0;
        uint256 userReceives = assets;
        
        // Calculate and apply penalty for early withdrawal (if < 30 days)
        if (block.timestamp < lastDepositTime[msg.sender] + 30 days) {
            // 10% penalty (1000 basis points)
            penalty = (assets * 1000) / 10000;
            userReceives = assets - penalty;
            
            emit EarlyWithdrawalPenalty(msg.sender, penalty);
        }
        
        // Withdraw full amount from strategy
        activeStrategy.withdraw(assets);
        
        // Burn shares
        _burn(msg.sender, shares);
        
        // Transfer penalty to treasury if applicable
        if (penalty > 0) {
            address treasury = address(pointsTracker); // Using pointsTracker as treasury proxy
            IERC20(asset()).safeTransfer(treasury, penalty);
        }
        
        // Transfer remaining assets to user
        IERC20(asset()).safeTransfer(msg.sender, userReceives);
        
        emit EmergencyWithdrawal(msg.sender, userReceives);
    }

    /**
     * @notice Approve a strategy for use in rebalancing.
     * @param strategy Address of the strategy to approve
     */
    function approveStrategy(address strategy) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(strategy != address(0), "Invalid strategy");
        require(!approvedStrategies[strategy], "Already approved");
        
        approvedStrategies[strategy] = true;
        emit StrategyApproved(strategy);
    }

    /**
     * @notice Revoke approval for a strategy.
     * @param strategy Address of the strategy to revoke
     */
    function revokeStrategy(address strategy) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        require(strategy != address(0), "Invalid strategy");
        require(strategy != address(activeStrategy), "Cannot revoke active strategy");
        require(approvedStrategies[strategy], "Not approved");
        
        approvedStrategies[strategy] = false;
        emit StrategyRevoked(strategy);
    }
}
