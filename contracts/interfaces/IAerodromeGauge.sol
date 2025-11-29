// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title IAerodromeGauge
 * @notice Interface for Aerodrome liquidity gauge contracts.
 */
interface IAerodromeGauge {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getReward(address account) external;
    function balanceOf(address account) external view returns (uint256);
    function earned(address account) external view returns (uint256);
    function rewardToken() external view returns (address);
}

/**
 * @title IAerodromeVoter
 * @notice Interface for Aerodrome voter contract.
 */
interface IAerodromeVoter {
    function gauges(address pool) external view returns (address);
    function isGauge(address gauge) external view returns (bool);
}
