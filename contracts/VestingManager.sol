// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title VestingManager
 * @notice Manages token vesting schedules with tier-based parameters.
 */
contract VestingManager is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant VESTING_ADMIN_ROLE = keccak256("VESTING_ADMIN_ROLE");

    struct VestingSchedule {
        uint256 totalAmount; // Total tokens to vest
        uint256 startTime; // TGE timestamp
        uint256 duration; // Vesting duration in seconds
        uint256 immediateUnlock; // % unlocked at TGE (basis points)
        uint256 claimed; // Amount already claimed
        uint256 tier; // User's tier (0-5)
    }

    mapping(address => VestingSchedule) public vestingSchedules;

    IERC20 public baobabToken;
    bool public tgeOccurred;
    uint256 public tgeTimestamp;

    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 totalAmount,
        uint256 immediateUnlock,
        uint256 duration,
        uint256 tier
    );

    event TokensClaimed(
        address indexed beneficiary,
        uint256 amount,
        uint256 timestamp
    );

    event TGETriggered(uint256 timestamp);

    constructor(address _baobabToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VESTING_ADMIN_ROLE, msg.sender);
        baobabToken = IERC20(_baobabToken);
    }

    /**
     * @notice Create vesting schedule for user based on their tier.
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 totalPoints,
        uint256 tier // 0-5 (Sprout to Forest)
    ) external onlyRole(VESTING_ADMIN_ROLE) {
        require(beneficiary != address(0), "Zero address");
        require(totalPoints > 0, "Zero amount");
        require(tier <= 5, "Invalid tier");
        require(vestingSchedules[beneficiary].totalAmount == 0, "Schedule exists");

        // Determine vesting parameters based on tier
        (uint256 immediateUnlock, uint256 duration) = _getTierVesting(tier);

        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: totalPoints, // 1 point = 1 token
            startTime: tgeTimestamp, // Will be set at TGE
            duration: duration,
            immediateUnlock: immediateUnlock,
            claimed: 0,
            tier: tier
        });

        emit VestingScheduleCreated(
            beneficiary,
            totalPoints,
            immediateUnlock,
            duration,
            tier
        );
    }

    function _getTierVesting(uint256 tier)
        internal
        pure
        returns (uint256 immediate, uint256 duration)
    {
        if (tier == 0) {
            // Sprout
            immediate = 2500; // 25%
            duration = 90 days;
        } else if (tier == 1) {
            // Sapling
            immediate = 3000; // 30%
            duration = 180 days;
        } else if (tier == 2) {
            // Branch
            immediate = 4000; // 40%
            duration = 270 days;
        } else if (tier == 3) {
            // Tree
            immediate = 5000; // 50%
            duration = 365 days;
        } else if (tier == 4) {
            // Grove
            immediate = 6000; // 60%
            duration = 540 days;
        } else {
            // Forest
            immediate = 7000; // 70%
            duration = 730 days;
        }
    }

    /**
     * @notice Trigger TGE (only once).
     */
    function triggerTGE() external onlyRole(VESTING_ADMIN_ROLE) {
        require(!tgeOccurred, "TGE already occurred");

        tgeOccurred = true;
        tgeTimestamp = block.timestamp;

        emit TGETriggered(block.timestamp);
    }

    /**
     * @notice Update start time for a specific beneficiary (after TGE).
     */
    function setStartTime(address beneficiary) external onlyRole(VESTING_ADMIN_ROLE) {
        require(tgeOccurred, "TGE not occurred");
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        require(schedule.totalAmount > 0, "No schedule");
        require(schedule.startTime == 0, "Start time already set");
        
        schedule.startTime = tgeTimestamp;
    }

    /**
     * @notice Calculate vested amount.
     */
    function vestedAmount(address beneficiary)
        public
        view
        returns (uint256)
    {
        if (!tgeOccurred) return 0;

        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        if (schedule.totalAmount == 0) return 0;
        if (schedule.startTime == 0) return 0;

        // Immediate unlock
        uint256 immediate = (schedule.totalAmount * schedule.immediateUnlock) / 10000;

        // Time-based vesting
        if (block.timestamp < schedule.startTime) {
            return 0;
        }

        uint256 elapsed = block.timestamp - schedule.startTime;
        uint256 vestedFromTime;

        if (elapsed >= schedule.duration) {
            // Fully vested
            return schedule.totalAmount;
        } else {
            // Partially vested (linear)
            uint256 vestingAmount = schedule.totalAmount - immediate;
            vestedFromTime = (vestingAmount * elapsed) / schedule.duration;
            return immediate + vestedFromTime;
        }
    }

    /**
     * @notice Calculate claimable amount.
     */
    function claimableAmount(address beneficiary)
        public
        view
        returns (uint256)
    {
        uint256 vested = vestedAmount(beneficiary);
        uint256 claimed = vestingSchedules[beneficiary].claimed;
        return vested > claimed ? vested - claimed : 0;
    }

    /**
     * @notice Claim vested tokens.
     */
    function claim() external nonReentrant {
        uint256 claimable = claimableAmount(msg.sender);
        require(claimable > 0, "Nothing to claim");

        vestingSchedules[msg.sender].claimed += claimable;

        baobabToken.safeTransfer(msg.sender, claimable);

        emit TokensClaimed(msg.sender, claimable, block.timestamp);
    }

    /**
     * @notice Get vesting schedule details.
     */
    function getVestingSchedule(address beneficiary)
        external
        view
        returns (
            uint256 totalAmount,
            uint256 startTime,
            uint256 duration,
            uint256 immediateUnlock,
            uint256 claimed,
            uint256 tier
        )
    {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        return (
            schedule.totalAmount,
            schedule.startTime,
            schedule.duration,
            schedule.immediateUnlock,
            schedule.claimed,
            schedule.tier
        );
    }
}
