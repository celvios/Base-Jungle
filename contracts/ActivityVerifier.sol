// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title ActivityVerifier
 * @notice Verifies off-chain activities via signatures.
 */
contract ActivityVerifier is AccessControl {
    using ECDSA for bytes32;

    bytes32 public constant ACTIVITY_SIGNER_ROLE = keccak256("ACTIVITY_SIGNER_ROLE");

    // Mapping to track used nonces or activity IDs to prevent replay
    mapping(address => mapping(bytes32 => bool)) public completedActivities;
    
    // Rate limiting: user -> activityType -> timestamp -> count
    // Simplified: user -> activityType -> lastActionTimestamp
    // Or daily cap: user -> activityType -> day -> points
    mapping(address => mapping(bytes32 => mapping(uint256 => uint256))) public dailyActivityPoints;
    mapping(bytes32 => uint256) public activityDailyCaps;

    event ActivityVerified(address indexed user, bytes32 indexed activityId, uint256 points);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ACTIVITY_SIGNER_ROLE, msg.sender);
    }

    function setActivityCap(bytes32 activityType, uint256 cap) external onlyRole(DEFAULT_ADMIN_ROLE) {
        activityDailyCaps[activityType] = cap;
    }

    /**
     * @notice Verifies an activity signature and checks constraints.
     * @return pointsToAward The amount of points to award (adjusted for caps).
     */
    function verifyActivity(
        address user,
        bytes32 activityId,
        bytes32 activityType,
        uint256 points,
        uint256 deadline,
        bytes calldata signature
    ) external returns (uint256) {
        require(block.timestamp <= deadline, "Signature expired");
        require(!completedActivities[user][activityId], "Already claimed");

        // Verify signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            user,
            activityId,
            activityType,
            points,
            deadline,
            block.chainid,
            address(this)
        ));
        
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address signer = ethSignedHash.recover(signature);
        
        require(hasRole(ACTIVITY_SIGNER_ROLE, signer), "Invalid signature");
        
        // Mark as completed
        completedActivities[user][activityId] = true;

        // Check Daily Cap
        uint256 day = block.timestamp / 1 days;
        uint256 currentDaily = dailyActivityPoints[user][activityType][day];
        uint256 cap = activityDailyCaps[activityType];
        
        uint256 pointsToAward = points;
        
        if (cap > 0) {
            if (currentDaily >= cap) {
                pointsToAward = 0;
            } else if (currentDaily + points > cap) {
                pointsToAward = cap - currentDaily;
            }
        }
        
        if (pointsToAward > 0) {
            dailyActivityPoints[user][activityType][day] += pointsToAward;
        }

        emit ActivityVerified(user, activityId, pointsToAward);
        
        return pointsToAward;
    }
}
