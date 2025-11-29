// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "./ReferralManager.sol";
import "./ActivityVerifier.sol";
import "./BaseJunglePositionNFT.sol";

/**
 * @title PointsTracker
 * @notice Tracks points earned by Base Jungle positions.
 */
contract PointsTracker is AccessControl, ReentrancyGuard {
    
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    bytes32 public constant SNAPSHOT_ROLE = keccak256("SNAPSHOT_ROLE");

    struct UserPoints {
        uint256 totalPoints;
        uint256 lastClaimTimestamp;
        uint256 pendingDailyPoints;
    }

    // State
    mapping(address => UserPoints) public userPoints;
    mapping(uint256 => uint256) public positionLastClaimTime; // tokenId -> timestamp

    // External Contracts
    ReferralManager public referralManager;
    ActivityVerifier public activityVerifier;
    BaseJunglePositionNFT public positionNFT;

    // Snapshot
    bool public snapshotTaken;
    bytes32 public snapshotMerkleRoot;
    uint256 public snapshotTimestamp;

    // Events
    event PointsUpdated(address indexed user, uint256 amount, string reason);
    event DailyPointsClaimed(address indexed user, uint256 amount, uint256 daysAccumulated);
    event SnapshotCreated(uint256 timestamp, bytes32 merkleRoot);

    constructor(address _referralManager, address _activityVerifier, address _positionNFT) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPDATER_ROLE, msg.sender);
        _grantRole(SNAPSHOT_ROLE, msg.sender);
        
        referralManager = ReferralManager(_referralManager);
        activityVerifier = ActivityVerifier(_activityVerifier);
        positionNFT = BaseJunglePositionNFT(_positionNFT);
    }

    /**
     * @notice Updates points for a specific user with automatic referral commission distribution.
     * @param user Address receiving points
     * @param amount Points to award
     * @param reason Reason for point award
     * @dev Automatically distributes 10% to direct referrer and 5% to indirect referrer if they exist.
     */
    function updatePoints(address user, uint256 amount, string calldata reason) external onlyRole(UPDATER_ROLE) nonReentrant {
        require(!snapshotTaken, "Snapshot taken");
        
        // Award points to user
        userPoints[user].totalPoints += amount;
        emit PointsUpdated(user, amount, reason);
        
        // Get referrer and distribute commission
        address referrer = referralManager.getReferrer(user);
        if (referrer != address(0)) {
            // Direct commission: 10%
            uint256 directCommission = (amount * 1000) / 10000;
            userPoints[referrer].totalPoints += directCommission;
            emit PointsUpdated(referrer, directCommission, "referral_commission_l1");
            
            // Get grandparent (second-tier)
            address grandParent = referralManager.getReferrer(referrer);
            if (grandParent != address(0)) {
                // Indirect commission: 5%
                uint256 indirectCommission = (amount * 500) / 10000;
                userPoints[grandParent].totalPoints += indirectCommission;
                emit PointsUpdated(grandParent, indirectCommission, "referral_commission_l2");
            }
        }
    }

    /**
     * @notice Redeems points for rewards (burns points).
     * @param amount Points to redeem
     */
    function redeemPoints(uint256 amount) external nonReentrant {
        require(!snapshotTaken, "Snapshot taken");
        require(userPoints[msg.sender].totalPoints >= amount, "Insufficient points");

        userPoints[msg.sender].totalPoints -= amount;
        emit PointsRedeemed(msg.sender, amount);
    }

    event PointsRedeemed(address indexed user, uint256 amount);

    /**
     * @notice Claims daily farming points for a specific position.
     */
    function claimDailyPoints(uint256 tokenId) external nonReentrant {
        require(!snapshotTaken, "Snapshot taken");
        require(positionNFT.ownerOf(tokenId) == msg.sender, "Not owner");

        (,,,, uint256 dailyRate,,) = positionNFT.positions(tokenId);
        
        uint256 lastClaim = positionLastClaimTime[tokenId];
        if (lastClaim == 0) {
            // First claim, start from purchase time
            (,, uint256 purchaseTime,,,,) = positionNFT.positions(tokenId);
            lastClaim = purchaseTime;
        }

        uint256 currentTime = block.timestamp;
        uint256 daysElapsed = (currentTime - lastClaim) / 1 days;
        
        require(daysElapsed > 0, "Nothing to claim");
        
        // Cap at 90 days
        if (daysElapsed > 90) {
            daysElapsed = 90;
        }

        // Calculate base points
        uint256 basePoints = dailyRate * daysElapsed;

        // Apply Multiplier
        uint256 multiplier = referralManager.getMultiplier(msg.sender); // e.g. 2500 for 25%
        uint256 bonusPoints = (basePoints * multiplier) / 10000;
        uint256 totalClaim = basePoints + bonusPoints;

        // Update state
        positionLastClaimTime[tokenId] = currentTime;
        userPoints[msg.sender].totalPoints += totalClaim;

        emit DailyPointsClaimed(msg.sender, totalClaim, daysElapsed);
    }

    /**
     * @notice Verifies and awards points for an activity.
     */
    function submitActivity(
        bytes32 activityId,
        bytes32 activityType,
        uint256 points,
        uint256 deadline,
        bytes calldata signature
    ) external nonReentrant {
        require(!snapshotTaken, "Snapshot taken");
        
        uint256 awarded = activityVerifier.verifyActivity(
            msg.sender, 
            activityId, 
            activityType, 
            points, 
            deadline, 
            signature
        );
        
        if (awarded > 0) {
            userPoints[msg.sender].totalPoints += awarded;
            emit PointsUpdated(msg.sender, awarded, "Activity");
        }
    }

    /**
     * @notice Takes the TGE snapshot.
     */
    function takeSnapshot(bytes32 merkleRoot) external onlyRole(SNAPSHOT_ROLE) {
        require(!snapshotTaken, "Already taken");
        snapshotTaken = true;
        snapshotMerkleRoot = merkleRoot;
        snapshotTimestamp = block.timestamp;
        emit SnapshotCreated(block.timestamp, merkleRoot);
    }

    /**
     * @notice Verifies a user's balance against the snapshot.
     */
    function verifySnapshot(address user, uint256 amount, bytes32[] calldata proof) external view returns (bool) {
        require(snapshotTaken, "Snapshot not taken");
        bytes32 leaf = keccak256(abi.encodePacked(user, amount));
        return MerkleProof.verify(proof, snapshotMerkleRoot, leaf);
    }
    
    /**
     * @notice View function to see pending daily points.
     */
    function getPendingDailyPoints(uint256 tokenId) external view returns (uint256) {
        (,,,, uint256 dailyRate,,) = positionNFT.positions(tokenId);
        
        uint256 lastClaim = positionLastClaimTime[tokenId];
        if (lastClaim == 0) {
             (,, uint256 purchaseTime,,,,) = positionNFT.positions(tokenId);
             lastClaim = purchaseTime;
        }
        
        uint256 daysElapsed = (block.timestamp - lastClaim) / 1 days;
        if (daysElapsed > 90) daysElapsed = 90;
        
        address owner = positionNFT.ownerOf(tokenId);
        uint256 multiplier = referralManager.getMultiplier(owner);
        
        uint256 basePoints = dailyRate * daysElapsed;
        uint256 bonusPoints = (basePoints * multiplier) / 10000;
        
        return basePoints + bonusPoints;
    }
}
