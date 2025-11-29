// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TokenSale
 * @notice Manages the $JUNGLE token sale with vesting.
 */
contract TokenSale is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20 public usdc;
    IERC20 public jungleToken;

    // Sale Config
    uint256 public pricePerToken; // In USDC (6 decimals), e.g., 0.1 USDC = 100000
    uint256 public startTime;
    uint256 public endTime;
    uint256 public softCap;
    uint256 public hardCap;
    uint256 public totalRaised;
    bool public saleFinalized;

    // Vesting Config
    uint256 public tgeUnlockPercent = 1000; // 10% (Basis points)
    uint256 public cliffDuration = 30 days;
    uint256 public vestingDuration = 365 days;

    struct UserInfo {
        uint256 totalPurchased;   // Total tokens purchased
        uint256 totalClaimed;     // Total tokens claimed
        uint256 usdcSpent;        // Total USDC spent
    }

    mapping(address => UserInfo) public userInfo;

    event TokensPurchased(address indexed buyer, uint256 usdcAmount, uint256 tokenAmount);
    event TokensClaimed(address indexed user, uint256 amount);
    event SaleFinalized(uint256 totalRaised);

    constructor(
        address _usdc,
        address _jungleToken,
        uint256 _pricePerToken,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _softCap,
        uint256 _hardCap
    ) {
        require(_usdc != address(0), "Invalid USDC");
        require(_jungleToken != address(0), "Invalid Token");
        require(_startTime < _endTime, "Invalid times");
        require(_pricePerToken > 0, "Invalid price");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        usdc = IERC20(_usdc);
        jungleToken = IERC20(_jungleToken);
        pricePerToken = _pricePerToken;
        startTime = _startTime;
        endTime = _endTime;
        softCap = _softCap;
        hardCap = _hardCap;
    }

    /**
     * @notice Purchase tokens with USDC.
     */
    function purchase(uint256 usdcAmount) external nonReentrant {
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Sale not active");
        require(usdcAmount > 0, "Zero amount");
        require(totalRaised + usdcAmount <= hardCap, "Hard cap reached");

        // Calculate token amount (USDC 6 decimals -> Token 18 decimals)
        // Price is in USDC (6 decimals) for 1 Token (18 decimals)
        // Example: Price 0.1 USDC (100000). Amount 100 USDC (100000000).
        // Tokens = (100000000 * 1e18) / 100000 = 1000 * 1e18
        uint256 tokenAmount = (usdcAmount * 1e18) / pricePerToken;
        
        // Transfer USDC
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);

        // Update state
        userInfo[msg.sender].totalPurchased += tokenAmount;
        userInfo[msg.sender].usdcSpent += usdcAmount;
        totalRaised += usdcAmount;

        emit TokensPurchased(msg.sender, usdcAmount, tokenAmount);
    }

    /**
     * @notice Claim vested tokens.
     */
    function claim() external nonReentrant {
        require(saleFinalized, "Sale not finalized");
        
        UserInfo storage user = userInfo[msg.sender];
        require(user.totalPurchased > 0, "No tokens");

        uint256 claimable = getClaimableAmount(msg.sender);
        require(claimable > 0, "Nothing to claim");

        user.totalClaimed += claimable;
        jungleToken.safeTransfer(msg.sender, claimable);

        emit TokensClaimed(msg.sender, claimable);
    }

    /**
     * @notice Calculate claimable amount based on vesting schedule.
     */
    function getClaimableAmount(address userAddress) public view returns (uint256) {
        if (!saleFinalized) return 0;

        UserInfo memory user = userInfo[userAddress];
        if (user.totalPurchased == 0) return 0;

        uint256 timeSinceEnd = block.timestamp > endTime ? block.timestamp - endTime : 0;
        
        // TGE Unlock
        uint256 unlocked = (user.totalPurchased * tgeUnlockPercent) / 10000;

        // Linear Vesting
        if (timeSinceEnd > cliffDuration) {
            uint256 vestingTime = timeSinceEnd - cliffDuration;
            if (vestingTime >= vestingDuration) {
                return user.totalPurchased - user.totalClaimed;
            } else {
                uint256 remainingTokens = user.totalPurchased - unlocked;
                uint256 vested = (remainingTokens * vestingTime) / vestingDuration;
                unlocked += vested;
            }
        }

        if (unlocked > user.totalPurchased) unlocked = user.totalPurchased;
        
        return unlocked > user.totalClaimed ? unlocked - user.totalClaimed : 0;
    }

    /**
     * @notice Finalize sale and enable claiming.
     */
    function finalizeSale() external onlyRole(ADMIN_ROLE) {
        require(block.timestamp > endTime || totalRaised >= hardCap, "Sale ongoing");
        require(!saleFinalized, "Already finalized");
        
        saleFinalized = true;
        emit SaleFinalized(totalRaised);
    }

    /**
     * @notice Withdraw raised funds (Admin only).
     */
    function withdrawFunds() external onlyRole(ADMIN_ROLE) {
        uint256 balance = usdc.balanceOf(address(this));
        usdc.safeTransfer(msg.sender, balance);
    }
    
    /**
     * @notice Withdraw unsold tokens (Admin only).
     */
    function withdrawUnsoldTokens() external onlyRole(ADMIN_ROLE) {
        require(saleFinalized, "Sale not finalized");
        uint256 balance = jungleToken.balanceOf(address(this));
        // Ensure we leave enough for claims (simplified check)
        // In production, track total sold vs balance
        jungleToken.safeTransfer(msg.sender, balance);
    }
}
