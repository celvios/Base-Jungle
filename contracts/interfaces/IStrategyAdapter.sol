// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IStrategyAdapter {
    function deposit(uint256 amount) external returns (uint256);
    function withdraw(uint256 amount) external returns (uint256);
    function balanceOf() external view returns (uint256);
    function apy() external view returns (uint256);
    function riskScore() external view returns (uint256);
    function asset() external view returns (address);
}
