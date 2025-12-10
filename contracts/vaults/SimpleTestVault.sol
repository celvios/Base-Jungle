// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SimpleTestVault
 * @notice Ultra-simple vault for testing - just holds USDC, no strategies
 */
contract SimpleTestVault is ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable asset;
    
    constructor(address _asset) ERC20("Simple Test Vault", "STV") {
        asset = IERC20(_asset);
    }

    function deposit(uint256 assets, address receiver) external nonReentrant returns (uint256 shares) {
        require(assets > 0, "Zero assets");
        require(receiver != address(0), "Invalid receiver");

        // Convert USDC (6 decimals) to shares (18 decimals)
        // Multiply by 10^12 to normalize
        shares = assets * 1e12;

        // Transfer USDC from user
        asset.safeTransferFrom(msg.sender, address(this), assets);

        // Mint shares
        _mint(receiver, shares);

        return shares;
    }

    function withdraw(uint256 shares) external nonReentrant returns (uint256 assets) {
        require(shares > 0, "Zero shares");

        // Convert shares (18 decimals) back to USDC (6 decimals)
        // Divide by 10^12 to normalize
        assets = shares / 1e12;

        // Burn shares
        _burn(msg.sender, shares);

        // Transfer USDC back
        asset.safeTransfer(msg.sender, assets);

        return assets;
    }

    function totalAssets() public view returns (uint256) {
        return asset.balanceOf(address(this));
    }

    // ERC4626 compatibility functions
    function convertToAssets(uint256 shares) public pure returns (uint256) {
        // Convert shares (18 decimals) back to USDC (6 decimals)
        return shares / 1e12;
    }

    function convertToShares(uint256 assets) public pure returns (uint256) {
        // Convert USDC (6 decimals) to shares (18 decimals)
        return assets * 1e12;
    }

    function previewDeposit(uint256 assets) public pure returns (uint256) {
        return convertToShares(assets);
    }

    function previewWithdraw(uint256 assets) public pure returns (uint256) {
        return convertToShares(assets);
    }
}

