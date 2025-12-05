// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "../defi/LeverageManager.sol";
import "../oracles/TWAPOracle.sol";

/**
 * @title CascadingLiquidationHandler
 * @notice Handles multiple liquidations efficiently to prevent system overload
 * @dev Implements priority queue and batch processing for liquidations
 */
contract CascadingLiquidationHandler is AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    
    LeverageManager public immutable leverageManager;
    TWAPOracle public immutable twapOracle;
    
    // Liquidation queue configuration
    uint256 public constant MAX_BATCH_SIZE = 50;
    uint256 public constant MIN_HEALTH_FACTOR = 1e18; // 1.0
    uint256 public constant LIQUIDATION_BONUS = 500; // 5%
    uint256 public constant MAX_GAS_PER_LIQUIDATION = 500000;
    
    // Liquidation priority levels
    enum Priority {
        LOW,        // Health factor 0.9-1.0
        MEDIUM,     // Health factor 0.7-0.9
        HIGH,       // Health factor 0.5-0.7
        CRITICAL    // Health factor < 0.5
    }
    
    // Liquidation request structure
    struct LiquidationRequest {
        address user;
        address adapter;
        uint256 healthFactor;
        uint256 debtValue;
        uint256 timestamp;
        Priority priority;
        bool processed;
    }
    
    // State variables
    LiquidationRequest[] public liquidationQueue;
    mapping(address => mapping(address => uint256)) public userLiquidationIndex;
    
    uint256 public totalLiquidationsProcessed;
    uint256 public totalValueLiquidated;
    uint256 public failedLiquidations;
    
    // Circuit breaker
    bool public circuitBreakerActive;
    uint256 public constant MAX_LIQUIDATIONS_PER_BLOCK = 20;
    uint256 public liquidationsThisBlock;
    uint256 public lastLiquidationBlock;
    
    // Events
    event LiquidationQueued(
        address indexed user,
        address indexed adapter,
        uint256 healthFactor,
        Priority priority,
        uint256 queueIndex
    );
    
    event LiquidationProcessed(
        address indexed user,
        address indexed adapter,
        address indexed liquidator,
        uint256 debtRepaid,
        uint256 collateralSeized,
        uint256 bonus
    );
    
    event LiquidationFailed(
        address indexed user,
        address indexed adapter,
        string reason
    );
    
    event CircuitBreakerTriggered(uint256 liquidationCount, uint256 blockNumber);
    event CircuitBreakerReset();
    event BatchProcessed(uint256 count, uint256 gasUsed);
    
    constructor(address _leverageManager, address _twapOracle) {
        require(_leverageManager != address(0), "Invalid leverage manager");
        require(_twapOracle != address(0), "Invalid TWAP oracle");
        
        leverageManager = LeverageManager(_leverageManager);
        twapOracle = TWAPOracle(_twapOracle);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
    }
    
    /**
     * @notice Queue a position for liquidation
     * @param user User address
     * @param adapter Strategy adapter address
     */
    function queueLiquidation(
        address user,
        address adapter
    ) external onlyRole(KEEPER_ROLE) whenNotPaused {
        require(user != address(0), "Invalid user");
        require(adapter != address(0), "Invalid adapter");
        
        // Check if already queued
        uint256 existingIndex = userLiquidationIndex[user][adapter];
        if (existingIndex > 0 && !liquidationQueue[existingIndex - 1].processed) {
            revert("Already queued");
        }
        
        // Get health factor
        uint256 healthFactor = leverageManager.getHealthFactor(user);
        require(healthFactor < MIN_HEALTH_FACTOR, "Position healthy");
        
        // Determine priority
        Priority priority = _determinePriority(healthFactor);
        
        // Get debt value
        uint256 debtValue = leverageManager.getUserDebt(user);
        
        // Create liquidation request
        LiquidationRequest memory request = LiquidationRequest({
            user: user,
            adapter: adapter,
            healthFactor: healthFactor,
            debtValue: debtValue,
            timestamp: block.timestamp,
            priority: priority,
            processed: false
        });
        
        // Add to queue
        liquidationQueue.push(request);
        uint256 queueIndex = liquidationQueue.length - 1;
        userLiquidationIndex[user][adapter] = queueIndex + 1;
        
        emit LiquidationQueued(user, adapter, healthFactor, priority, queueIndex);
    }
    
    /**
     * @notice Process liquidations in batch
     * @param maxCount Maximum number of liquidations to process
     * @return processed Number of liquidations processed
     */
    function processBatch(uint256 maxCount) 
        external 
        onlyRole(LIQUIDATOR_ROLE) 
        nonReentrant 
        whenNotPaused 
        returns (uint256 processed) 
    {
        require(maxCount > 0 && maxCount <= MAX_BATCH_SIZE, "Invalid batch size");
        
        // Check circuit breaker
        if (block.number != lastLiquidationBlock) {
            liquidationsThisBlock = 0;
            lastLiquidationBlock = block.number;
            if (circuitBreakerActive) {
                circuitBreakerActive = false;
                emit CircuitBreakerReset();
            }
        }
        
        if (circuitBreakerActive) {
            revert("Circuit breaker active");
        }
        
        uint256 gasStart = gasleft();
        uint256 count = 0;
        
        // Get priority-sorted indices
        uint256[] memory sortedIndices = _getSortedLiquidations(maxCount);
        
        for (uint256 i = 0; i < sortedIndices.length && count < maxCount; i++) {
            uint256 index = sortedIndices[i];
            LiquidationRequest storage request = liquidationQueue[index];
            
            if (request.processed) continue;
            
            // Check gas limit
            if (gasleft() < MAX_GAS_PER_LIQUIDATION) {
                break;
            }
            
            // Process liquidation
            bool success = _processLiquidation(request);
            
            if (success) {
                request.processed = true;
                count++;
                liquidationsThisBlock++;
                
                // Check circuit breaker
                if (liquidationsThisBlock >= MAX_LIQUIDATIONS_PER_BLOCK) {
                    circuitBreakerActive = true;
                    emit CircuitBreakerTriggered(liquidationsThisBlock, block.number);
                    break;
                }
            }
        }
        
        uint256 gasUsed = gasStart - gasleft();
        emit BatchProcessed(count, gasUsed);
        
        return count;
    }
    
    /**
     * @notice Get liquidatable positions count by priority
     * @return critical Count of critical priority liquidations
     * @return high Count of high priority liquidations
     * @return medium Count of medium priority liquidations
     * @return low Count of low priority liquidations
     */
    function getLiquidationStats() external view returns (
        uint256 critical,
        uint256 high,
        uint256 medium,
        uint256 low
    ) {
        for (uint256 i = 0; i < liquidationQueue.length; i++) {
            if (liquidationQueue[i].processed) continue;
            
            if (liquidationQueue[i].priority == Priority.CRITICAL) {
                critical++;
            } else if (liquidationQueue[i].priority == Priority.HIGH) {
                high++;
            } else if (liquidationQueue[i].priority == Priority.MEDIUM) {
                medium++;
            } else {
                low++;
            }
        }
    }
    
    /**
     * @notice Get total value at risk
     * @return Total debt value of unprocessed liquidations
     */
    function getTotalValueAtRisk() external view returns (uint256) {
        uint256 total = 0;
        
        for (uint256 i = 0; i < liquidationQueue.length; i++) {
            if (!liquidationQueue[i].processed) {
                total += liquidationQueue[i].debtValue;
            }
        }
        
        return total;
    }
    
    /**
     * @notice Emergency pause
     */
    function emergencyPause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @notice Unpause
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    // Internal functions
    
    function _processLiquidation(
        LiquidationRequest storage request
    ) internal returns (bool) {
        try leverageManager.liquidate(
            request.user,
            msg.sender
        ) returns (uint256 debtRepaid, uint256 collateralSeized) {
            
            uint256 bonus = (collateralSeized * LIQUIDATION_BONUS) / 10000;
            
            totalLiquidationsProcessed++;
            totalValueLiquidated += debtRepaid;
            
            emit LiquidationProcessed(
                request.user,
                request.adapter,
                msg.sender,
                debtRepaid,
                collateralSeized,
                bonus
            );
            
            return true;
            
        } catch Error(string memory reason) {
            failedLiquidations++;
            emit LiquidationFailed(request.user, request.adapter, reason);
            return false;
        } catch {
            failedLiquidations++;
            emit LiquidationFailed(request.user, request.adapter, "Unknown error");
            return false;
        }
    }
    
    function _determinePriority(uint256 healthFactor) internal pure returns (Priority) {
        if (healthFactor < 5e17) {
            return Priority.CRITICAL; // < 0.5
        } else if (healthFactor < 7e17) {
            return Priority.HIGH; // 0.5-0.7
        } else if (healthFactor < 9e17) {
            return Priority.MEDIUM; // 0.7-0.9
        } else {
            return Priority.LOW; // 0.9-1.0
        }
    }
    
    function _getSortedLiquidations(uint256 maxCount) internal view returns (uint256[] memory) {
        // Get unprocessed liquidations
        uint256[] memory unprocessed = new uint256[](liquidationQueue.length);
        uint256 count = 0;
        
        for (uint256 i = 0; i < liquidationQueue.length; i++) {
            if (!liquidationQueue[i].processed) {
                unprocessed[count] = i;
                count++;
            }
        }
        
        // Sort by priority (bubble sort for simplicity, can optimize)
        for (uint256 i = 0; i < count; i++) {
            for (uint256 j = i + 1; j < count; j++) {
                if (_comparePriority(unprocessed[i], unprocessed[j])) {
                    uint256 temp = unprocessed[i];
                    unprocessed[i] = unprocessed[j];
                    unprocessed[j] = temp;
                }
            }
        }
        
        // Return top maxCount
        uint256 returnCount = count < maxCount ? count : maxCount;
        uint256[] memory result = new uint256[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            result[i] = unprocessed[i];
        }
        
        return result;
    }
    
    function _comparePriority(uint256 index1, uint256 index2) internal view returns (bool) {
        LiquidationRequest storage req1 = liquidationQueue[index1];
        LiquidationRequest storage req2 = liquidationQueue[index2];
        
        // Higher priority (CRITICAL > HIGH > MEDIUM > LOW)
        if (req1.priority != req2.priority) {
            return req1.priority < req2.priority;
        }
        
        // Same priority: lower health factor first
        if (req1.healthFactor != req2.healthFactor) {
            return req1.healthFactor > req2.healthFactor;
        }
        
        // Same health: older timestamp first
        return req1.timestamp > req2.timestamp;
    }
}
