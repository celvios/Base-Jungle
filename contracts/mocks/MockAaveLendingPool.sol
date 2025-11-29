// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockAaveLendingPool
 * @notice Mock Aave lending pool for Sepolia testing
 * @dev Simulates lending with fake yield
 */
contract MockAaveLendingPool {
    IERC20 public usdc;
    
    mapping(address => uint256) public deposits;
    mapping(address => uint256) public depositTime;
    
    // Simulated APY: 3.8% = 0.0104% per day
    uint256 constant DAILY_YIELD = 104; // basis points
    
    constructor(address _usdc) {
        usdc = IERC20(_usdc);
    }
    
    /**
     * @notice Supply tokens to the pool
     */
    function supply(address asset, uint256 amount, address onBehalfOf, uint16) external {
        require(asset == address(usdc), "Only USDC supported");
        
        usdc.transferFrom(msg.sender, address(this), amount);
        deposits[onBehalfOf] += amount;
        depositTime[onBehalfOf] = block.timestamp;
    }
    
    /**
     * @notice Withdraw tokens from the pool
     */
    function withdraw(address asset, uint256 amount, address to) external returns (uint256) {
        require(asset == address(usdc), "Only USDC supported");
        require(deposits[msg.sender] >= amount, "Insufficient balance");
        
        // Calculate yield
        uint256 daysElapsed = (block.timestamp - depositTime[msg.sender]) / 1 days;
        uint256 yield = (amount * DAILY_YIELD * daysElapsed) / 1000000;
        
        uint256 totalAmount = amount + yield;
        
        deposits[msg.sender] -= amount;
        usdc.transfer(to, totalAmount);
        
        return totalAmount;
    }
    
    /**
     * @notice Get user balance
     */
    function getUserAccountData(address user) external view returns (
        uint256 totalCollateralBase,
        uint256 totalDebtBase,
        uint256 availableBorrowsBase,
        uint256 currentLiquidationThreshold,
        uint256 ltv,
        uint256 healthFactor
    ) {
        return (deposits[user], 0, 0, 0, 0, type(uint256).max);
    }
}
