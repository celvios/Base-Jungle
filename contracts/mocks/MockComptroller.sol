// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title MockComptroller
 * @notice Mock implementation of Moonwell Comptroller for testing
 */
contract MockComptroller {
    mapping(address => uint256) public liquidity;
    mapping(address => uint256) public shortfall;

    function setAccountLiquidity(address account, uint256 _liquidity, uint256 _shortfall) external {
        liquidity[account] = _liquidity;
        shortfall[account] = _shortfall;
    }

    function getAccountLiquidity(address account)
        external
        view
        returns (
            uint256 error,
            uint256 _liquidity,
            uint256 _shortfall
        )
    {
        return (0, liquidity[account], shortfall[account]);
    }

    function enterMarkets(address[] calldata mTokens) external returns (uint256[] memory) {
        uint256[] memory errors = new uint256[](mTokens.length);
        return errors;
    }

    function exitMarket(address mToken) external returns (uint256) {
        return 0;
    }
}
