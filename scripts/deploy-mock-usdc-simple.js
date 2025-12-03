// Deploy MockERC20 USDC for testing
// Run: node scripts/deploy-mock-usdc.js

import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.deployment') });

const RPC_URL = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error('❌ DEPLOYER_PRIVATE_KEY not found in .env.deployment');
    process.exit(1);
}

// MockERC20 bytecode and ABI
const MOCK_ERC20_ABI = [
    "constructor(string memory name, string memory symbol)",
    "function mint(address to, uint256 amount) external",
    "function decimals() view returns (uint8)"
];

// Compile contract inline (simplified bytecode - you'd normally use hardhat compile)
const MOCK_ERC20_BYTECODE = ""; // Would need actual compiled bytecode

async function main() {
    console.log('🚀 Deploying MockERC20 USDC...\n');

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`Deployer: ${wallet.address}`);

    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);

    if (balance === 0n) {
        console.error('❌ No ETH for deployment!');
        process.exit(1);
    }

    console.log('⚠️  This script needs the compiled MockERC20 bytecode.');
    console.log('Please use Hardhat to deploy instead:\n');
    console.log('cd contracts');
    console.log('npx hardhat run --network baseSepolia scripts/deploy-mock-usdc.js\n');
}

main().catch(console.error);
