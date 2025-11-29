// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title FeeCollector
 * @notice Centralized fee collection and distribution for all Base Jungle vaults.
 * @dev Splits fees: 60% treasury, 30% staking rewards, 10% buyback & burn.
 */
contract FeeCollector is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant FEE_ADMIN_ROLE = keccak256("FEE_ADMIN_ROLE");

    // Fee recipients
    address public treasury;
    address public stakingRewards;
    address public buybackWallet;

    // Fee split (basis points)
    uint256 public treasurySplit = 6000;    // 60%
    uint256 public stakingSplit = 3000;     // 30%
    uint256 public buybackSplit = 1000;     // 10%
    uint256 public constant BASIS_POINTS = 10000;

    // Total fees collected per token
    mapping(address => uint256) public totalCollected;

    event FeesCollected(address indexed token, uint256 amount, address indexed vault);
    event FeesDistributed(
        address indexed token,
        uint256 treasuryAmount,
        uint256 stakingAmount,
        uint256 buybackAmount
    );
    event RecipientsUpdated(address treasury, address staking, address buyback);
    event SplitUpdated(uint256 treasury, uint256 staking, uint256 buyback);

    constructor(
        address _treasury,
        address _stakingRewards,
        address _buybackWallet
    ) {
        require(_treasury != address(0), "Invalid treasury");
        require(_stakingRewards != address(0), "Invalid staking");
        require(_buybackWallet != address(0), "Invalid buyback");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(FEE_ADMIN_ROLE, msg.sender);

        treasury = _treasury;
        stakingRewards = _stakingRewards;
        buybackWallet = _buybackWallet;
    }

    /**
     * @notice Collect fees from caller (vault).
     * @dev Vaults call this when transferring fees.
     */
    function collectFees(address token, uint256 amount) external {
        require(amount > 0, "Amount zero");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        totalCollected[token] += amount;

        emit FeesCollected(token, amount, msg.sender);
    }

    /**
     * @notice Distribute collected fees to recipients.
     */
    function distributeFees(address token) external onlyRole(FEE_ADMIN_ROLE) {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "No fees to distribute");

        // Calculate splits
        uint256 treasuryAmount = (balance * treasurySplit) / BASIS_POINTS;
        uint256 stakingAmount = (balance * stakingSplit) / BASIS_POINTS;
        uint256 buybackAmount = balance - treasuryAmount - stakingAmount; // Remaining

        // Transfer to recipients
        if (treasuryAmount > 0) {
            IERC20(token).safeTransfer(treasury, treasuryAmount);
        }
        if (stakingAmount > 0) {
            IERC20(token).safeTransfer(stakingRewards, stakingAmount);
        }
        if (buybackAmount > 0) {
            IERC20(token).safeTransfer(buybackWallet, buybackAmount);
        }

        emit FeesDistributed(token, treasuryAmount, stakingAmount, buybackAmount);
    }

    /**
     * @notice Update fee recipients.
     */
    function setRecipients(
        address _treasury,
        address _stakingRewards,
        address _buybackWallet
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_treasury != address(0), "Invalid treasury");
        require(_stakingRewards != address(0), "Invalid staking");
        require(_buybackWallet != address(0), "Invalid buyback");

        treasury = _treasury;
        stakingRewards = _stakingRewards;
        buybackWallet = _buybackWallet;

        emit RecipientsUpdated(_treasury, _stakingRewards, _buybackWallet);
    }

    /**
     * @notice Update fee split percentages.
     */
    function setSplit(
        uint256 _treasurySplit,
        uint256 _stakingSplit,
        uint256 _buybackSplit
    ) external onlyRole(FEE_ADMIN_ROLE) {
        require(_treasurySplit + _stakingSplit + _buybackSplit == BASIS_POINTS, "Must total 100%");

        treasurySplit = _treasurySplit;
        stakingSplit = _stakingSplit;
        buybackSplit = _buybackSplit;

        emit SplitUpdated(_treasurySplit, _stakingSplit, _buybackSplit);
    }

    /**
     * @notice Get current split configuration.
     */
    function getSplit() external view returns (uint256, uint256, uint256) {
        return (treasurySplit, stakingSplit, buybackSplit);
    }

    /**
     * @notice Calculate split for a given amount.
     */
    function previewDistribution(uint256 amount) external view returns (
        uint256 treasuryAmount,
        uint256 stakingAmount,
        uint256 buybackAmount
    ) {
        treasuryAmount = (amount * treasurySplit) / BASIS_POINTS;
        stakingAmount = (amount * stakingSplit) / BASIS_POINTS;
        buybackAmount = amount - treasuryAmount - stakingAmount;
    }
}
