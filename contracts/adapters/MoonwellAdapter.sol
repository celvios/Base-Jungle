// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IStrategyAdapter.sol";

// Moonwell (Compound V2 fork on Base) interface
interface IMToken {
    function mint(uint256 mintAmount) external returns (uint256);
    function redeem(uint256 redeemTokens) external returns (uint256);
    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);
    function borrow(uint256 borrowAmount) external returns (uint256);
    function repayBorrow(uint256 repayAmount) external returns (uint256);
    function balanceOf(address owner) external view returns (uint256);
    function balanceOfUnderlying(address owner) external returns (uint256);
    function borrowBalanceCurrent(address account) external returns (uint256);
    function exchangeRateCurrent() external returns (uint256);
    function supplyRatePerBlock() external view returns (uint256);
    function borrowRatePerBlock() external view returns (uint256);
    function underlying() external view returns (address);
}

interface IComptroller {
    function enterMarkets(address[] calldata mTokens) external returns (uint256[] memory);
    function exitMarket(address mToken) external returns (uint256);
    function getAccountLiquidity(address account) 
        external 
        view 
        returns (uint256 error, uint256 liquidity, uint256 shortfall);
}

/**
 * @title MoonwellAdapter
 * @notice Strategy adapter for Moonwell (Compound V2 fork) on Base.
 * @dev Implements IStrategyAdapter for vault integration.
 */
contract MoonwellAdapter is IStrategyAdapter, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");

    address public immutable mToken;        // Moonwell market token (mUSDC, mETH, etc.)
    address public override asset;          // Underlying asset
    IComptroller public comptroller;

    uint256 private constant BLOCKS_PER_YEAR = 2_628_000; // ~12 sec blocks on Base

    event Deposited(uint256 amount, uint256 mTokens);
    event Withdrawn(uint256 amount, uint256 mTokens);

    constructor(
        address _mToken,
        address _comptroller
    ) {
        require(_mToken != address(0), "Invalid mToken");
        require(_comptroller != address(0), "Invalid comptroller");

        mToken = _mToken;
        comptroller = IComptroller(_comptroller);
        asset = IMToken(_mToken).underlying();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        // Enter market for borrowing capability
        address[] memory markets = new address[](1);
        markets[0] = _mToken;
        comptroller.enterMarkets(markets);
    }

    /**
     * @notice Deposit assets into Moonwell.
     */
    function deposit(uint256 amount) external override onlyRole(VAULT_ROLE) returns (uint256) {
        require(amount > 0, "Amount zero");

        // Transfer from vault
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        // Approve mToken
        IERC20(asset).approve(mToken, amount);

        // Mint mTokens
        uint256 mTokenBefore = IMToken(mToken).balanceOf(address(this));
        require(IMToken(mToken).mint(amount) == 0, "Mint failed");
        uint256 mTokenAfter = IMToken(mToken).balanceOf(address(this));
        uint256 mTokensMinted = mTokenAfter - mTokenBefore;

        emit Deposited(amount, mTokensMinted);
        return amount;
    }

    /**
     * @notice Withdraw assets from Moonwell.
     */
    function withdraw(uint256 amount) external override onlyRole(VAULT_ROLE) returns (uint256) {
        require(amount > 0, "Amount zero");

        uint256 mTokenBefore = IMToken(mToken).balanceOf(address(this));

        // Redeem underlying
        require(IMToken(mToken).redeemUnderlying(amount) == 0, "Redeem failed");

        uint256 mTokenAfter = IMToken(mToken).balanceOf(address(this));
        uint256 mTokensBurned = mTokenBefore - mTokenAfter;

        // Transfer to vault
        IERC20(asset).safeTransfer(msg.sender, amount);

        emit Withdrawn(amount, mTokensBurned);
        return amount;
    }

    /**
     * @notice Get total balance (supplied).
     */
    function balanceOf() external view override returns (uint256) {
        // Note: This returns the static balance, not real-time.
        // For real-time balance, call balanceOfUnderlying() off-chain
        return (IMToken(mToken).balanceOf(address(this)) * 1e18) / 1e8; // Approximate
    }

    /**
     * @notice Get current supply APY (annualized).
     */
    function apy() external view override returns (uint256) {
        uint256 supplyRate = IMToken(mToken).supplyRatePerBlock();
        // Annualize: (1 + rate)^blocksPerYear - 1, simplified to rate * blocksPerYear
        return (supplyRate * BLOCKS_PER_YEAR * 100) / 1e18; // Return as percentage with 2 decimals
    }

    /**
     * @notice Get risk score (conservative for lending).
     */
    function riskScore() external pure override returns (uint256) {
        return 3; // Low-medium risk (1-10 scale)
    }

    /**
     * @notice Borrow assets from Moonwell.
     * @dev Only callable by vault for leverage strategies.
     */
    function borrow(uint256 amount) external onlyRole(VAULT_ROLE) returns (uint256) {
        require(amount > 0, "Amount zero");
        require(IMToken(mToken).borrow(amount) == 0, "Borrow failed");
        
        // Transfer borrowed assets to vault
        IERC20(asset).safeTransfer(msg.sender, amount);
        
        return amount;
    }

    /**
     * @notice Repay borrowed assets.
     */
    function repayBorrow(uint256 amount) external onlyRole(VAULT_ROLE) returns (uint256) {
        require(amount > 0, "Amount zero");

        // Transfer from vault
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        // Approve mToken
        IERC20(asset).approve(mToken, amount);

        // Repay
        require(IMToken(mToken).repayBorrow(amount) == 0, "Repay failed");

        return amount;
    }

    /**
     * @notice Get current borrow balance.
     */
    function getBorrowBalance() external returns (uint256) {
        return IMToken(mToken).borrowBalanceCurrent(address(this));
    }

    /**
     * @notice Get account liquidity (for health factor calculation).
     * @return liquidity Available borrow capacity in USD
     * @return shortfall Deficit if underwater
     */
    function getAccountLiquidity() external view returns (uint256 liquidity, uint256 shortfall) {
        (uint256 error, uint256 _liquidity, uint256 _shortfall) = comptroller.getAccountLiquidity(address(this));
        require(error == 0, "Comptroller error");
        return (_liquidity, _shortfall);
    }
}
