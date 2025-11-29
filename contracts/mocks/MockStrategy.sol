// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "../interfaces/IStrategyAdapter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockStrategy is IStrategyAdapter {
    IERC20 public immutable strategyAsset;
    address public immutable asset;
    uint256 private _balance;

    constructor(address token) {
        strategyAsset = IERC20(token);
        asset = token;
    }

    function deposit(uint256 amount) external returns (uint256) {
        strategyAsset.transferFrom(msg.sender, address(this), amount);
        _balance += amount;
        return amount;
    }

    function withdraw(uint256 amount) external returns (uint256) {
        _balance -= amount;
        strategyAsset.transfer(msg.sender, amount);
        return amount;
    }

    function balanceOf() external view returns (uint256) {
        return _balance;
    }

    function apy() external pure returns (uint256) {
        return 500; // 5%
    }

    function riskScore() external pure returns (uint256) {
        return 10; // 10% risk
    }
}
