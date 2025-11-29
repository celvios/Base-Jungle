// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IUniswapV3Router.sol";

/**
 * @title UniswapV3Adapter
 * @notice Adapter for Uniswap V3 on Base with multi-fee tier support.
 * @dev Tries multiple fee tiers to find best price.
 */
contract UniswapV3Adapter is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ROUTER_ADMIN_ROLE = keccak256("ROUTER_ADMIN_ROLE");

    IUniswapV3Router public immutable router;
    IUniswapV3Quoter public immutable quoter;

    // Fee tiers to check (in order of preference)
    uint24[] public feeTiers;

    // Uniswap V3 addresses on Base
    // Router: 0x2626664c2603336E57B271c5C0b26F421741e481
    // Quoter V2: 0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a

    event SwapExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint24 fee
    );

    event FeeTiersUpdated(uint24[] feeTiers);

    constructor(address _router, address _quoter) {
        require(_router != address(0), "Invalid router");
        require(_quoter != address(0), "Invalid quoter");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ROUTER_ADMIN_ROLE, msg.sender);

        router = IUniswapV3Router(_router);
        quoter = IUniswapV3Quoter(_quoter);

        // Default fee tiers: 0.05%, 0.3%, 1%
        feeTiers.push(500);    // 0.05% - for stablecoins
        feeTiers.push(3000);   // 0.3% - most common
        feeTiers.push(10000);  // 1% - for exotic pairs
    }

    /**
     * @notice Update fee tiers to check.
     */
    function setFeeTiers(uint24[] calldata _feeTiers) external onlyRole(ROUTER_ADMIN_ROLE) {
        require(_feeTiers.length > 0, "Empty tiers");
        delete feeTiers;
        for (uint256 i = 0; i < _feeTiers.length; i++) {
            feeTiers.push(_feeTiers[i]);
        }
        emit FeeTiersUpdated(_feeTiers);
    }

    /**
     * @notice Get quote for best fee tier.
     * @return amountOut Best output amount
     * @return bestFee Fee tier with best price
     */
    function getBestQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public returns (uint256 amountOut, uint24 bestFee) {
        require(amountIn > 0, "Amount zero");

        uint256 bestAmount = 0;
        bestFee = feeTiers[0];

        for (uint256 i = 0; i < feeTiers.length; i++) {
            try quoter.quoteExactInputSingle(
                tokenIn,
                tokenOut,
                feeTiers[i],
                amountIn,
                0 // No price limit
            ) returns (uint256 quote) {
                if (quote > bestAmount) {
                    bestAmount = quote;
                    bestFee = feeTiers[i];
                }
            } catch {
                // Pool doesn't exist for this fee tier, continue
                continue;
            }
        }

        require(bestAmount > 0, "No liquidity");
        return (bestAmount, bestFee);
    }

    /**
     * @notice Get quote for specific fee tier.
     */
    function getQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint24 fee
    ) public returns (uint256 amountOut) {
        if (amountIn == 0) return 0;

        try quoter.quoteExactInputSingle(
            tokenIn,
            tokenOut,
            fee,
            amountIn,
            0
        ) returns (uint256 quote) {
            return quote;
        } catch {
            return 0;
        }
    }

    /**
     * @notice Execute swap with automatic best fee tier selection.
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address recipient
    ) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Amount zero");

        // Find best fee tier
        (uint256 expectedOut, uint24 bestFee) = getBestQuote(tokenIn, tokenOut, amountIn);
        require(expectedOut >= amountOutMin, "Slippage exceeded");

        // Transfer tokens from sender
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Approve router
        IERC20(tokenIn).approve(address(router), amountIn);

        // Execute swap
        IUniswapV3Router.ExactInputSingleParams memory params = IUniswapV3Router.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: bestFee,
            recipient: recipient,
            deadline: block.timestamp + 300,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0 // No price limit
        });

        amountOut = router.exactInputSingle(params);

        emit SwapExecuted(tokenIn, tokenOut, amountIn, amountOut, bestFee);
    }

    /**
     * @notice Execute swap with specific fee tier.
     */
    function swapWithFee(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address recipient,
        uint24 fee
    ) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Amount zero");

        // Transfer tokens
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Approve router
        IERC20(tokenIn).approve(address(router), amountIn);

        // Execute swap
        IUniswapV3Router.ExactInputSingleParams memory params = IUniswapV3Router.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: recipient,
            deadline: block.timestamp + 300,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });

        amountOut = router.exactInputSingle(params);

        emit SwapExecuted(tokenIn, tokenOut, amountIn, amountOut, fee);
    }

    /**
     * @notice Get available fee tiers.
     */
    function getFeeTiers() external view returns (uint24[] memory) {
        return feeTiers;
    }
}
