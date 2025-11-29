// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockBeefyVault
 * @notice Mock Beefy Finance vault for testing
 */
contract MockBeefyVault is ERC20 {
    IERC20 public immutable want; // Underlying token
    uint256 public pricePerFullShare;

    constructor(
        address _want,
        string memory _name,
        string memory _symbol
    ) ERC20(_name, _symbol) {
        want = IERC20(_want);
        pricePerFullShare = 1e18; // Start at 1:1
    }

    /**
     * @notice Deposit underlying tokens
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount zero");

        // Transfer want tokens
        want.transferFrom(msg.sender, address(this), amount);

        // Calculate shares (accounting for price)
        uint256 shares = (amount * 1e18) / pricePerFullShare;

        // Mint shares
        _mint(msg.sender, shares);
    }

    /**
     * @notice Withdraw by burning shares
     */
    function withdraw(uint256 shares) external {
        require(shares > 0, "Shares zero");
        require(balanceOf(msg.sender) >= shares, "Insufficient balance");

        // Calculate underlying amount
        uint256 amount = (shares * pricePerFullShare) / 1e18;

        // Burn shares
        _burn(msg.sender, shares);

        // Transfer underlying
        want.transfer(msg.sender, amount);
    }

    /**
     * @notice Withdraw all shares
     */
    function withdrawAll() external {
        uint256 shares = balanceOf(msg.sender);
        if (shares > 0) {
            this.withdraw(shares);
        }
    }

    /**
     * @notice Get price per full share (1e18 precision)
     */
    function getPricePerFullShare() external view returns (uint256) {
        return pricePerFullShare;
    }

    /**
     * @notice Simulate yield by increasing price per share
     */
    function simulateYield(uint256 percentIncrease) external {
        // Increase price by percentage (basis points)
        pricePerFullShare = (pricePerFullShare * (10000 + percentIncrease)) / 10000;
    }

    /**
     * @notice Get underlying balance for an account
     */
    function balanceOfUnderlying(address account) external view returns (uint256) {
        uint256 shares = balanceOf(account);
        return (shares * pricePerFullShare) / 1e18;
    }
}
