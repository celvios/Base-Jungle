// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title MockChainlinkAggregator
 * @notice Mock implementation of Chainlink AggregatorV3Interface for testing
 */
contract MockChainlinkAggregator {
    int256 public price;
    uint8 public decimals;
    uint256 public updatedAt;
    uint80 public roundId;

    constructor(int256 _price, uint8 _decimals) {
        price = _price;
        decimals = _decimals;
        updatedAt = block.timestamp;
        roundId = 1;
    }

    function setPrice(int256 _price) external {
        price = _price;
        updatedAt = block.timestamp;
        roundId++;
    }

    function setUpdatedAt(uint256 _updatedAt) external {
        updatedAt = _updatedAt;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 _roundId,
            int256 answer,
            uint256 startedAt,
            uint256 _updatedAt,
            uint80 answeredInRound
        )
    {
        return (roundId, price, block.timestamp, updatedAt, roundId);
    }

    function getRoundData(uint80 _roundId)
        external
        view
        returns (
            uint80,
            int256 answer,
            uint256 startedAt,
            uint256 _updatedAt,
            uint80 answeredInRound
        )
    {
        return (_roundId, price, block.timestamp, updatedAt, _roundId);
    }
}
