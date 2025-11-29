// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

// Chainlink Aggregator Interface (minimal)
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

/**
 * @title ChainlinkOracle
 * @notice Chainlink price feed oracle for Base blockchain assets.
 * @dev Provides USD-normalized pricing with staleness checks and fallback logic.
 */
contract ChainlinkOracle is AccessControl {
    
    bytes32 public constant ORACLE_ADMIN_ROLE = keccak256("ORACLE_ADMIN_ROLE");

    struct PriceFeed {
        address feedAddress;      // Chainlink aggregator address
        uint256 heartbeat;        // Max time between updates (staleness threshold)
        bool isActive;            // Is this feed active?
        uint8 decimals;           // Feed decimals
    }

    // Token address => PriceFeed
    mapping(address => PriceFeed) public priceFeeds;

    // Staleness threshold (default: 1 hour)
    uint256 public constant DEFAULT_HEARTBEAT = 3600;

    // Maximum price deviation allowed (10% = 1000 basis points)
    uint256 public constant MAX_PRICE_DEVIATION = 1000;

    event PriceFeedUpdated(
        address indexed token,
        address indexed feedAddress,
        uint256 heartbeat
    );

    event PriceRetrieved(
        address indexed token,
        uint256 price,
        uint256 timestamp
    );

    event StalePriceDetected(
        address indexed token,
        uint256 lastUpdate,
        uint256 currentTime
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ORACLE_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Add or update a price feed for a token.
     * @param token Token address
     * @param feedAddress Chainlink aggregator address
     * @param heartbeat Max seconds between updates
     */
    function setPriceFeed(
        address token,
        address feedAddress,
        uint256 heartbeat
    ) external onlyRole(ORACLE_ADMIN_ROLE) {
        require(token != address(0), "Invalid token");
        require(feedAddress != address(0), "Invalid feed");
        require(heartbeat > 0, "Invalid heartbeat");

        // Get decimals from feed
        uint8 decimals = AggregatorV3Interface(feedAddress).decimals();

        priceFeeds[token] = PriceFeed({
            feedAddress: feedAddress,
            heartbeat: heartbeat,
            isActive: true,
            decimals: decimals
        });

        emit PriceFeedUpdated(token, feedAddress, heartbeat);
    }

    /**
     * @notice Disable a price feed.
     */
    function disablePriceFeed(address token) external onlyRole(ORACLE_ADMIN_ROLE) {
        priceFeeds[token].isActive = false;
    }

    /**
     * @notice Get USD price for a token (normalized to 18 decimals).
     * @param token Token address
     * @return price Price in USD with 18 decimals
     */
    function getPrice(address token) public view returns (uint256 price) {
        PriceFeed memory feed = priceFeeds[token];
        require(feed.isActive, "Feed not active");
        require(feed.feedAddress != address(0), "Feed not set");

        AggregatorV3Interface priceFeed = AggregatorV3Interface(feed.feedAddress);

        (
            uint80 roundId,
            int256 answer,
            ,
            uint256 updatedAt,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();

        // Validation checks
        require(answer > 0, "Invalid price");
        require(answeredInRound >= roundId, "Stale price");
        require(updatedAt > 0, "Invalid timestamp");

        // Check staleness
        require(block.timestamp <= updatedAt + feed.heartbeat, "Price feed stale");

        // Normalize to 18 decimals
        uint256 rawPrice = uint256(answer);
        
        if (feed.decimals < 18) {
            price = rawPrice * (10 ** (18 - feed.decimals));
        } else if (feed.decimals > 18) {
            price = rawPrice / (10 ** (feed.decimals - 18));
        } else {
            price = rawPrice;
        }
    }

    /**
     * @notice Get USD value of a token amount.
     * @param token Token address
     * @param amount Token amount (in token's native decimals)
     * @param tokenDecimals Token decimals
     * @return usdValue USD value with 18 decimals
     */
    function getUSDValue(
        address token,
        uint256 amount,
        uint8 tokenDecimals
    ) external view returns (uint256 usdValue) {
        uint256 price = getPrice(token);
        
        // Normalize amount to 18 decimals
        uint256 normalizedAmount;
        if (tokenDecimals < 18) {
            normalizedAmount = amount * (10 ** (18 - tokenDecimals));
        } else if (tokenDecimals > 18) {
            normalizedAmount = amount / (10 ** (tokenDecimals - 18));
        } else {
            normalizedAmount = amount;
        }

        // Calculate USD value: (amount * price) / 1e18
        usdValue = (normalizedAmount * price) / 1e18;
    }

    /**
     * @notice Convert USD value to token amount.
     * @param token Token address
     * @param usdValue USD value with 18 decimals
     * @param tokenDecimals Token decimals
     * @return amount Token amount (in token's native decimals)
     */
    function getTokenAmount(
        address token,
        uint256 usdValue,
        uint8 tokenDecimals
    ) external view returns (uint256 amount) {
        uint256 price = getPrice(token);
        require(price > 0, "Invalid price");

        // Calculate token amount: (usdValue * 1e18) / price
        uint256 normalizedAmount = (usdValue * 1e18) / price;

        // Convert to token decimals
        if (tokenDecimals < 18) {
            amount = normalizedAmount / (10 ** (18 - tokenDecimals));
        } else if (tokenDecimals > 18) {
            amount = normalizedAmount * (10 ** (tokenDecimals - 18));
        } else {
            amount = normalizedAmount;
        }
    }

    /**
     * @notice Check if a price feed is healthy (not stale).
     */
    function isPriceFeedHealthy(address token) external view returns (bool) {
        PriceFeed memory feed = priceFeeds[token];
        if (!feed.isActive || feed.feedAddress == address(0)) {
            return false;
        }

        try AggregatorV3Interface(feed.feedAddress).latestRoundData() returns (
            uint80 roundId,
            int256 answer,
            uint256,
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
            if (answer <= 0) return false;
            if (answeredInRound < roundId) return false;
            if (block.timestamp > updatedAt + feed.heartbeat) return false;
            return true;
        } catch {
            return false;
        }
    }

    /**
     * @notice Get price feed info.
     */
    function getPriceFeedInfo(address token)
        external
        view
        returns (
            address feedAddress,
            uint256 heartbeat,
            bool isActive,
            uint8 decimals,
            uint256 lastPrice,
            uint256 lastUpdate
        )
    {
        PriceFeed memory feed = priceFeeds[token];
        feedAddress = feed.feedAddress;
        heartbeat = feed.heartbeat;
        isActive = feed.isActive;
        decimals = feed.decimals;

        if (feed.feedAddress != address(0)) {
            try AggregatorV3Interface(feed.feedAddress).latestRoundData() returns (
                uint80,
                int256 answer,
                uint256,
                uint256 updatedAt,
                uint80
            ) {
                lastPrice = uint256(answer);
                lastUpdate = updatedAt;
            } catch {
                lastPrice = 0;
                lastUpdate = 0;
            }
        }
    }
}
