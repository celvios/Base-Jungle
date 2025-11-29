// Real Base Mainnet Contract Addresses
// Updated: November 2024

module.exports = {
    // Native Tokens
    USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Native USDC (Circle)
    WETH: "0x4200000000000000000000000000000000000006", // Wrapped ETH

    // Aerodrome Finance  
    AERODROME_ROUTER: "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43",
    AERODROME_USDC_WETH_PAIR: "0xb2cc224c1c9feE385f8ad6a55b4d94E92359DC59", // WETH/USDC SlipStream pool

    // Moonwell Finance
    MOONWELL_MUSDC: "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22", // mUSDC token
    // Comptroller address will be queried from mToken

    // Chainlink Oracles
    CHAINLINK_USDC_USD: "0x7e8609000D01138865Af94B73B4D316279f0bc6B",
    CHAINLINK_ETH_USD: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70", // ETH/USD on Base

    // Known Whale Addresses (for impersonation/funding)
    USDC_WHALE: "0x20FE51A9229EEf2cF8Ad9E89d91CAb9312cF3b7A", // Large USDC holder on Base
    WETH_WHALE: "0x4200000000000000000000000000000000000006", // WETH contract itself
};
