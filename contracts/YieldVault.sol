// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./BaobabVaultBase.sol";
import "./interfaces/IStrategyAdapter.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title YieldVault
 * @notice Concrete vault implementation that integrates with strategy adapters.
 */
contract YieldVault is BaobabVaultBase {
    using SafeERC20 for IERC20;

    IStrategyAdapter public activeStrategy;
    
    mapping(address => uint256) public lastDepositTime;
    uint256 public constant MIN_DEPOSIT_PERIOD = 1 days;

    // event Deposit(address indexed caller, address indexed owner, uint256 assets, uint256 shares); // Inherited from ERC4626

    constructor(
        IERC20 asset_, 
        string memory name_, 
        string memory symbol_, 
        address _pointsTracker,
        address _initialStrategy
    ) BaobabVaultBase(asset_, name_, symbol_, _pointsTracker) {
        activeStrategy = IStrategyAdapter(_initialStrategy);
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
    
    function rebalance(address newStrategy, uint256 amount) 
        external 
        onlyRole(STRATEGY_CONTROLLER_ROLE)
        nonReentrant
    {
        require(amount > 0, "Zero amount");
        require(newStrategy != address(0), "Invalid strategy");
        
        // Withdraw from current strategy
        activeStrategy.withdraw(amount);
        
        // Approve and deposit to new strategy
        IERC20(asset()).approve(newStrategy, amount);
        IStrategyAdapter(newStrategy).deposit(amount);
        
        // Update active strategy if full rebalance (simplified logic for now)
        // In a real scenario, we might have multiple strategies or partial rebalances.
        // Here we assume we are moving funds to a new active strategy.
        if (amount == totalAssets()) {
             activeStrategy = IStrategyAdapter(newStrategy);
             emit StrategyChanged(address(activeStrategy), newStrategy);
        }
        
        emit Rebalanced(amount, address(activeStrategy), newStrategy);
    }
    
    // Emergency: bypass strategy, direct withdrawal
    function emergencyWithdraw(uint256 shares) 
        external 
        nonReentrant 
    {
        require(shares > 0, "Zero shares");
        require(balanceOf(msg.sender) >= shares, "Insufficient shares");
        
        uint256 assets = previewRedeem(shares);
        
        // Withdraw from strategy
        activeStrategy.withdraw(assets);
        
        // Burn shares
        _burn(msg.sender, shares);
        
        // Transfer assets
        IERC20(asset()).safeTransfer(msg.sender, assets);
        
        // Apply penalty for early withdrawal (if < 30 days)
        if (block.timestamp < lastDepositTime[msg.sender] + 30 days) {
            // Logic to deduct points would go here if PointsTracker supported deduction
            // For now we just emit event or log it
        }
        
        emit EmergencyWithdrawal(msg.sender, assets);
    }
}
