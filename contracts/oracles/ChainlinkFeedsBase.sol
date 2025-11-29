// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/**
 * @title ChainlinkFeedsBase
 * @notice Chainlink price feed addresses for Base mainnet.
 * @dev Reference: https://docs.chain.link/data-feeds/price-feeds/addresses?network=base
 */
library ChainlinkFeedsBase {
    
    // ========== STABLECOINS ==========
    
    // USDC / USD - 8 decimals
    address public constant USDC_USD = 0x7e860098F58bBFC8648a4311b374B1D669a2bc6B;
    
    // DAI / USD - 8 decimals
    address public constant DAI_USD = 0x591e79239a7d679378eC8c847e5038150364C78F;
    
    // USDT / USD - 8 decimals  
    address public constant USDT_USD = 0xf19d560eB8d2ADf07BD6D13ed03e1D11215721F9;
    
    // ========== MAJOR ASSETS ==========
    
    // ETH / USD - 8 decimals
    address public constant ETH_USD = 0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70;
    
    // WETH / USD - 8 decimals (same as ETH)
    address public constant WETH_USD = 0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70;
    
    // BTC / USD - 8 decimals
    address public constant BTC_USD = 0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F;
    
    // WBTC / USD - 8 decimals (using BTC feed)
    address public constant WBTC_USD = 0x64c911996D3c6aC71f9b455B1E8E7266BcbD848F;
    
    // ========== DEFI TOKENS ==========
    
    // AERO / USD - 8 decimals (Aerodrome token)
    // Note: May need to use AERO/ETH * ETH/USD or check if direct feed exists
    // Placeholder - verify actual feed address
    address public constant AERO_USD = address(0); // TBD
    
    // cbETH / USD - 8 decimals (Coinbase Wrapped Staked ETH)
    address public constant cbETH_USD = 0xd7818272B9e248357d13057AAb0B417aF31E817d;
    
    // rETH / USD - 8 decimals (Rocket Pool ETH)
    address public constant rETH_USD = 0xf397bF97280B488cA19ee3093E81C0a77F02e9a5;
    
    // ========== HEARTBEATS (in seconds) ==========
    
    // Most feeds: 1 hour (3600s)
    uint256 public constant DEFAULT_HEARTBEAT = 3600;
    
    // Stablecoins: 24 hours (86400s) - less volatile
    uint256 public constant STABLECOIN_HEARTBEAT = 86400;
    
    // Major assets (ETH, BTC): 1 hour
    uint256 public constant MAJOR_ASSET_HEARTBEAT = 3600;
    
    /**
     * @notice Get feed address for a token.
     * @param token Token address
     * @return feedAddress Chainlink aggregator address
     * @return heartbeat Max staleness in seconds
     */
    function getFeedConfig(address token) internal pure returns (address feedAddress, uint256 heartbeat) {
        // USDC
        if (token == 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913) {
            return (USDC_USD, STABLECOIN_HEARTBEAT);
        }
        // DAI
        if (token == 0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb) {
            return (DAI_USD, STABLECOIN_HEARTBEAT);
        }
        // USDT
        if (token == 0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2) {
            return (USDT_USD, STABLECOIN_HEARTBEAT);
        }
        // WETH
        if (token == 0x4200000000000000000000000000000000000006) {
            return (WETH_USD, MAJOR_ASSET_HEARTBEAT);
        }
        // cbETH
        if (token == 0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22) {
            return (cbETH_USD, MAJOR_ASSET_HEARTBEAT);
        }
        
        // Default: return zero address (not configured)
        return (address(0), DEFAULT_HEARTBEAT);
    }
    
    /**
     * @notice Check if feed is configured for token.
     */
    function hasFeed(address token) internal pure returns (bool) {
        (address feed,) = getFeedConfig(token);
        return feed != address(0);
    }
}
