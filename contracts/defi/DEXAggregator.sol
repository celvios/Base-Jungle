// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IAerodromeRouter.sol";

import "../interfaces/IUniswapV3Router.sol";

/**
 * @title DEXAggregator
 * @notice Aggregates swap routing across Aerodrome and Uniswap V3 on Base.
 * @dev Finds best execution price with slippage protection across multiple DEXs.
 */
contract DEXAggregator is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ROUTER_ADMIN_ROLE = keccak256("ROUTER_ADMIN_ROLE");

    // Aerodrome router on Base
    address public aerodromeRouter;
    
    // Uniswap V3 router and quoter on Base
    address public uniswapV3Router;
    address public uniswapV3Quoter;
    
    // Fee tiers for UniV3
    uint24[] public uniV3FeeTiers;
    
    // Max slippage in basis points (default: 0.5% = 50)
    uint256 public maxSlippage = 50;
    uint256 public constant BASIS_POINTS = 10000;

    // Whitelisted tokens
    mapping(address => bool) public whitelistedTokens;

    event RouterUpdated(address indexed router, string routerType);
    event SwapExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        address indexed recipient,
        string dex
    );
    event SlippageUpdated(uint256 newSlippage);
    event TokenWhitelisted(address indexed token, bool status);

    constructor(address _aerodromeRouter, address _uniV3Router, address _uniV3Quoter) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ROUTER_ADMIN_ROLE, msg.sender);

        require(_aerodromeRouter != address(0), "Invalid Aero router");
        aerodromeRouter = _aerodromeRouter;
        
        if (_uniV3Router != address(0)) {
            uniswapV3Router = _uniV3Router;
            uniswapV3Quoter = _uniV3Quoter;
            
            // Set default UniV3 fee tiers
            uniV3FeeTiers.push(500);    // 0.05%
            uniV3FeeTiers.push(3000);   // 0.3%
            uniV3FeeTiers.push(10000);  // 1%
        }
    }

    /**
     * @notice Update Uniswap V3 router addresses.
     */
    function setUniswapV3Router(address _router, address _quoter) external onlyRole(ROUTER_ADMIN_ROLE) {
        require(_router != address(0), "Invalid router");
        require(_quoter != address(0), "Invalid quoter");
        uniswapV3Router = _router;
        uniswapV3Quoter = _quoter;
        emit RouterUpdated(_router, "UniswapV3");
    }

    /**
     * @notice Update Aerodrome router address.
     */
    function setAerodromeRouter(address _router) external onlyRole(ROUTER_ADMIN_ROLE) {
        require(_router != address(0), "Invalid router");
        aerodromeRouter = _router;
        emit RouterUpdated(_router, "Aerodrome");
    }

    /**
     * @notice Update max slippage tolerance.
     * @param _slippage Slippage in basis points (50 = 0.5%)
     */
    function setMaxSlippage(uint256 _slippage) external onlyRole(ROUTER_ADMIN_ROLE) {
        require(_slippage <= 1000, "Slippage too high"); // Max 10%
        maxSlippage = _slippage;
        emit SlippageUpdated(_slippage);
    }

    /**
     * @notice Whitelist/blacklist a token.
     */
    function setTokenWhitelist(address token, bool status) external onlyRole(ROUTER_ADMIN_ROLE) {
        whitelistedTokens[token] = status;
        emit TokenWhitelisted(token, status);
    }

    /**
     * @notice Execute swap via Aerodrome.
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param amountIn Amount of input tokens
     * @param amountOutMin Minimum output amount (slippage protection)
     * @param recipient Recipient of output tokens
     * @param stable Whether to use stable pool
     * @return amountOut Actual output amount
     */
    function swapAerodrome(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOutMin,
        address recipient,
        bool stable
    ) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Amount zero");
        require(tokenIn != tokenOut, "Same token");

        // Transfer tokens from sender
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Approve router
        IERC20(tokenIn).approve(aerodromeRouter, amountIn);

        // Build route
        IAerodromeRouter.Route[] memory routes = new IAerodromeRouter.Route[](1);
        routes[0] = IAerodromeRouter.Route({
            from: tokenIn,
            to: tokenOut,
            stable: stable
        });

        // Execute swap
        uint256[] memory amounts = IAerodromeRouter(aerodromeRouter).swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            routes,
            recipient,
            block.timestamp + 300 // 5 min deadline
        );

        amountOut = amounts[amounts.length - 1];

        emit SwapExecuted(tokenIn, tokenOut, amountIn, amountOut, recipient, "Aerodrome");
    }

    /**
     * @notice Get quote from Aerodrome.
     * @param tokenIn Input token
     * @param tokenOut Output token
     * @param amountIn Input amount
     * @param stable Whether to use stable pool
     * @return amountOut Expected output amount
     */
    function getAerodromeQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        bool stable
    ) public view returns (uint256 amountOut) {
        if (amountIn == 0) return 0;

        IAerodromeRouter.Route[] memory routes = new IAerodromeRouter.Route[](1);
        routes[0] = IAerodromeRouter.Route({
            from: tokenIn,
            to: tokenOut,
            stable: stable
        });

        try IAerodromeRouter(aerodromeRouter).getAmountsOut(amountIn, routes) returns (uint256[] memory amounts) {
            amountOut = amounts[amounts.length - 1];
        } catch {
            amountOut = 0;
        }
    }

    /**
     * @notice Get quote from UniswapV3 (best fee tier).
     */
    function getUniV3Quote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) public returns (uint256 amountOut) {
        if (amountIn == 0 || uniswapV3Quoter == address(0)) return 0;

        IUniswapV3Quoter quoter = IUniswapV3Quoter(uniswapV3Quoter);
        uint256 bestQuote = 0;

        // Try all fee tiers, pick best
        for (uint256 i = 0; i < uniV3FeeTiers.length; i++) {
            try quoter.quoteExactInputSingle(
                tokenIn,
                tokenOut,
                uniV3FeeTiers[i],
                amountIn,
                0
            ) returns (uint256 quote) {
                if (quote > bestQuote) {
                    bestQuote = quote;
                }
            } catch {
                continue;
            }
        }

        return bestQuote;
    }

    /**
     * @notice Get best route across all DEXs and execute swap.
     * @dev Compares Aerodrome (stable/volatile) vs UniswapV3, picks best price.
     */
    function swapBestRoute(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address recipient
    ) external nonReentrant returns (uint256 amountOut) {
        require(amountIn > 0, "Amount zero");

        // Get quotes from all sources
        uint256 aeroStable = getAerodromeQuote(tokenIn, tokenOut, amountIn, true);
        uint256 aeroVolatile = getAerodromeQuote(tokenIn, tokenOut, amountIn, false);
        uint256 uniV3Quote = getUniV3Quote(tokenIn, tokenOut, amountIn);

        // Find best quote and DEX
        uint256 bestQuote = aeroStable;
        uint8 bestDex = 0; // 0=Aero Stable, 1=Aero Volatile, 2=UniV3
        bool useStable = true;

        if (aeroVolatile > bestQuote) {
            bestQuote = aeroVolatile;
            bestDex = 1;
            useStable = false;
        }

        if (uniV3Quote > bestQuote) {
            bestQuote = uniV3Quote;
            bestDex = 2;
        }

        require(bestQuote > 0, "No liquidity");

        // Calculate min output with slippage
        uint256 minOut = (bestQuote * (BASIS_POINTS - maxSlippage)) / BASIS_POINTS;

        // Transfer tokens
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        // Execute swap on best DEX
        if (bestDex == 2) {
            // Use UniswapV3
            IERC20(tokenIn).approve(uniswapV3Router, amountIn);

            // Find best fee tier again
            uint24 bestFee = 3000; // Default
            uint256 bestFeeQuote = 0;
            IUniswapV3Quoter quoter = IUniswapV3Quoter(uniswapV3Quoter);

            for (uint256 i = 0; i < uniV3FeeTiers.length; i++) {
                try quoter.quoteExactInputSingle(tokenIn, tokenOut, uniV3FeeTiers[i], amountIn, 0) 
                    returns (uint256 quote) {
                    if (quote > bestFeeQuote) {
                        bestFeeQuote = quote;
                        bestFee = uniV3FeeTiers[i];
                    }
                } catch {
                    continue;
                }
            }

            IUniswapV3Router.ExactInputSingleParams memory params = IUniswapV3Router.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: bestFee,
                recipient: recipient,
                deadline: block.timestamp + 300,
                amountIn: amountIn,
                amountOutMinimum: minOut,
                sqrtPriceLimitX96: 0
            });

            amountOut = IUniswapV3Router(uniswapV3Router).exactInputSingle(params);
        } else {
            // Use Aerodrome
            IERC20(tokenIn).approve(aerodromeRouter, amountIn);

            IAerodromeRouter.Route[] memory routes = new IAerodromeRouter.Route[](1);
            routes[0] = IAerodromeRouter.Route({
                from: tokenIn,
                to: tokenOut,
                stable: useStable
            });

            uint256[] memory amounts = IAerodromeRouter(aerodromeRouter).swapExactTokensForTokens(
                amountIn,
                minOut,
                routes,
                recipient,
                block.timestamp + 300
            );

            amountOut = amounts[amounts.length - 1];
        }

        emit SwapExecuted(tokenIn, tokenOut, amountIn, amountOut, recipient, 
            bestDex == 0 ? "Aerodrome-Stable" : bestDex == 1 ? "Aerodrome-Volatile" : "UniswapV3");
    }

    /**
     * @notice Calculate minimum output with slippage protection.
     */
    function calculateMinOutput(uint256 expectedOut) public view returns (uint256) {
        return (expectedOut * (BASIS_POINTS - maxSlippage)) / BASIS_POINTS;
    }
}
