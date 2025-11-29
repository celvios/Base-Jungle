// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract MockStrategyController {
    mapping(address => uint256) public allocated;

    function allocate(address user, uint256 amount) external {
        allocated[user] += amount;
    }

    function deallocate(address user) external returns (uint256) {
        uint256 amount = allocated[user];
        allocated[user] = 0;
        return amount;
    }
}
