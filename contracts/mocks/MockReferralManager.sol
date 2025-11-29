// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "../ReferralManager.sol";

contract MockReferralManager {
    mapping(address => uint8) public userTiers;

    mapping(address => address) public referrers;

    function setUserTier(address user, uint8 tier) external {
        userTiers[user] = tier;
    }

    function getUserTier(address user) external view returns (uint8) {
        return userTiers[user];
    }

    function setReferrer(address user, address referrer) external {
        referrers[user] = referrer;
    }

    function getReferrer(address user) external view returns (address) {
        return referrers[user];
    }
}
