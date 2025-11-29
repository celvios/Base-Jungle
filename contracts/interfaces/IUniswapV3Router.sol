// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title IUniswapV3Router
 * @notice Interface for Uniswap V3 SwapRouter on Base.
 * @dev Simplified interface for exact input swaps.
 */
interface IUniswapV3Router {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;           // Pool fee tier (500 = 0.05%, 3000 = 0.3%, 10000 = 1%)
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }

    struct ExactInputParams {
        bytes path;           // Encoded path for multi-hop swaps
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
    }

    function exactInputSingle(ExactInputSingleParams calldata params)
        external
        payable
        returns (uint256 amountOut);

    function exactInput(ExactInputParams calldata params)
        external
        payable
        returns (uint256 amountOut);
}

/**
 * @title IUniswapV3Quoter
 * @notice Interface for getting quotes without executing swaps.
 */
interface IUniswapV3Quoter {
    function quoteExactInputSingle(
        address tokenIn,
        address tokenOut,
        uint24 fee,
        uint256 amountIn,
        uint160 sqrtPriceLimitX96
    ) external returns (uint256 amountOut);

    function quoteExactInput(bytes memory path, uint256 amountIn)
        external
        returns (uint256 amountOut);
}
