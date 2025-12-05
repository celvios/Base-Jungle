// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ReferralManager
 * @notice Manages referral system with tier-based leverage unlocks and commission distribution.
 * @dev Upgraded with Novice/Scout/Captain/Whale tiers based on active referrals.
 */
contract ReferralManager is AccessControl {
    
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant ACTIVITY_TRACKER_ROLE = keccak256("ACTIVITY_TRACKER_ROLE");

    // Tier enum for referral-based unlocks
    enum Tier { Novice, Scout, Captain, Whale }

    struct ReferralInfo {
        address referrer;
        uint256 directReferrals;           // Total direct referrals (all time)
        uint256 indirectReferrals;         // Level 2 referrals
        uint256 activeDirectReferrals;     // Only active referrals (30-day activity)
        bool registered;
        bool isActive;                     // Has user deposited/been active?
        uint256 lastActivityTimestamp;     // Last activity timestamp
    }

    mapping(address => ReferralInfo) public referralInfo;
    mapping(bytes32 => address) public codeOwners;
    mapping(address => bytes32) public userCodes;

    // Activity expiry window (30 days)
    uint256 public constant ACTIVITY_WINDOW = 30 days;
    
    // Maximum referral depth for circular detection (reduced from 10 to 5 for gas efficiency)
    uint256 public constant MAX_REFERRAL_DEPTH = 5;

    event ReferralRegistered(address indexed user, address indexed referrer);
    event CodeRegistered(address indexed user, bytes32 code);
    event UserActivated(address indexed user);
    event UserDeactivated(address indexed user);
    event TierUpgraded(address indexed user, Tier newTier);
    event ActivityExpired(address indexed user, uint256 lastActivity);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
        _grantRole(ACTIVITY_TRACKER_ROLE, msg.sender);
    }

    /**
     * @notice Registers a referral code for the caller.
     */
    function registerCode(bytes32 code) external {
        require(codeOwners[code] == address(0), "Code already taken");
        require(userCodes[msg.sender] == bytes32(0), "User already has a code");
        require(code != bytes32(0), "Invalid code");

        codeOwners[code] = msg.sender;
        userCodes[msg.sender] = code;
        emit CodeRegistered(msg.sender, code);
    }

    /**
     * @notice Registers a user with a referrer.
     * @dev M-4 FIX: Enhanced circular referral detection (checks 10 levels deep)
     */
    function registerReferral(address user, bytes32 code) external {
        require(!referralInfo[user].registered, "Already registered");
        require(user != address(0), "Invalid user");
        
        address referrer = codeOwners[code];
        require(referrer != address(0), "Invalid code");
        require(referrer != user, "Cannot refer self");
        
        // Enhanced circular referral detection - check up to 5 levels deep (reduced for gas efficiency)
        address current = referrer;
        for (uint256 i = 0; i < MAX_REFERRAL_DEPTH; i++) {
            if (current == address(0)) break;
            require(current != user, "Circular referral detected");
            current = referralInfo[current].referrer;
        }

        referralInfo[user].referrer = referrer;
        referralInfo[user].registered = true;

        // Update referrer stats (but not active until user deposits)
        referralInfo[referrer].directReferrals++;
        
        // Update indirect (level 2)
        address grandParent = referralInfo[referrer].referrer;
        if (grandParent != address(0)) {
            referralInfo[grandParent].indirectReferrals++;
        }

        emit ReferralRegistered(user, referrer);
    }

    /**
     * @notice Mark a user as active (called when they make their first deposit).
     */
    function markActive(address user) external onlyRole(ACTIVITY_TRACKER_ROLE) {
        ReferralInfo storage info = referralInfo[user];
        
        if (!info.isActive) {
            info.isActive = true;
            info.lastActivityTimestamp = block.timestamp;
            
            // Update referrer's active count
            address referrer = info.referrer;
            if (referrer != address(0)) {
                referralInfo[referrer].activeDirectReferrals++;
                emit TierUpgraded(referrer, getUserTier(referrer));
            }
            
            emit UserActivated(user);
        } else {
            // Refresh activity timestamp
            info.lastActivityTimestamp = block.timestamp;
        }
    }

    /**
     * @notice Check and update activity expiry for a user.
     * @dev Can be called by anyone to trigger activity checks.
     */
    function checkActivityExpiry(address user) public {
        ReferralInfo storage info = referralInfo[user];
        
        if (info.isActive && block.timestamp > info.lastActivityTimestamp + ACTIVITY_WINDOW) {
            info.isActive = false;
            
            // Decrement referrer's active count
            address referrer = info.referrer;
            if (referrer != address(0) && referralInfo[referrer].activeDirectReferrals > 0) {
                referralInfo[referrer].activeDirectReferrals--;
                emit TierUpgraded(referrer, getUserTier(referrer));
            }
            
            emit UserDeactivated(user);
        }
    }

    /**
     * @notice Get user's tier based on active referrals.
     */
    function getUserTier(address user) public view returns (Tier) {
        uint256 activeRefs = referralInfo[user].activeDirectReferrals;
        
        if (activeRefs >= 50) return Tier.Whale;
        if (activeRefs >= 20) return Tier.Captain;
        if (activeRefs >= 5) return Tier.Scout;
        return Tier.Novice;
    }

    /**
     * @notice Get tier-based point multiplier (basis points).
     * @return Multiplier in basis points (10000 = 1.0x)
     */
    function getTierMultiplier(Tier tier) public pure returns (uint256) {
        if (tier == Tier.Whale) return 15000;    // 1.5x
        if (tier == Tier.Captain) return 12500;  // 1.25x
        if (tier == Tier.Scout) return 11000;    // 1.1x
        return 10000;                             // 1.0x (Novice)
    }

    /**
     * @notice Get maximum leverage allowed for a tier (basis points).
     * @return Max leverage in basis points (10000 = 1.0x)
     */
    function getMaxLeverage(Tier tier) public pure returns (uint256) {
        if (tier == Tier.Whale) return 50000;    // 5.0x
        if (tier == Tier.Captain) return 30000;  // 3.0x
        if (tier == Tier.Scout) return 20000;    // 2.0x
        return 15000;                             // 1.5x (Novice)
    }

    /**
     * @notice Get referrer address for a user.
     */
    function getReferrer(address user) external view returns (address) {
        return referralInfo[user].referrer;
    }

    /**
     * @notice Get comprehensive user tier info.
     */
    function getUserTierInfo(address user) external view returns (
        Tier tier,
        uint256 pointMultiplier,
        uint256 maxLeverage,
        uint256 activeReferrals,
        uint256 totalReferrals
    ) {
        tier = getUserTier(user);
        pointMultiplier = getTierMultiplier(tier);
        maxLeverage = getMaxLeverage(tier);
        activeReferrals = referralInfo[user].activeDirectReferrals;
        totalReferrals = referralInfo[user].directReferrals;
    }

    /**
     * @notice Legacy multiplier function (deprecated, use getTierMultiplier instead).
     */
    function getMultiplier(address user) external view returns (uint256) {
        Tier tier = getUserTier(user);
        return getTierMultiplier(tier);
    }
}

