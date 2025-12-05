// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./ChainlinkOracle.sol";

/**
 * @title TWAPOracle
 * @notice Time-Weighted Average Price oracle to prevent flash loan price manipulation
 * @dev Maintains price history and calculates TWAP over configurable periods
 */
contract TWAPOracle is Ownable {
    ChainlinkOracle public immutable chainlinkOracle;
    
    // TWAP configuration
    uint256 public constant TWAP_PERIOD = 30 minutes;
    uint256 public constant MAX_PRICE_DEVIATION = 1000; // 10% in basis points
    uint256 public constant MIN_OBSERVATIONS = 3;
    
    // Price observation structure
    struct PriceObservation {
        uint256 price;
        uint256 timestamp;
        uint256 cumulativePrice;
    }
    
    // Token => array of price observations
    mapping(address => PriceObservation[]) public priceHistory;
    
    // Token => last update timestamp
    mapping(address => uint256) public lastUpdateTime;
    
    // Token => cumulative price
    mapping(address => uint256) public cumulativePrice;
    
    // Events
    event PriceUpdated(address indexed token, uint256 price, uint256 timestamp);
    event CircuitBreakerTriggered(address indexed token, uint256 oldPrice, uint256 newPrice, uint256 deviation);
    event TWAPCalculated(address indexed token, uint256 twap, uint256 spotPrice);
    
    constructor(address _chainlinkOracle) Ownable(msg.sender) {
        require(_chainlinkOracle != address(0), "Invalid oracle");
        chainlinkOracle = ChainlinkOracle(_chainlinkOracle);
    }
    
    /**
     * @notice Update price observation for a token
     * @dev Should be called periodically (e.g., every 5-10 minutes)
     * @param token Token address to update
     */
    function updatePrice(address token) external {
        require(token != address(0), "Invalid token");
        
        // Get current price from Chainlink
        uint256 currentPrice = chainlinkOracle.getPrice(token);
        uint256 currentTime = block.timestamp;
        
        PriceObservation[] storage history = priceHistory[token];
        
        // Check for circuit breaker if we have previous data
        if (history.length > 0) {
            uint256 lastPrice = history[history.length - 1].price;
            uint256 deviation = _calculateDeviation(lastPrice, currentPrice);
            
            if (deviation > MAX_PRICE_DEVIATION) {
                emit CircuitBreakerTriggered(token, lastPrice, currentPrice, deviation);
                revert("Price deviation too high");
            }
        }
        
        // Calculate cumulative price
        uint256 timeDelta = currentTime - lastUpdateTime[token];
        if (timeDelta > 0 && history.length > 0) {
            uint256 lastPrice = history[history.length - 1].price;
            cumulativePrice[token] += lastPrice * timeDelta;
        }
        
        // Add new observation
        history.push(PriceObservation({
            price: currentPrice,
            timestamp: currentTime,
            cumulativePrice: cumulativePrice[token]
        }));
        
        lastUpdateTime[token] = currentTime;
        
        // Clean up old observations (keep last 24 hours)
        _cleanOldObservations(token);
        
        emit PriceUpdated(token, currentPrice, currentTime);
    }
    
    /**
     * @notice Get Time-Weighted Average Price for a token
     * @param token Token address
     * @return TWAP over the configured period
     */
    function getTWAP(address token) external view returns (uint256) {
        PriceObservation[] storage history = priceHistory[token];
        require(history.length >= MIN_OBSERVATIONS, "Insufficient price data");
        
        uint256 currentTime = block.timestamp;
        uint256 targetTime = currentTime - TWAP_PERIOD;
        
        // Find the observation closest to targetTime
        uint256 startIndex = _findObservationIndex(token, targetTime);
        uint256 endIndex = history.length - 1;
        
        require(startIndex < endIndex, "Insufficient time range");
        
        // Calculate TWAP
        uint256 startCumulative = history[startIndex].cumulativePrice;
        uint256 endCumulative = history[endIndex].cumulativePrice;
        uint256 timeElapsed = history[endIndex].timestamp - history[startIndex].timestamp;
        
        require(timeElapsed > 0, "Invalid time range");
        
        uint256 twap = (endCumulative - startCumulative) / timeElapsed;
        
        return twap;
    }
    
    /**
     * @notice Get current spot price (latest observation)
     * @param token Token address
     * @return Latest price
     */
    function getSpotPrice(address token) external view returns (uint256) {
        PriceObservation[] storage history = priceHistory[token];
        require(history.length > 0, "No price data");
        return history[history.length - 1].price;
    }
    
    /**
     * @notice Get price with flash loan protection
     * @dev Returns TWAP if available, otherwise spot price
     * @param token Token address
     * @return Protected price
     */
    function getProtectedPrice(address token) external view returns (uint256) {
        PriceObservation[] storage history = priceHistory[token];
        
        // If we have enough data for TWAP, use it
        if (history.length >= MIN_OBSERVATIONS) {
            uint256 currentTime = block.timestamp;
            uint256 targetTime = currentTime - TWAP_PERIOD;
            
            // Check if we have data spanning the TWAP period
            if (history[0].timestamp <= targetTime) {
                return this.getTWAP(token);
            }
        }
        
        // Fall back to spot price if TWAP not available
        require(history.length > 0, "No price data");
        return history[history.length - 1].price;
    }
    
    /**
     * @notice Check if price is safe to use (not being manipulated)
     * @param token Token address
     * @return true if price is safe
     */
    function isPriceSafe(address token) external view returns (bool) {
        PriceObservation[] storage history = priceHistory[token];
        
        if (history.length < MIN_OBSERVATIONS) {
            return false;
        }
        
        // Compare TWAP vs spot price
        uint256 twap = this.getTWAP(token);
        uint256 spot = history[history.length - 1].price;
        
        uint256 deviation = _calculateDeviation(twap, spot);
        
        // If deviation is too high, price might be manipulated
        return deviation <= MAX_PRICE_DEVIATION;
    }
    
    /**
     * @notice Get number of price observations for a token
     * @param token Token address
     * @return Number of observations
     */
    function getObservationCount(address token) external view returns (uint256) {
        return priceHistory[token].length;
    }
    
    // Internal functions
    
    function _calculateDeviation(uint256 price1, uint256 price2) internal pure returns (uint256) {
        if (price1 == 0 || price2 == 0) return type(uint256).max;
        
        uint256 diff = price1 > price2 ? price1 - price2 : price2 - price1;
        return (diff * 10000) / price1;
    }
    
    function _findObservationIndex(address token, uint256 targetTime) internal view returns (uint256) {
        PriceObservation[] storage history = priceHistory[token];
        
        // Binary search for closest observation
        uint256 left = 0;
        uint256 right = history.length - 1;
        
        while (left < right) {
            uint256 mid = (left + right) / 2;
            
            if (history[mid].timestamp < targetTime) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }
        
        return left;
    }
    
    function _cleanOldObservations(address token) internal {
        PriceObservation[] storage history = priceHistory[token];
        uint256 cutoffTime = block.timestamp - 24 hours;
        
        // Find first observation to keep
        uint256 keepFrom = 0;
        for (uint256 i = 0; i < history.length; i++) {
            if (history[i].timestamp >= cutoffTime) {
                keepFrom = i;
                break;
            }
        }
        
        // Remove old observations
        if (keepFrom > 0) {
            for (uint256 i = keepFrom; i < history.length; i++) {
                history[i - keepFrom] = history[i];
            }
            
            for (uint256 i = 0; i < keepFrom; i++) {
                history.pop();
            }
        }
    }
}
