// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title UniswapV3AdapterSimple
 * @notice Simplified adapter for UniswapV3 testing on Base Sepolia
 * @dev Holds assets without actual LP positions for testing
 */
contract UniswapV3AdapterSimple {
    address public immutable factory;
    address public immutable router;
    address public immutable asset;
    
    constructor(
        address _factory,
        address _router,
        address _asset
    ) {
        factory = _factory;
        router = _router;
        asset = _asset;
    }
    
    function deposit(uint256 amount) external returns (uint256) {
        // Simplified: Just hold the assets for now
        // Full implementation would create LP position
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        return amount;
    }
    
    function withdraw(uint256 amount) external returns (uint256) {
        // Simplified: Return the assets
        IERC20(asset).transfer(msg.sender, amount);
        return amount;
    }
    
    function totalAssets() external view returns (uint256) {
        return IERC20(asset).balanceOf(address(this));
    }
    
    function getAPY() external pure returns (uint256) {
        // Estimated APY for UniswapV3 USDC pools (~2500 = 25%)
        return 2500;
    }
}
