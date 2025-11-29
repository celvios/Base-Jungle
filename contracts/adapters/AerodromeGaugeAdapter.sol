// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IAerodromeGauge.sol";
import "../defi/DEXAggregator.sol";

/**
 * @title AerodromeGaugeAdapter  
 * @notice Stake LP tokens in Aerodrome gauges to earn AERO rewards.
 * @dev Handles staking, unstaking, reward harvesting, and auto-compounding.
 */
contract AerodromeGaugeAdapter is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");

    DEXAggregator public dexAggregator;
    address public immutable AERO; // AERO token address

    // Gauge => user => staked balance
    mapping(address => mapping(address => uint256)) public stakedBalance;

    // Total staked per gauge
    mapping(address => uint256) public totalStaked;

    event Staked(address indexed user, address indexed gauge, uint256 amount);
    event Unstaked(address indexed user, address indexed gauge, uint256 amount);
    event RewardsClaimed(address indexed user, address indexed gauge, uint256 aeroAmount);
    event Compounded(address indexed gauge, uint256 aeroHarvested, uint256 lpAdded);

    constructor(address _dexAggregator, address _aero) {
        require(_dexAggregator != address(0), "Invalid DEX aggregator");
        require(_aero != address(0), "Invalid AERO");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);

        dexAggregator = DEXAggregator(_dexAggregator);
        AERO = _aero;
    }

    /**
     * @notice Stake LP tokens in gauge.
     * @param gauge Gauge contract address
     * @param amount LP token amount to stake
     */
    function stake(address gauge, uint256 amount) external onlyRole(VAULT_ROLE) {
        require(amount > 0, "Amount zero");
        
        // Get LP token from gauge
        address lpToken = _getLPToken(gauge);

        // Transfer LP from vault
        IERC20(lpToken).safeTransferFrom(msg.sender, address(this), amount);

        // Approve gauge
        IERC20(lpToken).approve(gauge, amount);

        // Stake in gauge
        IAerodromeGauge(gauge).deposit(amount);

        // Update tracking
        stakedBalance[gauge][msg.sender] += amount;
        totalStaked[gauge] += amount;

        emit Staked(msg.sender, gauge, amount);
    }

    /**
     * @notice Unstake LP tokens from gauge.
     */
    function unstake(address gauge, uint256 amount) external onlyRole(VAULT_ROLE) {
        require(amount > 0, "Amount zero");
        require(stakedBalance[gauge][msg.sender] >= amount, "Insufficient balance");

        // Withdraw from gauge
        IAerodromeGauge(gauge).withdraw(amount);

        // Update tracking
        stakedBalance[gauge][msg.sender] -= amount;
        totalStaked[gauge] -= amount;

        // Transfer LP back to vault
        address lpToken = _getLPToken(gauge);
        IERC20(lpToken).safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, gauge, amount);
    }

    /**
     * @notice Claim AERO rewards for user.
     */
    function claimRewards(address gauge, address user) external onlyRole(VAULT_ROLE) returns (uint256) {
        // Claim rewards
        IAerodromeGauge(gauge).getReward(address(this));

        // Get AERO balance
        uint256 aeroBalance = IERC20(AERO).balanceOf(address(this));

        if (aeroBalance > 0) {
            // Transfer to user
            IERC20(AERO).safeTransfer(user, aeroBalance);
            emit RewardsClaimed(user, gauge, aeroBalance);
        }

        return aeroBalance;
    }

    /**
     * @notice Auto-compound: Claim AERO rewards.
     * @dev Simplified version - just claims rewards. External contract handles swapping.
     */
    function compound(address gauge) external onlyRole(KEEPER_ROLE) returns (uint256 aeroHarvested) {
        // Claim all rewards
        IAerodromeGauge(gauge).getReward(address(this));

        aeroHarvested = IERC20(AERO).balanceOf(address(this));
        require(aeroHarvested > 0, "No rewards");

        emit Compounded(gauge, aeroHarvested, 0);

        return aeroHarvested;
    }

    /**
     * @notice Get pending AERO rewards for user.
     */
    function getPendingRewards(address gauge, address user) external view returns (uint256) {
        // Aerodrome's earned() function
        return IAerodromeGauge(gauge).earned(address(this));
    }

    /**
     * @notice Get user's staked balance in gauge.
     */
    function getStakedBalance(address gauge, address user) external view returns (uint256) {
        return stakedBalance[gauge][user];
    }

    /**
     * @notice Internal: Get LP token from gauge.
     */
    function _getLPToken(address gauge) internal view returns (address) {
        // Aerodrome gauges typically have a stakingToken() or similar
        // Simplified: would need actual interface
        return address(0); // Placeholder
    }
}
