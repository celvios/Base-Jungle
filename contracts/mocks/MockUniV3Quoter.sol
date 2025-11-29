// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title MockUniV3Quoter
 * @notice Mock implementation of UniswapV3 Quoter for testing
 */
contract MockUniV3Quoter {
    mapping(bytes32 => uint256) public quotes;

    function setQuote(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountOut
    ) external {
        bytes32 key = keccak256(abi.encodePacked(tokenIn, tokenOut, fee));
        quotes[key] = amountOut;
    }

    function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint160 sqrtPriceLimitX96
    ) external view returns (uint256 amountOut) {
        bytes32 key = keccak256(abi.encodePacked(tokenIn, tokenOut, fee));
        return quotes[key];
    }

    function quoteExactInput(bytes memory path, uint256 amountIn)
        external
        view
        returns (uint256 amountOut)
    {
        // Simplified - just return a fixed amount
        return amountIn * 99 / 100; // 1% slippage
    }
}
