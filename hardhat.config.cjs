require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: ".env.deployment" });

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      {
        version: "0.8.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    ],
  },
  networks: {
    // Base Sepolia Testnet
    baseSepolia: {
      url: "https://sepolia.base.org", // Public RPC
      chainId: 84532,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
      gas: 'auto',
      gasPrice: 'auto',
    },
    // Base Mainnet (for future)
    base: {
      url: "https://mainnet.base.org",
      chainId: 8453,
      accounts: process.env.DEPLOYER_PRIVATE_KEY
        ? [process.env.DEPLOYER_PRIVATE_KEY]
        : [],
    },
    // Base Mainnet Fork (for testing with real data)
    baseFork: {
      url: process.env.BASE_FORK_URL || "http://127.0.0.1:8545",
      chainId: 31337, // Hardhat's default chain ID for forks
      forking: {
        url: "https://mainnet.base.org", // Public Base RPC
        enabled: true,
      },
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
      },
    },
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY || "PLACEHOLDER",
      base: process.env.BASESCAN_API_KEY || "PLACEHOLDER",
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
