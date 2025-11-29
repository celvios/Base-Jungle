// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockAerodromePool
 * @notice Mock Aerodrome LP pool for Sepolia testing
 * @dev Simulates adding/removing liquidity with fake yield
 */
contract MockAerodromePool {
    IERC20 public token0; // USDC
    IERC20 public token1; // USDbC or other stablecoin
    
    uint256 public reserve0;
    uint256 public reserve1;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    
    // Simulated APY: 12.5% = 0.0342% per day
    uint256 constant DAILY_YIELD = 342; // basis points (0.0342%)
    mapping(address => uint256) public lastDepositTime;
    
    constructor(address _token0, address _token1) {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }
    
    /**
     * @notice Add liquidity (simplified - assumes balanced)
     */
    function addLiquidity(uint256 amount0, uint256 amount1) external returns (uint256 liquidity) {
        token0.transferFrom(msg.sender, address(this), amount0);
        token1.transferFrom(msg.sender, address(this), amount1);
        
        liquidity = amount0 + amount1; // Simplified LP token amount
        balanceOf[msg.sender] += liquidity;
        totalSupply += liquidity;
        
        reserve0 += amount0;
        reserve1 += amount1;
        
        lastDepositTime[msg.sender] = block.timestamp;
    }
    
    /**
     * @notice Remove liquidity
     */
    function removeLiquidity(uint256 liquidity) external returns (uint256 amount0, uint256 amount1) {
        require(balanceOf[msg.sender] >= liquidity, "Insufficient balance");
        
        // Calculate accrued yield (fake but realistic)
        uint256 daysElapsed = (block.timestamp - lastDepositTime[msg.sender]) / 1 days;
        uint256 yield = (liquidity * DAILY_YIELD * daysElapsed) / 1000000;
        
        amount0 = (liquidity + yield) / 2;
        amount1 = (liquidity + yield) / 2;
        
        balanceOf[msg.sender] -= liquidity;
        totalSupply -= liquidity;
        
        reserve0 -= amount0;
        reserve1 -= amount1;
        
        token0.transfer(msg.sender, amount0);
        token1.transfer(msg.sender, amount1);
    }
    
    /**
     * @notice Get reserves (for Uniswap V2 compatibility)
     */
    function getReserves() external view returns (uint256, uint256, uint256) {
        return (reserve0, reserve1, block.timestamp);
    }
}
