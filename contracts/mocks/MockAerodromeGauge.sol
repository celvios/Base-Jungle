// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockAerodromeGauge
 * @notice Mock implementation of Aerodrome Gauge for Sepolia testing
 */
contract MockAerodromeGauge {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public earned;
    uint256 public totalSupply;

    constructor(address _stakingToken, address _rewardToken) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
    }

    function deposit(uint256 amount) external {
        if (amount > 0) {
            stakingToken.safeTransferFrom(msg.sender, address(this), amount);
            balanceOf[msg.sender] += amount;
            totalSupply += amount;
            
            // Simulate rewards accumulation on deposit
            earned[msg.sender] += (amount * 1) / 100; // 1% instant reward for testing
        }
    }

    function withdraw(uint256 amount) external {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        if (amount > 0) {
            balanceOf[msg.sender] -= amount;
            totalSupply -= amount;
            stakingToken.safeTransfer(msg.sender, amount);
        }
    }

    function getReward(address account) external {
        uint256 reward = earned[account];
        if (reward > 0) {
            earned[account] = 0;
            // Mint or transfer reward
            // In mock, we assume Gauge holds enough rewards or can mint
            // For safety, check balance first
            uint256 balance = rewardToken.balanceOf(address(this));
            if (balance >= reward) {
                rewardToken.safeTransfer(account, reward);
            }
        }
    }

    // Helper to fund the gauge with rewards for testing
    function notifyRewardAmount(uint256 amount) external {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
    }
}
