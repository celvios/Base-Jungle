// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./BaseVault.sol";

/**
 * @title AggressiveVault
 * @notice High-yield vault for Captain/Whale tiers only.
 * @dev TIER-GATED: Requires Captain tier (20+ active referrals) minimum.
 * 
 * Expected APY: 12-25%
 * Strategy Mix: Leveraged lending, volatile LP, gauge farming, leveraged LP
 * Maturity: 60 days with 10% early withdrawal penalty
 */
contract AggressiveVault is BaseVault {

    // Minimum tier required for access
    ReferralManager.Tier public constant MIN_TIER = ReferralManager.Tier.Captain;

    constructor(
        address _asset,
        address _referralManager,
        address _pointsTracker,
        address _strategyController,
        address _feeCollector
    ) BaseVault(
        "Base Jungle Aggressive Vault",
        "bjAGG",
        _asset,
        _referralManager,
        _pointsTracker,
        _strategyController,
        _feeCollector
    ) {
        // Set aggressive parameters
        depositFee = 0; // No deposit fee for high-tier users
        withdrawalLockPeriod = 60 days; // Same maturity as conservative
    }

    /**
     * @notice Tier check: Requires Captain tier minimum (20+ active referrals).
     */
    function _checkTierRequirement(address user) internal view override {
        ReferralManager.Tier userTier = referralManager.getUserTier(user);
        require(userTier >= MIN_TIER, "Tier too low - need Captain (20+ refs)");
    }

    /**
     * @notice Override withdrawal fee for aggressive approach.
     * @dev 10% penalty if withdrawn before 60-day maturity (same as conservative).
     */
    function _calculateWithdrawalFee(
        address depositor,
        uint256 assets
    ) internal view override returns (uint256) {
        uint256 depositTime = depositTimestamp[depositor];
        
        if (block.timestamp < depositTime + withdrawalLockPeriod) {
            // 10% early withdrawal penalty
            return (assets * 1000) / BASIS_POINTS;
        }
        
        return 0; // No fee after maturity
    }

    /**
     * @notice Check if user meets tier requirement.
     */
    function canDeposit(address user) external view returns (bool) {
        ReferralManager.Tier userTier = referralManager.getUserTier(user);
        return userTier >= MIN_TIER;
    }

    /**
     * @notice Get vault info.
     */
    function getVaultInfo() external view returns (
        string memory name,
        string memory description,
        uint256 tvl,
        uint256 minDeposit,
        uint256 depositFeeRate,
        uint256 lockPeriod,
        ReferralManager.Tier minTierRequired
    ) {
        name = "Aggressive Vault";
        description = "High-yield vault for Captain+ tiers with leveraged strategies (60-day maturity)";
        tvl = totalAssets();
        minDeposit = MIN_DEPOSIT_WHALE; // $10,000 minimum for Whale tier
        depositFeeRate = depositFee;
        lockPeriod = withdrawalLockPeriod;
        minTierRequired = MIN_TIER;
    }
}
