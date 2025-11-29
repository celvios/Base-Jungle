// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IAerodromeRouter.sol";

// Aerodrome Pair Interface
interface IAerodromePair {
    function balanceOf(address owner) external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function getReserves() external view returns (uint256 reserve0, uint256 reserve1, uint256 blockTimestampLast);
    function token0() external view returns (address);
    function token1() external view returns (address);
}

/**
 * @title AerodromeLPAdapter
 * @notice Adapter for providing liquidity to Aerodrome pools on Base.
 * @dev Supports both stable and volatile pools.
 */
contract AerodromeLPAdapter is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");

    address public immutable router;
    address public immutable tokenA;
    address public immutable tokenB;
    address public immutable pair;
    bool public immutable isStable;

    event LiquidityAdded(uint256 amountA, uint256 amountB, uint256 liquidity);
    event LiquidityRemoved(uint256 amountA, uint256 amountB, uint256 liquidity);

    constructor(
        address _router,
        address _tokenA,
        address _tokenB,
        address _pair,
        bool _isStable
    ) {
        require(_router != address(0), "Invalid router");
        require(_tokenA != address(0), "Invalid tokenA");
        require(_tokenB != address(0), "Invalid tokenB");
        require(_pair != address(0), "Invalid pair");

        router = _router;
        tokenA = _tokenA;
        tokenB = _tokenB;
        pair = _pair;
        isStable = _isStable;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Add liquidity to Aerodrome pool.
     */
    function addLiquidity(
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) external onlyRole(VAULT_ROLE) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        // Transfer tokens from vault
        IERC20(tokenA).safeTransferFrom(msg.sender, address(this), amountADesired);
        IERC20(tokenB).safeTransferFrom(msg.sender, address(this), amountBDesired);

        // Approve router
        IERC20(tokenA).approve(router, amountADesired);
        IERC20(tokenB).approve(router, amountBDesired);

        // Add liquidity
        (amountA, amountB, liquidity) = IAerodromeRouter(router).addLiquidity(
            tokenA,
            tokenB,
            isStable,
            amountADesired,
            amountBDesired,
            amountAMin,
            amountBMin,
            address(this),
            block.timestamp + 300
        );

        // Return unused tokens
        uint256 unusedA = amountADesired - amountA;
        uint256 unusedB = amountBDesired - amountB;
        
        if (unusedA > 0) {
            IERC20(tokenA).safeTransfer(msg.sender, unusedA);
        }
        if (unusedB > 0) {
            IERC20(tokenB).safeTransfer(msg.sender, unusedB);
        }

        emit LiquidityAdded(amountA, amountB, liquidity);
    }

    /**
     * @notice Remove liquidity from Aerodrome pool.
     */
    function removeLiquidity(
        uint256 lpAmount,
        uint256 amountAMin,
        uint256 amountBMin
    ) external onlyRole(VAULT_ROLE) returns (uint256 amountA, uint256 amountB) {
        // Approve router to spend LP tokens
        IERC20(pair).approve(router, lpAmount);

        // Remove liquidity
        (amountA, amountB) = IAerodromeRouter(router).removeLiquidity(
            tokenA,
            tokenB,
            isStable,
            lpAmount,
            amountAMin,
            amountBMin,
            msg.sender,  // Send tokens to vault
            block.timestamp + 300
        );

        emit LiquidityRemoved(amountA, amountB, lpAmount);
    }

    /**
     * @notice Get LP token balance.
     */
    function getLPBalance() external view returns (uint256) {
        return IAerodromePair(pair).balanceOf(address(this));
    }

    /**
     * @notice Calculate share of pool reserves.
     */
    function getShareOfPool() external view returns (uint256 amountA, uint256 amountB) {
        uint256 lpBalance = IAerodromePair(pair).balanceOf(address(this));
        uint256 totalSupply = IAerodromePair(pair).totalSupply();
        
        if (totalSupply == 0) return (0, 0);

        (uint256 reserve0, uint256 reserve1,) = IAerodromePair(pair).getReserves();

        // Determine token order
        address token0 = IAerodromePair(pair).token0();
        
        if (token0 == tokenA) {
            amountA = (lpBalance * reserve0) / totalSupply;
            amountB = (lpBalance * reserve1) / totalSupply;
        } else {
            amountA = (lpBalance * reserve1) / totalSupply;
            amountB = (lpBalance * reserve0) / totalSupply;
        }
    }

    /**
     * @notice Calculate impermanent loss.
     * @dev Simplified IL calculation: IL = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1
     * @return ilPercentage IL in basis points (negative number)
     */
    function calculateImpermanentLoss(
        uint256 initialPriceRatio,  // Initial priceB/priceA (scaled by 1e18)
        uint256 currentPriceRatio   // Current priceB/priceA (scaled by 1e18)
    ) public pure returns (int256 ilPercentage) {
        if (initialPriceRatio == 0 || currentPriceRatio == 0) return 0;

        // Simplified: if price ratio changed by 2x, IL is ~5.7%
        // For exact calculation, would need sqrt function
        // Using approximation: IL ≈ (price_change - 1)^2 / 8
        
        uint256 ratio = (currentPriceRatio * 1e18) / initialPriceRatio;
        
        if (ratio > 1e18) {
            // Price increased
            uint256 change = ratio - 1e18;
            uint256 ilAbs = (change * change) / (8 * 1e18);
            ilPercentage = -int256((ilAbs * 10000) / 1e18); // Convert to basis points
        } else {
            // Price decreased
            uint256 change = 1e18 - ratio;
            uint256 ilAbs = (change * change) / (8 * 1e18);
            ilPercentage = -int256((ilAbs * 10000) / 1e18);
        }
    }
}
