// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../ReferralManager.sol";
import "../interfaces/IStrategyAdapter.sol";

/**
 * @title StrategyController
 * @notice The "brain" - orchestrates all DeFi strategies with tier-based allocation.
 * @dev Manages capital allocation, rebalancing, and yield optimization across multiple strategies.
 */
contract StrategyController is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant STRATEGY_ADMIN_ROLE = keccak256("STRATEGY_ADMIN_ROLE");
    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");

    ReferralManager public referralManager;

    enum StrategyType {
        LENDING,           // Moonwell supply
        LEVERAGED_LENDING, // Recursive leverage
        LP_STABLE,         // Aerodrome stable pairs
        LP_VOLATILE,       // Aerodrome volatile pairs
        VAULT_BEEFY,       // Beefy auto-compound
        LEVERAGED_LP,      // LeveragedLPStrategy
        GAUGE_FARMING      // Aerodrome gauge staking
    }

    struct Strategy {
        StrategyType strategyType;
        address adapter;           // Strategy adapter contract
        address asset;             // Underlying asset
        bool isActive;
        uint256 totalAllocated;    // Total allocated to this strategy
        uint256 targetAPY;         // Target APY (basis points)
        uint256 riskScore;         // 1-10 risk rating
        ReferralManager.Tier minTier; // Minimum tier required
    }

    struct AllocationConfig {
        StrategyType strategyType;
        uint256 percentage;        // Allocation percentage (basis points)
    }

    // Strategy ID => Strategy
    mapping(uint256 => Strategy) public strategies;
    uint256 public strategyCount;

    // Tier => Allocation configs
    mapping(ReferralManager.Tier => AllocationConfig[]) public tierAllocations;

    // User => Strategy ID => Allocated amount
    mapping(address => mapping(uint256 => uint256)) public userAllocations;

    struct UserSettings {
        bool autoCompound;
        uint8 riskLevel; // 0=Low, 1=Medium, 2=High
    }

    mapping(address => UserSettings) public userSettings;

    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MAX_STRATEGIES = 10;

    // Rebalance thresholds
    uint256 public rebalanceThreshold = 500; // 5% deviation triggers rebalance

    event StrategyAdded(uint256 indexed strategyId, StrategyType strategyType, address adapter);
    event StrategyRemoved(uint256 indexed strategyId);
    event Allocated(address indexed user, uint256 indexed strategyId, uint256 amount);
    event Deallocated(address indexed user, uint256 indexed strategyId, uint256 amount);
    event Rebalanced(address indexed user, uint256 totalValue);
    event SettingsUpdated(address indexed user, bool autoCompound, uint8 riskLevel);

    constructor(address _referralManager) {
        require(_referralManager != address(0), "Invalid referral manager");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
        _grantRole(STRATEGY_ADMIN_ROLE, msg.sender);

        referralManager = ReferralManager(_referralManager);

        // Set default tier allocations
        _setDefaultAllocations();
    }

    /**
     * @notice Update user strategy settings.
     * @param autoCompound Enable/disable auto-compounding
     * @param riskLevel Risk preference (0=Low, 1=Medium, 2=High)
     */
    function setUserSettings(bool autoCompound, uint8 riskLevel) external {
        require(riskLevel <= 2, "Invalid risk level");
        
        userSettings[msg.sender] = UserSettings({
            autoCompound: autoCompound,
            riskLevel: riskLevel
        });

        emit SettingsUpdated(msg.sender, autoCompound, riskLevel);
    }

    /**
     * @notice Add a new strategy.
     */
    function addStrategy(
        StrategyType strategyType,
        address adapter,
        address asset,
        uint256 targetAPY,
        uint256 riskScore,
        ReferralManager.Tier minTier
    ) external onlyRole(STRATEGY_ADMIN_ROLE) returns (uint256 strategyId) {
        require(strategyCount < MAX_STRATEGIES, "Max strategies reached");
        require(adapter != address(0), "Invalid adapter");

        strategyId = strategyCount++;

        strategies[strategyId] = Strategy({
            strategyType: strategyType,
            adapter: adapter,
            asset: asset,
            isActive: true,
            totalAllocated: 0,
            targetAPY: targetAPY,
            riskScore: riskScore,
            minTier: minTier
        });

        emit StrategyAdded(strategyId, strategyType, adapter);
    }

    /**
     * @notice Allocate user funds to strategies based on their tier.
     */
    function allocate(address user, uint256 totalAmount) external onlyRole(VAULT_ROLE) nonReentrant {
        require(totalAmount > 0, "Amount zero");

        // Get user tier
        ReferralManager.Tier tier = referralManager.getUserTier(user);

        // Get allocation config for tier
        AllocationConfig[] memory configs = tierAllocations[tier];
        require(configs.length > 0, "No allocation config");

        // Allocate to each strategy per config
        for (uint256 i = 0; i < configs.length; i++) {
            AllocationConfig memory config = configs[i];
            
            // Find strategy by type
            uint256 strategyId = _findStrategyByType(config.strategyType, tier);
            
            if (strategyId < strategyCount && strategies[strategyId].isActive) {
                uint256 amount = (totalAmount * config.percentage) / BASIS_POINTS;
                
                if (amount > 0) {
                    _allocateToStrategy(user, strategyId, amount);
                }
            }
        }
    }

    /**
     * @notice Deallocate all funds from strategies.
     */
    function deallocate(address user) external nonReentrant returns (uint256 totalWithdrawn) {
        for (uint256 i = 0; i < strategyCount; i++) {
            uint256 allocated = userAllocations[user][i];
            
            if (allocated > 0) {
                totalWithdrawn += _withdrawFromStrategy(user, i, allocated);
            }
        }
    }

    /**
     * @notice Rebalance user's allocations if drift exceeds threshold.
     */
    function rebalance(address user) external onlyRole(KEEPER_ROLE) nonReentrant {
        // Get total value first
        uint256 totalValue = getTotalValue(user);
        
        if (totalValue == 0) return;

        // Withdraw all
        for (uint256 i = 0; i < strategyCount; i++) {
            uint256 allocated = userAllocations[user][i];
            if (allocated > 0) {
                _withdrawFromStrategy(user, i, allocated);
            }
        }

        // Re-allocate according to current tier
        ReferralManager.Tier tier = referralManager.getUserTier(user);
        AllocationConfig[] memory configs = tierAllocations[tier];

        for (uint256 i = 0; i < configs.length; i++) {
            uint256 strategyId = _findStrategyByType(configs[i].strategyType, tier);
            
            if (strategyId < strategyCount && strategies[strategyId].isActive) {
                uint256 amount = (totalValue * configs[i].percentage) / BASIS_POINTS;
                if (amount > 0) {
                    _allocateToStrategy(user, strategyId, amount);
                }
            }
        }

        emit Rebalanced(user, totalValue);
    }

    /**
     * @notice Get total value of user's allocations.
     */
    function getTotalValue(address user) public view returns (uint256 total) {
        for (uint256 i = 0; i < strategyCount; i++) {
            if (userAllocations[user][i] > 0) {
                Strategy memory strategy = strategies[i];
                
                if (strategy.isActive) {
                    // Get balance from adapter
                    uint256 balance = IStrategyAdapter(strategy.adapter).balanceOf();
                    total += balance;
                }
            }
        }
    }

    /**
     * @notice Internal: Allocate to specific strategy.
     */
    function _allocateToStrategy(address user, uint256 strategyId, uint256 amount) internal {
        Strategy storage strategy = strategies[strategyId];
        
        // Deposit via adapter
        IERC20(strategy.asset).approve(strategy.adapter, amount);
        IStrategyAdapter(strategy.adapter).deposit(amount);

        // Update tracking
        userAllocations[user][strategyId] += amount;
        strategy.totalAllocated += amount;

        emit Allocated(user, strategyId, amount);
    }

    /**
     * @notice Internal: Withdraw from strategy.
     */
    function _withdrawFromStrategy(address user, uint256 strategyId, uint256 amount) internal returns (uint256) {
        Strategy storage strategy = strategies[strategyId];
        
        // Withdraw via adapter
        uint256 withdrawn = IStrategyAdapter(strategy.adapter).withdraw(amount);

        // Update tracking
        userAllocations[user][strategyId] -= amount;
        strategy.totalAllocated -= amount;

        emit Deallocated(user, strategyId, amount);

        return withdrawn;
    }



    /**
     * @notice Get total allocated across all strategies.
     */
    function getTotalAllocated() external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < strategyCount; i++) {
            total += strategies[i].totalAllocated;
        }
        return total;
    }

    /**
     * @notice Get user's total allocation across all strategies.
     */
    function getUserTotalAllocated(address user) external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < strategyCount; i++) {
            total += userAllocations[user][i];
        }
        return total;
    }

    /**
     * @notice Internal: Find strategy by type and tier.
     */
    function _findStrategyByType(StrategyType strategyType, ReferralManager.Tier tier) internal view returns (uint256) {
        for (uint256 i = 0; i < strategyCount; i++) {
            Strategy memory strategy = strategies[i];
            
            if (strategy.strategyType == strategyType 
                && strategy.isActive 
                && uint8(tier) >= uint8(strategy.minTier)) {
                return i;
            }
        }
        
        return type(uint256).max; // Not found
    }

    /**
     * @notice Internal: Set default tier allocations.
     */
    function _setDefaultAllocations() internal {
        // Novice: Conservative
        tierAllocations[ReferralManager.Tier.Novice].push(AllocationConfig(StrategyType.LENDING, 7000)); // 70%
        tierAllocations[ReferralManager.Tier.Novice].push(AllocationConfig(StrategyType.VAULT_BEEFY, 3000)); // 30%

        // Scout: Balanced
        tierAllocations[ReferralManager.Tier.Scout].push(AllocationConfig(StrategyType.LENDING, 5000)); // 50%
        tierAllocations[ReferralManager.Tier.Scout].push(AllocationConfig(StrategyType.LP_STABLE, 3000)); // 30%
        tierAllocations[ReferralManager.Tier.Scout].push(AllocationConfig(StrategyType.VAULT_BEEFY, 2000)); // 20%

        // Captain: Aggressive
        tierAllocations[ReferralManager.Tier.Captain].push(AllocationConfig(StrategyType.LEVERAGED_LENDING, 4000)); // 40%
        tierAllocations[ReferralManager.Tier.Captain].push(AllocationConfig(StrategyType.LP_VOLATILE, 4000)); // 40%
        tierAllocations[ReferralManager.Tier.Captain].push(AllocationConfig(StrategyType.VAULT_BEEFY, 2000)); // 20%

        // Whale: Maximum yield
        tierAllocations[ReferralManager.Tier.Whale].push(AllocationConfig(StrategyType.LEVERAGED_LP, 3000)); // 30%
        tierAllocations[ReferralManager.Tier.Whale].push(AllocationConfig(StrategyType.GAUGE_FARMING, 4000)); // 40%
        tierAllocations[ReferralManager.Tier.Whale].push(AllocationConfig(StrategyType.LEVERAGED_LENDING, 3000)); // 30%
    }
}
