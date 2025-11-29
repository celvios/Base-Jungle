// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BaseJunglePositionNFT
 * @notice NFT representing a user's position in the Base Jungle protocol.
 * @dev Implements ERC721, AccessControl, and ReentrancyGuard.
 *      Positions have tiers (Sprout, Sapling, etc.) and are Soulbound until TGE.
 */
contract BaseJunglePositionNFT is ERC721, AccessControl, ReentrancyGuard, Pausable {
    
    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Enums
    enum Tier { Sprout, Sapling, Branch, Tree, Grove, Forest }

    // Structs
    struct Position {
        Tier tier;
        uint256 purchaseAmountUSD; // In 6 decimals (USDC standard)
        uint256 purchaseTimestamp;
        uint256 basePointsAwarded;
        uint256 dailyFarmingRate;
        uint256 lockPeriodDays;
        bool isSoulbound; // True until TGE or specific exemption
    }

    // State Variables
    mapping(uint256 => Position) public positions;
    mapping(Tier => uint256) public tierPrices; // USD in 6 decimals
    mapping(Tier => uint256) public tierBasePoints;
    mapping(Tier => uint256) public tierDailyRate;
    mapping(Tier => uint256) public tierLockDays;

    uint256 private _nextTokenId;
    uint256 public constant MAX_SUPPLY = 10000;
    
    address public pointsTracker;
    address public treasuryManager;
    bool public isGlobalSoulbound = true; // Global switch for soulbound status

    // Events
    event PositionMinted(address indexed owner, uint256 indexed tokenId, Tier tier, uint256 amountPaid);
    event TierConfigUpdated(Tier tier, uint256 price, uint256 basePoints, uint256 dailyRate, uint256 lockDays);
    event GlobalSoulboundStatusChanged(bool isSoulbound);
    event PositionSoulboundStatusChanged(uint256 indexed tokenId, bool isSoulbound);

    // Errors
    error MaxSupplyReached();
    error InvalidPaymentAmount();
    error TransferIsSoulbound();
    error InvalidTier();

    constructor(address _treasuryManager, address _pointsTracker) ERC721("Base Jungle Position", "BJP") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(UPDATER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);

        treasuryManager = _treasuryManager;
        pointsTracker = _pointsTracker;

        // Initialize default tier configs (can be updated later)
        // Example values, should be set properly via updateTierConfig
    }

    /**
     * @notice Mints a new position NFT.
     * @param to The address to receive the NFT.
     * @param tier The tier of the position to mint.
     * @param paymentToken The address of the token used for payment (e.g., USDC).
     * @param amount The amount of payment tokens.
     */
    function mintPosition(address to, Tier tier, address paymentToken, uint256 amount) external nonReentrant onlyRole(MINTER_ROLE) whenNotPaused {
        if (_nextTokenId >= MAX_SUPPLY) revert MaxSupplyReached();
        
        // Validation of payment and tier price would go here
        // For now, assuming the caller (likely a helper contract or frontend via allowance) handles the transfer to Treasury
        
        uint256 tokenId = _nextTokenId++;
        
        positions[tokenId] = Position({
            tier: tier,
            purchaseAmountUSD: amount, // Assuming amount is in USD 6 decimals
            purchaseTimestamp: block.timestamp,
            basePointsAwarded: tierBasePoints[tier],
            dailyFarmingRate: tierDailyRate[tier],
            lockPeriodDays: tierLockDays[tier],
            isSoulbound: true
        });

        _safeMint(to, tokenId);
        
        emit PositionMinted(to, tokenId, tier, amount);
    }

    /**
     * @notice Updates the configuration for a specific tier.
     */
    function updateTierConfig(
        Tier tier, 
        uint256 price, 
        uint256 basePoints, 
        uint256 dailyRate, 
        uint256 lockDays
    ) external onlyRole(UPDATER_ROLE) {
        tierPrices[tier] = price;
        tierBasePoints[tier] = basePoints;
        tierDailyRate[tier] = dailyRate;
        tierLockDays[tier] = lockDays;
        
        emit TierConfigUpdated(tier, price, basePoints, dailyRate, lockDays);
    }

    /**
     * @notice Toggles the global soulbound status.
     */
    function setGlobalSoulbound(bool _status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        isGlobalSoulbound = _status;
        emit GlobalSoulboundStatusChanged(_status);
    }

    /**
     * @notice Toggles soulbound status for a specific token (e.g. for special exemptions).
     */
    function setPositionSoulbound(uint256 tokenId, bool _status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        positions[tokenId].isSoulbound = _status;
        emit PositionSoulboundStatusChanged(tokenId, _status);
    }

    /**
     * @notice Updates the PointsTracker address.
     */
    function setPointsTracker(address _pointsTracker) external onlyRole(DEFAULT_ADMIN_ROLE) {
        pointsTracker = _pointsTracker;
    }

    /**
     * @notice Pauses the contract.
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Unpauses the contract.
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Hook that is called before any token transfer. This includes minting and burning.
     * Checks if the token is soulbound.
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // If it's a transfer (not minting or burning)
        if (from != address(0) && to != address(0)) {
            if (isGlobalSoulbound && positions[tokenId].isSoulbound) {
                revert TransferIsSoulbound();
            }
        }

        return super._update(to, tokenId, auth);
    }

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
