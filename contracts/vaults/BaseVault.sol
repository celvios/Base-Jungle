// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../ReferralManager.sol";
import "../PointsTracker.sol";
import "../automation/StrategyController.sol";

/**
 * @title BaseVault
 * @notice Abstract ERC4626-compliant vault with tier integration and dynamic fees.
 * @dev Base contract for ConservativeVault and AggressiveVault.
 */
abstract contract BaseVault is ERC20, AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");
    bytes32 public constant FEE_ADMIN_ROLE = keccak256("FEE_ADMIN_ROLE");

    IERC20 public immutable asset;          // Underlying asset (USDC)
    ReferralManager public referralManager;
    PointsTracker public pointsTracker;
    StrategyController public strategyController;
    
    address public feeCollector;

    // Fee configuration (basis points)
    uint256 public depositFee = 10;         // 0.1%
    uint256 public performanceFee = 2000;   // 20%
    uint256 public constant BASIS_POINTS = 10000;
    
    // Maximum fee limits (basis points) to prevent malicious admin actions
    uint256 public constant MAX_DEPOSIT_FEE = 1000;      // 10% maximum
    uint256 public constant MAX_WITHDRAWAL_FEE = 1000;   // 10% maximum  
    uint256 public constant MAX_PERFORMANCE_FEE = 3000;  // 30% maximum
    
    // Tier-based minimum deposits (in USDC, 6 decimals)
    uint256 public constant MIN_DEPOSIT_NOVICE = 500e6;    // $500
    uint256 public constant MIN_DEPOSIT_FOREST = 2000e6;   // $2,000
    uint256 public constant MIN_DEPOSIT_CANOPY = 5000e6;   // $5,000
    uint256 public constant MIN_DEPOSIT_WHALE = 10000e6;   // $10,000

    // Withdrawal lock period
    uint256 public withdrawalLockPeriod = 60 days; // Maturity period
    mapping(address => uint256) public depositTimestamp;

    // Performance tracking
    uint256 public lastHarvestTimestamp;
    uint256 public totalHarvested;

    event Deposited(address indexed user, uint256 assets, uint256 shares, uint256 fee);
    event Withdrawn(address indexed user, uint256 assets, uint256 shares, uint256 fee);
    event Harvested(uint256 yield, uint256 timestamp);
    event PerformanceFeeCollected(uint256 amount, address indexed recipient);
    event FeesCollected(uint256 amount);
    event DepositFeeUpdated(uint256 oldFee, uint256 newFee);
    event WithdrawalFeeUpdated(uint256 oldFee, uint256 newFee);

    constructor(
        string memory name,
        string memory symbol,
        address _asset,
        address _referralManager,
        address _pointsTracker,
        address _strategyController,
        address _feeCollector
    ) ERC20(name, symbol) {
        require(_asset != address(0), "Invalid asset");
        require(_referralManager != address(0), "Invalid referral manager");

        asset = IERC20(_asset);
        referralManager = ReferralManager(_referralManager);
        pointsTracker = PointsTracker(_pointsTracker);
        strategyController = StrategyController(_strategyController);
        feeCollector = _feeCollector;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
        _grantRole(FEE_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Deposit assets into vault.
     * @dev ERC4626 compliant.
     */
    function deposit(uint256 assets, address receiver) public virtual nonReentrant whenNotPaused returns (uint256 shares) {
        require(receiver != address(0), "Invalid receiver");

        // Get user tier and check minimum deposit
        ReferralManager.Tier userTier = referralManager.getUserTier(msg.sender);
        uint256 minDeposit = _getMinimumDeposit(userTier);
        require(assets >= minDeposit, "Below tier minimum");

        // Check tier requirements (implemented by child contracts)
        _checkTierRequirement(msg.sender);

        // Calculate deposit fee
        uint256 fee = (assets * depositFee) / BASIS_POINTS;
        uint256 assetsAfterFee = assets - fee;

        // Calculate shares to mint
        shares = previewDeposit(assetsAfterFee);
        require(shares > 0, "Zero shares");

        // Transfer assets from user
        asset.safeTransferFrom(msg.sender, address(this), assets);

        // Send fee to collector
        if (fee > 0 && feeCollector != address(0)) {
            asset.safeTransfer(feeCollector, fee);
        }

        // Mint shares
        _mint(receiver, shares);

        // Allocate to strategies
        asset.safeTransfer(address(strategyController), assetsAfterFee);
        strategyController.allocate(receiver, assetsAfterFee);

        // Award points
        if (address(pointsTracker) != address(0)) {
            pointsTracker.updatePoints(receiver, assetsAfterFee / 1e6, "vault_deposit");
        }

        // Track deposit time
        depositTimestamp[receiver] = block.timestamp;

        emit Deposited(msg.sender, assets, shares, fee);
    }

    /**
     * @notice Withdraw assets from vault.
     */
    function withdraw(uint256 assets, address receiver, address owner) public virtual nonReentrant returns (uint256 shares) {
        require(assets > 0, "Zero assets");
        require(receiver != address(0), "Invalid receiver");

        // Calculate shares to burn
        shares = previewWithdraw(assets);

        // Check allowance if not owner
        if (msg.sender != owner) {
            uint256 allowed = allowance(owner, msg.sender);
            require(allowed >= shares, "Insufficient allowance");
            _approve(owner, msg.sender, allowed - shares);
        }

        // Calculate withdrawal fee
        uint256 fee = _calculateWithdrawalFee(owner, assets);
        uint256 assetsAfterFee = assets - fee;

        // Withdraw from strategies
        strategyController.deallocate(owner);

        // Burn shares
        _burn(owner, shares);

        // Transfer assets
        asset.safeTransfer(receiver, assetsAfterFee);

        // Send fee to collector
        if (fee > 0 && feeCollector != address(0)) {
            asset.safeTransfer(feeCollector, fee);
        }

        emit Withdrawn(owner, assets, shares, fee);
    }

    /**
     * @notice Harvest yield from strategies and compound (minus performance fee).
     * @dev Takes 20% performance fee, compounds the rest.
     */
    function harvestAndCompound() external onlyRole(KEEPER_ROLE) nonReentrant returns (uint256) {
        // Get current total assets before harvest
        uint256 assetsBefore = totalAssets();
        
        // Trigger harvest on all strategies (this updates their balances)
        // Note: Individual adapters handle their own harvest logic
        // This function just collects the realized gains
        
        // Get total assets after strategies have updated
        uint256 assetsAfter = totalAssets();
        
        // Calculate yield (profit only)
        require(assetsAfter > assetsBefore, "No yield to harvest");
        uint256 totalYield = assetsAfter - assetsBefore;
        
        // Calculate performance fee (20%)
        uint256 feeAmount = (totalYield * performanceFee) / BASIS_POINTS;
        uint256 compoundAmount = totalYield - feeAmount;
        
        // Transfer performance fee to fee collector
        if (feeAmount > 0 && feeCollector != address(0)) {
            // The fee stays in the vault but is tracked separately
            // It will be claimed by the fee collector later
            asset.safeTransfer(feeCollector, feeAmount);
            emit PerformanceFeeCollected(feeAmount, feeCollector);
        }
        
        // The remaining yield stays in the vault and compounds automatically
        // through the totalAssets() calculation
        
        // Update tracking
        lastHarvestTimestamp = block.timestamp;
        totalHarvested += totalYield;
        
        emit Harvested(totalYield, block.timestamp);
        
        return compoundAmount;
    }

    /**
     * @notice Get total assets under management.
     */
    function totalAssets() public view virtual returns (uint256) {
        // Get total from strategy controller + any assets held locally
        uint256 localBalance = asset.balanceOf(address(this));
        uint256 allocatedBalance = strategyController.getTotalAllocated();
        return localBalance + allocatedBalance;
    }

    /**
     * @notice Preview deposit - calculate shares for assets.
     */
    function previewDeposit(uint256 assets) public view returns (uint256) {
        uint256 supply = totalSupply();
        return supply == 0 ? assets : (assets * supply) / totalAssets();
    }

    /**
     * @notice Preview withdraw - calculate shares needed for assets.
     */
    function previewWithdraw(uint256 assets) public view returns (uint256) {
        uint256 supply = totalSupply();
        return supply == 0 ? assets : (assets * supply) / totalAssets();
    }

    /**
     * @notice Convert shares to assets.
     */
    function convertToAssets(uint256 shares) public view returns (uint256) {
        uint256 supply = totalSupply();
        return supply == 0 ? shares : (shares * totalAssets()) / supply;
    }

    /**
     * @notice Convert assets to shares.
     */
    function convertToShares(uint256 assets) public view returns (uint256) {
        return previewDeposit(assets);
    }

    /**
     * @notice Internal: Calculate withdrawal fee based on lock period.
     * @dev Virtual function to be overridden by child contracts.
     */
    function _calculateWithdrawalFee(address user, uint256 assets) internal view virtual returns (uint256) {
        uint256 depositTime = depositTimestamp[user];
        
        if (block.timestamp < depositTime + withdrawalLockPeriod) {
            // Default: 10% early withdrawal penalty
            return (assets * 1000) / BASIS_POINTS;
        }
        
        return 0; // No fee after maturity
    }

    /**
     * @notice Get minimum deposit amount based on user tier.
     */
    function _getMinimumDeposit(ReferralManager.Tier tier) internal pure returns (uint256) {
        if (tier == ReferralManager.Tier.Novice || tier == ReferralManager.Tier.Scout) {
            return MIN_DEPOSIT_NOVICE; // $500
        } else if (tier == ReferralManager.Tier.Captain) {
            return MIN_DEPOSIT_FOREST; // $2,000 for Captain tier
        } else {
            // Whale tier
            return MIN_DEPOSIT_WHALE; // $10,000
        }
    }

    /**
     * @notice Public function to get minimum deposit for any user.
     */
    function getMinimumDeposit(address user) public view returns (uint256) {
        ReferralManager.Tier userTier = referralManager.getUserTier(user);
        return _getMinimumDeposit(userTier);
    }

    /**
     * @notice Abstract: Check tier requirement (implemented by child contracts).
     */
    function _checkTierRequirement(address user) internal view virtual;

    /**
     * @notice Admin: Update fee collector.
     */
    function setFeeCollector(address _feeCollector) external onlyRole(FEE_ADMIN_ROLE) {
        feeCollector = _feeCollector;
    }

    /**
     * @notice Admin: Update deposit fee.
     * @param _fee New deposit fee in basis points
     */
    function setDepositFee(uint256 _fee) external onlyRole(FEE_ADMIN_ROLE) {
        require(_fee <= MAX_DEPOSIT_FEE, "Fee exceeds maximum");
        uint256 oldFee = depositFee;
        depositFee = _fee;
        emit DepositFeeUpdated(oldFee, _fee);
    }

    /**
     * @notice Admin: Pause deposits/withdrawals.
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Admin: Unpause deposits/withdrawals.
     */
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
