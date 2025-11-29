// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockMToken
 * @notice Mock implementation of Moonwell mToken for testing
 */
contract MockMToken {
    IERC20 public underlying;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public borrowBalances;
    uint256 public exchangeRate = 1e18; // 1:1 initially
    uint256 public supplyRatePerBlock = 100; // 0.01% per block
    uint256 public borrowRatePerBlock = 200; // 0.02% per block

    constructor(address _underlying) {
        underlying = IERC20(_underlying);
    }

    function mint(uint256 mintAmount) external returns (uint256) {
        require(underlying.transferFrom(msg.sender, address(this), mintAmount), "Transfer failed");
        uint256 mintTokens = (mintAmount * 1e18) / exchangeRate;
        balances[msg.sender] += mintTokens;
        return 0; // Success
    }

    function redeem(uint256 redeemTokens) external returns (uint256) {
        require(balances[msg.sender] >= redeemTokens, "Insufficient balance");
        uint256 redeemAmount = (redeemTokens * exchangeRate) / 1e18;
        balances[msg.sender] -= redeemTokens;
        require(underlying.transfer(msg.sender, redeemAmount), "Transfer failed");
        return 0; // Success
    }

    function borrow(uint256 borrowAmount) external returns (uint256) {
        borrowBalances[msg.sender] += borrowAmount;
        require(underlying.transfer(msg.sender, borrowAmount), "Transfer failed");
        return 0; // Success
    }

    function repayBorrow(uint256 repayAmount) external returns (uint256) {
        require(underlying.transferFrom(msg.sender, address(this), repayAmount), "Transfer failed");
        borrowBalances[msg.sender] -= repayAmount;
        return 0; // Success
    }

    function balanceOf(address owner) external view returns (uint256) {
        return balances[owner];
    }

    function borrowBalanceStored(address account) external view returns (uint256) {
        return borrowBalances[account];
    }

    function setExchangeRate(uint256 _rate) external {
        exchangeRate = _rate;
    }

    function supplyRatePerTimestamp() external view returns (uint256) {
        return supplyRatePerBlock;
    }

    function borrowRatePerTimestamp() external view returns (uint256) {
        return borrowRatePerBlock;
    }
}
