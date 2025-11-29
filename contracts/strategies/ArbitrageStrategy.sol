// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./BalancerFlashLoanReceiver.sol";
import "../defi/DEXAggregator.sol";

/**
 * @title ArbitrageStrategy
 * @notice Automated cross-DEX arbitrage execution with flash loans
 * @dev Integrates with Balancer flash loans and DEXAggregator for swaps
 */
contract ArbitrageStrategy is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");

    BalancerFlashLoanReceiver public flashLoanReceiver;
    DEXAggregator public dexAggregator;

    // Configuration parameters
    uint256 public minProfitBasisPoints = 50;  // 0.5% minimum profit
    uint256 public maxGasPrice = 100 gwei;     // Maximum gas price for execution
    uint256 public maxFlashLoanAmount = 1_000_000 * 1e6; // $1M max (in USDC decimals)
    bool public paused = false;

    // Statistics
    uint256 public totalArbitragesExecuted;
    uint256 public totalProfit;
    uint256 public totalGasSpent;
    uint256 public failedAttempts;

    struct ArbitrageOpportunity {
        address tokenIn;           // Starting/ending token (flashloan token)
        address[] swapPath;        // Full swap path including tokenIn
        address[] dexAddresses;    // DEX to use for each swap
        uint256 flashLoanAmount;   // Amount to borrow
        uint256 estimatedProfit;   // Expected profit after fees
        uint256 deadline;          // Execution deadline
    }

    event ArbitrageExecuted(
        address indexed token,
        uint256 flashLoanAmount,
        uint256 profit,
        uint256 gasUsed,
        bytes32 indexed opportunityHash
    );

    event ArbitrageFailed(
        string reason,
        bytes32 indexed opportunityHash
    );

    event ParametersUpdated(
        uint256 minProfitBps,
        uint256 maxGasPrice,
        uint256 maxFlashLoan
    );

    event PauseToggled(bool paused);

    constructor(
        address _flashLoanReceiver,
        address _dexAggregator
    ) {
        require(_flashLoanReceiver != address(0), "Invalid flash loan receiver");
        require(_dexAggregator != address(0), "Invalid DEX aggregator");

        flashLoanReceiver = BalancerFlashLoanReceiver(_flashLoanReceiver);
        dexAggregator = DEXAggregator(_dexAggregator);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
    }

    /**
     * @notice Execute arbitrage opportunity
     * @dev Called by keeper bot when profitable opportunity detected
     * @param opportunity Arbitrage parameters
     */
    function executeArbitrage(
        ArbitrageOpportunity calldata opportunity
    ) external onlyRole(KEEPER_ROLE) nonReentrant returns (bool success, uint256 profit) {
        // Pre-execution checks
        require(!paused, "Strategy paused");
        require(block.timestamp <= opportunity.deadline, "Opportunity expired");
        require(tx.gasprice <= maxGasPrice, "Gas price too high");
        require(opportunity.flashLoanAmount <= maxFlashLoanAmount, "Flash loan too large");

        // Validate profitability
        uint256 minProfit = (opportunity.flashLoanAmount * minProfitBasisPoints) / 10000;
        require(opportunity.estimatedProfit >= minProfit, "Profit below threshold");

        // Calculate opportunity hash for tracking
        bytes32 opportunityHash = keccak256(abi.encode(opportunity));

        uint256 gasBefore = gasleft();

        try this._executeArbitrageInternal(opportunity, opportunityHash) returns (uint256 actualProfit) {
            uint256 gasUsed = (gasBefore - gasleft()) * tx.gasprice;

            // Update statistics
            totalArbitragesExecuted++;
            totalProfit += actualProfit;
            totalGasSpent += gasUsed;

            emit ArbitrageExecuted(
                opportunity.tokenIn,
                opportunity.flashLoanAmount,
                actualProfit,
                gasUsed,
                opportunityHash
            );

            return (true, actualProfit);
        } catch Error(string memory reason) {
            failedAttempts++;
            emit ArbitrageFailed(reason, opportunityHash);
            return (false, 0);
        } catch (bytes memory) {
            failedAttempts++;
            emit ArbitrageFailed("Unknown error", opportunityHash);
            return (false, 0);
        }
    }

    /**
     * @notice Internal function to execute arbitrage (allows try/catch)
     * @dev Public for try/catch, but should only be called internally
     */
    function _executeArbitrageInternal(
        ArbitrageOpportunity calldata opportunity,
        bytes32 opportunityHash
    ) external onlyRole(KEEPER_ROLE) returns (uint256 profit) {
        require(msg.sender == address(this), "Internal only");

        // Prepare flash loan request
        address[] memory tokens = new address[](1);
        tokens[0] = opportunity.tokenIn;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = opportunity.flashLoanAmount;

        // Encode arbitrage parameters
        bytes memory userData = abi.encode(
            opportunity.swapPath,
            opportunity.dexAddresses,
            (opportunity.flashLoanAmount * minProfitBasisPoints) / 10000 // minProfit
        );

        // Request flash loan
        flashLoanReceiver.requestFlashLoan(tokens, amounts, userData);

        // Get profit from flash loan receiver
        uint256 balance = IERC20(opportunity.tokenIn).balanceOf(address(this));
        
        return balance;
    }

    /**
     * @notice Simulate arbitrage to check profitability
     * @dev View function to validate opportunity before execution
     * @param opportunity Arbitrage parameters
     * @return profitable Whether the arbitrage is profitable
     * @return estimatedNetProfit Net profit after gas costs
     */
    function simulateArbitrage(
        ArbitrageOpportunity calldata opportunity
    ) external view returns (bool profitable, uint256 estimatedNetProfit) {
        // Estimate gas cost
        uint256 baseGasEstimate = 300000; // Base gas for flash loan arbitrage
        uint256 swapGasPerHop = 150000;   // Additional gas per swap
        uint256 totalGasEstimate = baseGasEstimate + (opportunity.dexAddresses.length * swapGasPerHop);
        
        uint256 gasCost = totalGasEstimate * tx.gasprice;

        // Calculate minimum required profit
        uint256 minProfit = (opportunity.flashLoanAmount * minProfitBasisPoints) / 10000;

        // Check if profitable after gas
        if (opportunity.estimatedProfit > gasCost) {
            estimatedNetProfit = opportunity.estimatedProfit - gasCost;
            profitable = estimatedNetProfit >= minProfit;
        } else {
            profitable = false;
            estimatedNetProfit = 0;
        }
    }

    /**
     * @notice Validate arbitrage route
     * @dev Checks if the swap path forms a valid circular route
     * @param swapPath Token swap path
     * @return valid Whether the route is valid
     */
    function validateRoute(address[] memory swapPath) public pure returns (bool valid) {
        if (swapPath.length < 3) return false; // Need at least 3 tokens for arbitrage
        return swapPath[0] == swapPath[swapPath.length - 1]; // Must end where it started
    }

    /**
     * @notice Update strategy parameters
     */
    function setMinProfitBasisPoints(uint256 _bps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_bps <= 1000, "Max 10%");
        minProfitBasisPoints = _bps;
        emit ParametersUpdated(minProfitBasisPoints, maxGasPrice, maxFlashLoanAmount);
    }

    function setMaxGasPrice(uint256 _maxGasPrice) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_maxGasPrice >= 1 gwei, "Too low");
        maxGasPrice = _maxGasPrice;
        emit ParametersUpdated(minProfitBasisPoints, maxGasPrice, maxFlashLoanAmount);
    }

    function setMaxFlashLoanAmount(uint256 _maxAmount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_maxAmount > 0, "Must be positive");
        maxFlashLoanAmount = _maxAmount;
        emit ParametersUpdated(minProfitBasisPoints, maxGasPrice, maxFlashLoanAmount);
    }

    /**
     * @notice Pause/unpause strategy
     */
    function setPaused(bool _paused) external onlyRole(DEFAULT_ADMIN_ROLE) {
        paused = _paused;
        emit PauseToggled(_paused);
    }

    /**
     * @notice Get strategy statistics
     */
    function getStatistics() external view returns (
        uint256 executedCount,
        uint256 profit,
        uint256 gasSpent,
        uint256 failed,
        uint256 averageProfit
    ) {
        executedCount = totalArbitragesExecuted;
        profit = totalProfit;
        gasSpent = totalGasSpent;
        failed = failedAttempts;
        averageProfit = executedCount > 0 ? totalProfit / executedCount : 0;
    }

    /**
     * @notice Emergency withdraw stuck tokens
     */
    function emergencyWithdraw(
        address token,
        uint256 amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(token).safeTransfer(msg.sender, amount);
    }

    /**
     * @notice Update flash loan receiver
     */
    function setFlashLoanReceiver(address _receiver) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_receiver != address(0), "Invalid receiver");
        flashLoanReceiver = BalancerFlashLoanReceiver(_receiver);
    }

    /**
     * @notice Update DEX aggregator
     */
    function setDEXAggregator(address _aggregator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_aggregator != address(0), "Invalid aggregator");
        dexAggregator = DEXAggregator(_aggregator);
    }
}
