// Deploy updated ConservativeVault with performance fee
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.deployment') });

const RPC_URL = 'https://sepolia.base.org';
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

// Load existing deployment addresses
const deployedAddresses = JSON.parse(
    fs.readFileSync(join(__dirname, '../deployed-addresses-sepolia.json'), 'utf8')
);

async function main() {
    console.log('🚀 Deploying Updated ConservativeVault with Performance Fee...\\n');

    if (!PRIVATE_KEY) {
        console.error('❌ DEPLOYER_PRIVATE_KEY not found in .env.deployment');
        return;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`Deployer: ${wallet.address}`);
    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH\\n`);

    if (balance === 0n) {
        console.error('❌ No ETH for deployment!');
        console.log('Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet');
        return;
    }

    // Deployment parameters from existing deployment
    const USDC_ADDRESS = deployedAddresses.usdcAddress;
    const REFERRAL_MANAGER = deployedAddresses.contracts.referralManager;
    const POINTS_TRACKER = deployedAddresses.contracts.pointsTracker;
    const STRATEGY_CONTROLLER = deployedAddresses.contracts.strategyController;
    const FEE_COLLECTOR = wallet.address; // Deployer wallet receives fees

    console.log('📋 Deployment Parameters:');
    console.log(`  USDC: ${USDC_ADDRESS}`);
    console.log(`  ReferralManager: ${REFERRAL_MANAGER}`);
    console.log(`  PointsTracker: ${POINTS_TRACKER}`);
    console.log(`  StrategyController: ${STRATEGY_CONTROLLER}`);
    console.log(`  FeeCollector: ${FEE_COLLECTOR}\\n`);

    console.log('⚠️  DEPLOYMENT INSTRUCTIONS:\\n');
    console.log('Since the contracts need to be compiled, here are your options:\\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('OPTION 1: Deploy via Remix IDE (RECOMMENDED)');
    console.log('═══════════════════════════════════════════════════════════\\n');
    console.log('1. Go to https://remix.ethereum.org');
    console.log('2. Create a new workspace');
    console.log('3. Upload these files:');
    console.log('   - contracts/vaults/BaseVault.sol');
    console.log('   - contracts/vaults/ConservativeVault.sol');
    console.log('   - All dependencies from contracts/ folder\\n');
    console.log('4. Compile ConservativeVault.sol (Solidity 0.8.20)\\n');
    console.log('5. Deploy with these constructor parameters:');
    console.log(`   - _asset: ${USDC_ADDRESS}`);
    console.log(`   - _referralManager: ${REFERRAL_MANAGER}`);
    console.log(`   - _pointsTracker: ${POINTS_TRACKER}`);
    console.log(`   - _strategyController: ${STRATEGY_CONTROLLER}`);
    console.log(`   - _feeCollector: ${FEE_COLLECTOR}\\n`);
    console.log('6. Copy the deployed contract address\\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('OPTION 2: Use Hardhat (if configured)');
    console.log('═══════════════════════════════════════════════════════════\\n');
    console.log('Run: npx hardhat run scripts/deploy-vault.js --network baseSepolia\\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('AFTER DEPLOYMENT:');
    console.log('═══════════════════════════════════════════════════════════\\n');
    console.log('1. Update deployed-addresses-sepolia.json with new vault address');
    console.log('2. Update Vercel environment variable:');
    console.log('   VITE_CONSERVATIVE_VAULT_ADDRESS=<new_address>\\n');
    console.log('3. Grant KEEPER_ROLE to keeper address:');
    console.log('   vault.grantRole(KEEPER_ROLE, <keeper_address>)\\n');
    console.log('4. Verify contract on BaseScan (optional)\\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('NEW FEATURES IN THIS DEPLOYMENT:');
    console.log('═══════════════════════════════════════════════════════════\\n');
    console.log('✅ performanceFee = 2000 (20% on harvests)');
    console.log('✅ harvestAndCompound() function');
    console.log('✅ PerformanceFeeCollected event');
    console.log('✅ Early withdrawal penalty (10% if < 60 days)\\n');
}

main().catch(console.error);
