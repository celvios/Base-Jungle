// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./BaseVault.sol";

/**
 * @title ConservativeVault
 * @notice Low-risk vault optimized for Novice/Scout tiers.
 * @dev Open to all tiers, but allocation optimized for beginners.
 * 
 * Expected APY: 6-10%
 * Strategy Mix: 50-70% lending, 20-30% stable LP, 20-30% Beefy vaults
 * Maturity: 60 days with 10% early withdrawal penalty
 */
contract ConservativeVault is BaseVault {

    constructor(
        address _asset,
        address _referralManager,
        address _pointsTracker,
        address _strategyController,
        address _feeCollector
    ) BaseVault(
        "Base Jungle Conservative Vault",
        "bjCONS",
        _asset,
        _referralManager,
        _pointsTracker,
        _strategyController,
        _feeCollector
    ) {
        // Set conservative parameters
        depositFee = 10; // 0.1%
        withdrawalLockPeriod = 60 days; // Maturity period
    }

    /**
     * @notice Tier check: Open to all users (no minimum requirement).
     */
    function _checkTierRequirement(address) internal pure override {
        // No restriction - anyone can deposit
        return;
    }

    /**
     * @notice Override withdrawal fee for conservative approach.
     * @dev 10% penalty if withdrawn before 60-day maturity.
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
     * @notice Get vault info.
     */
    function getVaultInfo() external view returns (
        string memory name,
        string memory description,
        uint256 tvl,
        uint256 minDeposit,
        uint256 depositFeeRate,
        uint256 lockPeriod
    ) {
        name = "Conservative Vault";
        description = "Low-risk vault for all users with stable yields (60-day maturity)";
        tvl = totalAssets();
        minDeposit = MIN_DEPOSIT_NOVICE; // $500 minimum for lowest tier
        depositFeeRate = depositFee;
        lockPeriod = withdrawalLockPeriod;
    }
}
