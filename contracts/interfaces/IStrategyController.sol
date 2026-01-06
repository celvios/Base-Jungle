// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title IStrategyController
 * @notice Interface for StrategyController to avoid circular dependencies
 * @dev Used by LeverageManager to coordinate fund withdrawals for debt repayment
 */
interface IStrategyController {
    /**
     * @notice Get total value of user's allocations across all strategies
     * @param user User address
     * @return total Total value in base asset (USDC)
     */
    function getTotalValue(address user) external view returns (uint256 total);

    /**
     * @notice Withdraw specific amount from user's strategies for debt repayment
     * @param user User address
     * @param amount Amount to withdraw
     * @return withdrawn Actual amount withdrawn
     * @dev Prioritizes most liquid strategies first
     */
    function withdrawForRepayment(address user, uint256 amount) external returns (uint256 withdrawn);

    /**
     * @notice Check if user's allocations need rebalancing
     * @param user User address
     * @return needs True if drift exceeds threshold
     */
    function needsRebalance(address user) external view returns (bool needs);

    /**
     * @notice Rebalance user's allocations according to current tier
     * @param user User address
     */
    function rebalance(address user) external;
}
