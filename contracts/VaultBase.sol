// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title VaultBase
 * @notice Abstract base contract for Base Jungle strategy vaults.
 * @dev Extends ERC4626 for standard yield bearing vaults.
 */
abstract contract VaultBase is ERC4626, AccessControl, Pausable, ReentrancyGuard {
    
    bytes32 public constant STRATEGIST_ROLE = keccak256("STRATEGIST_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    constructor(IERC20 asset_, string memory name_, string memory symbol_) ERC4626(asset_) ERC20(name_, symbol_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(STRATEGIST_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    /**
     * @notice Pauses the vault (deposits/withdrawals).
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses the vault.
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev See {ERC4626-deposit}.
     */
    function deposit(uint256 assets, address receiver) public virtual override whenNotPaused nonReentrant returns (uint256) {
        return super.deposit(assets, receiver);
    }

    /**
     * @dev See {ERC4626-mint}.
     */
    function mint(uint256 shares, address receiver) public virtual override whenNotPaused nonReentrant returns (uint256) {
        return super.mint(shares, receiver);
    }

    /**
     * @dev See {ERC4626-withdraw}.
     */
    function withdraw(uint256 assets, address receiver, address owner) public virtual override nonReentrant returns (uint256) {
        return super.withdraw(assets, receiver, owner);
    }

    /**
     * @dev See {ERC4626-redeem}.
     */
    function redeem(uint256 shares, address receiver, address owner) public virtual override nonReentrant returns (uint256) {
        return super.redeem(shares, receiver, owner);
    }

    /**
     * @notice Emergency withdrawal function for strategists to pull funds if needed (e.g. to migrate).
     */
    function emergencyWithdraw(address token, uint256 amount, address to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(token).transfer(to, amount);
    }
}
