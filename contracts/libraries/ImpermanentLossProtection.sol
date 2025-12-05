// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title ImpermanentLossProtection
 * @notice Library to calculate and warn about impermanent loss in LP positions
 * @dev Provides IL calculations and risk assessment for liquidity provision
 */
library ImpermanentLossProtection {
    using Math for uint256;
    
    // IL severity levels
    enum ILSeverity {
        SAFE,           // < 0.5% IL
        LOW,            // 0.5% - 2% IL
        MEDIUM,         // 2% - 5% IL
        HIGH,           // 5% - 10% IL
        CRITICAL        // > 10% IL
    }
    
    // IL warning thresholds (in basis points)
    uint256 constant IL_SAFE_THRESHOLD = 50;        // 0.5%
    uint256 constant IL_LOW_THRESHOLD = 200;        // 2%
    uint256 constant IL_MEDIUM_THRESHOLD = 500;     // 5%
    uint256 constant IL_HIGH_THRESHOLD = 1000;      // 10%
    
    // Price change thresholds for warnings
    uint256 constant PRICE_CHANGE_WARNING = 1000;   // 10%
    uint256 constant PRICE_CHANGE_CRITICAL = 5000;  // 50%
    
    /**
     * @notice Calculate impermanent loss percentage
     * @param initialPrice Initial price ratio (token1/token0)
     * @param currentPrice Current price ratio (token1/token0)
     * @return ilPercent IL as basis points (10000 = 100%)
     */
    function calculateIL(
        uint256 initialPrice,
        uint256 currentPrice
    ) internal pure returns (uint256 ilPercent) {
        require(initialPrice > 0 && currentPrice > 0, "Invalid prices");
        
        // IL formula: IL = 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
        // Where priceRatio = currentPrice / initialPrice
        
        uint256 priceRatio = (currentPrice * 1e18) / initialPrice;
        
        // Calculate sqrt(priceRatio)
        uint256 sqrtRatio = Math.sqrt(priceRatio);
        
        // Calculate 2 * sqrt(priceRatio)
        uint256 numerator = 2 * sqrtRatio;
        
        // Calculate (1 + priceRatio)
        uint256 denominator = 1e18 + priceRatio;
        
        // Calculate the fraction
        uint256 fraction = (numerator * 1e18) / denominator;
        
        // Calculate IL = fraction - 1
        if (fraction >= 1e18) {
            // No IL (this shouldn't happen with correct math)
            return 0;
        }
        
        uint256 il = 1e18 - fraction;
        
        // Convert to basis points
        ilPercent = (il * 10000) / 1e18;
        
        return ilPercent;
    }
    
    /**
     * @notice Get IL severity level
     * @param ilPercent IL percentage in basis points
     * @return Severity level
     */
    function getILSeverity(uint256 ilPercent) internal pure returns (ILSeverity) {
        if (ilPercent < IL_SAFE_THRESHOLD) {
            return ILSeverity.SAFE;
        } else if (ilPercent < IL_LOW_THRESHOLD) {
            return ILSeverity.LOW;
        } else if (ilPercent < IL_MEDIUM_THRESHOLD) {
            return ILSeverity.MEDIUM;
        } else if (ilPercent < IL_HIGH_THRESHOLD) {
            return ILSeverity.HIGH;
        } else {
            return ILSeverity.CRITICAL;
        }
    }
    
    /**
     * @notice Check if IL is acceptable for operation
     * @param ilPercent IL percentage in basis points
     * @param maxAcceptableIL Maximum acceptable IL in basis points
     * @return true if IL is acceptable
     */
    function isILAcceptable(
        uint256 ilPercent,
        uint256 maxAcceptableIL
    ) internal pure returns (bool) {
        return ilPercent <= maxAcceptableIL;
    }
    
    /**
     * @notice Calculate price change percentage
     * @param initialPrice Initial price
     * @param currentPrice Current price
     * @return changePercent Price change in basis points
     */
    function calculatePriceChange(
        uint256 initialPrice,
        uint256 currentPrice
    ) internal pure returns (uint256 changePercent) {
        require(initialPrice > 0, "Invalid initial price");
        
        uint256 diff = currentPrice > initialPrice
            ? currentPrice - initialPrice
            : initialPrice - currentPrice;
        
        changePercent = (diff * 10000) / initialPrice;
        
        return changePercent;
    }
    
    /**
     * @notice Estimate potential IL for a given price change
     * @param priceChangePercent Expected price change in basis points
     * @return Estimated IL in basis points
     */
    function estimateILForPriceChange(
        uint256 priceChangePercent
    ) internal pure returns (uint256) {
        // Approximate IL based on price change
        // This is a simplified estimation
        
        if (priceChangePercent < 1000) {
            // < 10% change: IL ≈ 0.5%
            return 50;
        } else if (priceChangePercent < 2500) {
            // 10-25% change: IL ≈ 2%
            return 200;
        } else if (priceChangePercent < 5000) {
            // 25-50% change: IL ≈ 5.7%
            return 570;
        } else if (priceChangePercent < 10000) {
            // 50-100% change: IL ≈ 20%
            return 2000;
        } else {
            // > 100% change: IL > 20%
            return 2500;
        }
    }
    
    /**
     * @notice Get warning message for IL severity
     * @param severity IL severity level
     * @return warningCode Code representing the warning level
     */
    function getWarningCode(ILSeverity severity) internal pure returns (uint8) {
        if (severity == ILSeverity.SAFE) return 0;
        if (severity == ILSeverity.LOW) return 1;
        if (severity == ILSeverity.MEDIUM) return 2;
        if (severity == ILSeverity.HIGH) return 3;
        return 4; // CRITICAL
    }
    
    /**
     * @notice Calculate LP position value with IL
     * @param initialValue Initial position value
     * @param ilPercent IL percentage in basis points
     * @return Current position value after IL
     */
    function calculatePositionValueWithIL(
        uint256 initialValue,
        uint256 ilPercent
    ) internal pure returns (uint256) {
        // Value = initialValue * (1 - IL)
        uint256 ilLoss = (initialValue * ilPercent) / 10000;
        return initialValue - ilLoss;
    }
    
    /**
     * @notice Check if operation should be blocked due to high IL
     * @param ilPercent IL percentage in basis points
     * @return true if operation should be blocked
     */
    function shouldBlockOperation(uint256 ilPercent) internal pure returns (bool) {
        return ilPercent >= IL_HIGH_THRESHOLD;
    }
    
    /**
     * @notice Get recommended action based on IL
     * @param ilPercent IL percentage in basis points
     * @return actionCode 0=proceed, 1=warn, 2=confirm, 3=block
     */
    function getRecommendedAction(uint256 ilPercent) internal pure returns (uint8) {
        if (ilPercent < IL_SAFE_THRESHOLD) {
            return 0; // Proceed without warning
        } else if (ilPercent < IL_LOW_THRESHOLD) {
            return 1; // Show warning
        } else if (ilPercent < IL_HIGH_THRESHOLD) {
            return 2; // Require user confirmation
        } else {
            return 3; // Block operation
        }
    }
}
