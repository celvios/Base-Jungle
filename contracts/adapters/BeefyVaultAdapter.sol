// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IBeefyVault.sol";
import "../interfaces/IStrategyAdapter.sol";

/**
 * @title BeefyVaultAdapter
 * @notice Adapter for Beefy Finance auto-compounding vaults on Base.
 * @dev Implements IStrategyAdapter for seamless integration.
 */
contract BeefyVaultAdapter is IStrategyAdapter, AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant VAULT_ROLE = keccak256("VAULT_ROLE");

    address public immutable beefyVault;
    address public override asset; // Underlying asset (want token)

    event Deposited(uint256 assets, uint256 shares);
    event Withdrawn(uint256 shares, uint256 assets);    constructor(address _beefyVault) {
        require(_beefyVault != address(0), "Invalid vault");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        beefyVault = _beefyVault;
        asset = IBeefyVault(_beefyVault).want();
    }

    /**
     * @notice Deposit assets into Beefy vault.
     */
    function deposit(uint256 amount) external override onlyRole(VAULT_ROLE) returns (uint256) {
        require(amount > 0, "Amount zero");

        // Transfer assets from vault
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        // Approve Beefy vault
        IERC20(asset).approve(beefyVault, amount);

        // Get shares before
        uint256 sharesBefore = IBeefyVault(beefyVault).balanceOf(address(this));

        // Deposit
        IBeefyVault(beefyVault).deposit(amount);

        // Get shares after
        uint256 sharesAfter = IBeefyVault(beefyVault).balanceOf(address(this));
        uint256 sharesReceived = sharesAfter - sharesBefore;

        emit Deposited(amount, sharesReceived);

        return amount;
    }

    /**
     * @notice Withdraw assets from Beefy vault.
     */
    function withdraw(uint256 amount) external override onlyRole(VAULT_ROLE) returns (uint256) {
        require(amount > 0, "Amount zero");

        // Calculate shares needed for amount
        uint256 pricePerShare = IBeefyVault(beefyVault).getPricePerFullShare();
        uint256 sharesToWithdraw = (amount * 1e18) / pricePerShare;

        // Withdraw from Beefy
        IBeefyVault(beefyVault).withdraw(sharesToWithdraw);

        // Get actual withdrawn amount
        uint256 withdrawn = IERC20(asset).balanceOf(address(this));

        // Transfer to vault
        IERC20(asset).safeTransfer(msg.sender, withdrawn);

        emit Withdrawn(sharesToWithdraw, withdrawn);

        return withdrawn;
    }

    /**
     * @notice Get total balance in underlying assets.
     */
    function balanceOf() external view override returns (uint256) {
        uint256 shares = IBeefyVault(beefyVault).balanceOf(address(this));
        uint256 pricePerShare = IBeefyVault(beefyVault).getPricePerFullShare();
        
        // Calculate underlying value
        return (shares * pricePerShare) / 1e18;
    }

    /**
     * @notice Get current APY (estimated from Beefy API off-chain).
     * @dev On-chain APY is difficult to calculate, return 0 for now.
     */
    function apy() external pure override returns (uint256) {
        return 0; // Would fetch from Beefy API off-chain
    }

    /**
     * @notice Get risk score (Beefy vaults are generally low-medium risk).
     */
    function riskScore() external pure override returns (uint256) {
        return 4; // Low-medium risk (1-10 scale)
    }

    /**
     * @notice Get price per share.
     */
    function getPricePerShare() external view returns (uint256) {
        return IBeefyVault(beefyVault).getPricePerFullShare();
    }

    /**
     * @notice Withdraw all shares.
     */
    function withdrawAll() external onlyRole(VAULT_ROLE) returns (uint256) {
        IBeefyVault(beefyVault).withdrawAll();

        uint256 withdrawn = IERC20(asset).balanceOf(address(this));
        if (withdrawn > 0) {
            IERC20(asset).safeTransfer(msg.sender, withdrawn);
        }

        return withdrawn;
    }
}
