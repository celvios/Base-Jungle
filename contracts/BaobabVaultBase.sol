// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PointsTracker.sol";

/**
 * @title BaobabVaultBase
 * @notice Abstract base contract for Base Jungle strategy vaults.
 * @dev Extends ERC4626 for standard yield bearing vaults.
 */
abstract contract BaobabVaultBase is ERC4626, AccessControl, Pausable, ReentrancyGuard {
    
    bytes32 public constant STRATEGIST_ROLE = keccak256("STRATEGIST_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant STRATEGY_CONTROLLER_ROLE = keccak256("STRATEGY_CONTROLLER_ROLE");

    uint256 public constant MAX_DEPOSIT = 1_000_000e6; // $1M per deposit (assuming 6 decimals)
    uint256 public constant MIN_DEPOSIT = 100e6; // $100 minimum

    PointsTracker public pointsTracker;
    
    // Fee structure (all in basis points, 10000 = 100%)
    uint256 public depositFee; // Pre-TGE: 0
    uint256 public withdrawalFee; // Pre-TGE: 0
    uint256 public performanceFee; // Pre-TGE: 0, Post-TGE: 1000 (10%)

    event StrategyChanged(address oldStrategy, address newStrategy);
    event Rebalanced(uint256 amount, address fromStrategy, address toStrategy);
    event EmergencyWithdrawal(address indexed user, uint256 amount);
    event FeesUpdated(uint256 depositFee, uint256 withdrawalFee, uint256 performanceFee);

    constructor(IERC20 asset_, string memory name_, string memory symbol_, address _pointsTracker) ERC4626(asset_) ERC20(name_, symbol_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(STRATEGIST_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(STRATEGY_CONTROLLER_ROLE, msg.sender);
        
        pointsTracker = PointsTracker(_pointsTracker);
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
     * @notice Updates fee structure.
     */
    function updateFees(uint256 _depositFee, uint256 _withdrawalFee, uint256 _performanceFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_depositFee <= 500, "Max deposit fee 5%");
        require(_withdrawalFee <= 500, "Max withdrawal fee 5%");
        require(_performanceFee <= 2000, "Max performance fee 20%");
        
        depositFee = _depositFee;
        withdrawalFee = _withdrawalFee;
        performanceFee = _performanceFee;
        
        emit FeesUpdated(_depositFee, _withdrawalFee, _performanceFee);
    }

    /**
     * @dev See {ERC4626-deposit}.
     */
    function deposit(uint256 assets, address receiver) public virtual override whenNotPaused nonReentrant returns (uint256) {
        require(assets >= MIN_DEPOSIT, "Below minimum");
        require(assets <= MAX_DEPOSIT, "Exceeds maximum");
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
    function emergencyWithdrawToken(address token, uint256 amount, address to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        IERC20(token).transfer(to, amount);
    }
    
    function _awardDepositPoints(address user, uint256 amount) internal {
        // 50 points per $100 deposited (assuming 6 decimals for amount)
        // amount / 100e6 * 50
        if (address(pointsTracker) != address(0)) {
            uint256 points = (amount * 50) / 100e6;
            if (points > 0) {
                try pointsTracker.updatePoints(user, points, "yield_deposit") {} catch {}
            }
        }
    }
}
