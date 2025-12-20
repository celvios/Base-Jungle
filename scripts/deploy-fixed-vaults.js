// Deploy fixed vaults using ethers.js directly
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

// Contract ABIs and bytecode
const conservativeVaultArtifact = JSON.parse(
    fs.readFileSync(join(__dirname, '../artifacts/contracts/vaults/ConservativeVault.sol/ConservativeVault.json'), 'utf8')
);

const aggressiveVaultArtifact = JSON.parse(
    fs.readFileSync(join(__dirname, '../artifacts/contracts/vaults/AggressiveVault.sol/AggressiveVault.json'), 'utf8')
);

const pointsTrackerArtifact = JSON.parse(
    fs.readFileSync(join(__dirname, '../artifacts/contracts/PointsTracker.sol/PointsTracker.json'), 'utf8')
);

async function main() {
    console.log('🚀 Deploying Fixed Vaults with Corrected Points Tracking...\n');

    if (!PRIVATE_KEY) {
        console.error('❌ DEPLOYER_PRIVATE_KEY not found in .env.deployment');
        return;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`Deployer: ${wallet.address}`);
    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);

    if (balance === 0n) {
        console.error('❌ No ETH for deployment!');
        console.log('Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet');
        return;
    }

    // Existing deployment addresses
    const USDC_ADDRESS = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";
    const REFERRAL_MANAGER = "0xc8A84e0BF9a4C213564e858A89c8f14738aD0f15";
    const POINTS_TRACKER = "0x3dEDE79F6aD12973e723e67071F17e5C42A93173";
    const STRATEGY_CONTROLLER = "0xa1143ac8Af4074d348F3A776781A1924417d14E8";
    const FEE_COLLECTOR = wallet.address;

    console.log('📋 Deployment Parameters:');
    console.log(`  USDC: ${USDC_ADDRESS}`);
    console.log(`  ReferralManager: ${REFERRAL_MANAGER}`);
    console.log(`  PointsTracker: ${POINTS_TRACKER}`);
    console.log(`  StrategyController: ${STRATEGY_CONTROLLER}`);
    console.log(`  FeeCollector: ${FEE_COLLECTOR}\n`);

    // Deploy ConservativeVault
    console.log('📦 Deploying ConservativeVault...');
    const ConservativeVaultFactory = new ethers.ContractFactory(
        conservativeVaultArtifact.abi,
        conservativeVaultArtifact.bytecode,
        wallet
    );

    const conservativeVault = await ConservativeVaultFactory.deploy(
        USDC_ADDRESS,
        REFERRAL_MANAGER,
        POINTS_TRACKER,
        STRATEGY_CONTROLLER,
        FEE_COLLECTOR
    );
    await conservativeVault.waitForDeployment();
    const conservativeAddress = await conservativeVault.getAddress();
    console.log(`✅ ConservativeVault deployed: ${conservativeAddress}\n`);

    // Deploy AggressiveVault
    console.log('📦 Deploying AggressiveVault...');
    const AggressiveVaultFactory = new ethers.ContractFactory(
        aggressiveVaultArtifact.abi,
        aggressiveVaultArtifact.bytecode,
        wallet
    );

    const aggressiveVault = await AggressiveVaultFactory.deploy(
        USDC_ADDRESS,
        REFERRAL_MANAGER,
        POINTS_TRACKER,
        STRATEGY_CONTROLLER,
        FEE_COLLECTOR
    );
    await aggressiveVault.waitForDeployment();
    const aggressiveAddress = await aggressiveVault.getAddress();
    console.log(`✅ AggressiveVault deployed: ${aggressiveAddress}\n`);

    // Grant UPDATER_ROLE to vaults on PointsTracker
    console.log('🔐 Granting UPDATER_ROLE to vaults...');
    const pointsTracker = new ethers.Contract(
        POINTS_TRACKER,
        pointsTrackerArtifact.abi,
        wallet
    );

    const UPDATER_ROLE = await pointsTracker.UPDATER_ROLE();

    const tx1 = await pointsTracker.grantRole(UPDATER_ROLE, conservativeAddress);
    await tx1.wait();
    console.log(`✅ Granted UPDATER_ROLE to ConservativeVault`);

    const tx2 = await pointsTracker.grantRole(UPDATER_ROLE, aggressiveAddress);
    await tx2.wait();
    console.log(`✅ Granted UPDATER_ROLE to AggressiveVault\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ DEPLOYMENT COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📝 NEW ADDRESSES:');
    console.log(`ConservativeVault: ${conservativeAddress}`);
    console.log(`AggressiveVault: ${aggressiveAddress}\n`);

    console.log('📋 NEXT STEPS:\n');
    console.log('1. Update deployed-addresses-sepolia.json:');
    console.log(`   "conservativeVault": "${conservativeAddress}",`);
    console.log(`   "aggressiveVault": "${aggressiveAddress}",\n`);

    console.log('2. Update Vercel environment variables:');
    console.log(`   VITE_CONSERVATIVE_VAULT_ADDRESS=${conservativeAddress}`);
    console.log(`   VITE_AGGRESSIVE_VAULT_ADDRESS=${aggressiveAddress}\n`);

    console.log('3. Update frontend .env file with same addresses\n');

    console.log('4. Redeploy frontend to Vercel\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔧 FIX APPLIED:');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('✅ Points calculation fixed: assetsAfterFee * 1e12');
    console.log('✅ Properly converts USDC (6 decimals) to points (18 decimals)');
    console.log('✅ Users will now receive correct points for deposits!\n');

    // Update deployed-addresses-sepolia.json
    const deployedAddresses = JSON.parse(
        fs.readFileSync(join(__dirname, '../deployed-addresses-sepolia.json'), 'utf8')
    );

    deployedAddresses.contracts.conservativeVault = conservativeAddress;
    deployedAddresses.contracts.aggressiveVault = aggressiveAddress;
    deployedAddresses.deployedAt = new Date().toISOString();

    fs.writeFileSync(
        join(__dirname, '../deployed-addresses-sepolia.json'),
        JSON.stringify(deployedAddresses, null, 2)
    );

    console.log('✅ Updated deployed-addresses-sepolia.json\n');
}

main().catch(console.error);
