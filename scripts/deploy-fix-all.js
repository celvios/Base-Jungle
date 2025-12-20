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

// Existing addresses
const USDC_ADDRESS = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";
const REFERRAL_MANAGER = "0xc8A84e0BF9a4C213564e858A89c8f14738aD0f15";
// Strategy controller from deployed addresses
const STRATEGY_CONTROLLER = "0xa1143ac8Af4074d348F3A776781A1924417d14E8";

// Artifacts
const loadArtifact = (path) => JSON.parse(fs.readFileSync(join(__dirname, path), 'utf8'));

const pointsArtifact = loadArtifact('../artifacts/contracts/PointsTracker.sol/PointsTracker.json');
const conservativeArtifact = loadArtifact('../artifacts/contracts/vaults/ConservativeVault.sol/ConservativeVault.json');
const aggressiveArtifact = loadArtifact('../artifacts/contracts/vaults/AggressiveVault.sol/AggressiveVault.json');

async function main() {
    console.log('🚀 Redeploying Points System & Vaults...\n');

    if (!PRIVATE_KEY) throw new Error('No private key');

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`Deployer: ${wallet.address}`);
    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);

    // 1. Deploy PointsTracker
    console.log('📦 Deploying PointsTracker...');
    const PointsFactory = new ethers.ContractFactory(pointsArtifact.abi, pointsArtifact.bytecode, wallet);

    // Using 0x0 for ActivityVerifier/PositionNFT as placeholders if they are not critical for pure points tracking
    // Or ideally, use deployed addresses if found. 
    // Since we couldn't find them, we use 0x0. Note: If constructor uses them calls, it might fail.
    // Based on code, constructor just sets variables.
    const NULL_ADDR = "0x0000000000000000000000000000000000000000";

    const pointsTracker = await PointsFactory.deploy(
        REFERRAL_MANAGER,
        NULL_ADDR, // _activityVerifier
        NULL_ADDR  // _positionNFT
    );
    await pointsTracker.waitForDeployment();
    const pointsAddress = await pointsTracker.getAddress();
    console.log(`✅ PointsTracker deployed: ${pointsAddress}\n`);

    const FEE_COLLECTOR = wallet.address;

    // 2. Deploy ConservativeVault
    console.log('📦 Deploying ConservativeVault...');
    const ConservativeFactory = new ethers.ContractFactory(conservativeArtifact.abi, conservativeArtifact.bytecode, wallet);
    const conservativeVault = await ConservativeFactory.deploy(
        USDC_ADDRESS,
        REFERRAL_MANAGER,
        pointsAddress, // NEW PointsTracker
        STRATEGY_CONTROLLER,
        FEE_COLLECTOR
    );
    await conservativeVault.waitForDeployment();
    const conservativeAddress = await conservativeVault.getAddress();
    console.log(`✅ ConservativeVault deployed: ${conservativeAddress}\n`);

    // 3. Deploy AggressiveVault
    console.log('📦 Deploying AggressiveVault...');
    const AggressiveFactory = new ethers.ContractFactory(aggressiveArtifact.abi, aggressiveArtifact.bytecode, wallet);
    const aggressiveVault = await AggressiveFactory.deploy(
        USDC_ADDRESS,
        REFERRAL_MANAGER,
        pointsAddress, // NEW PointsTracker
        STRATEGY_CONTROLLER,
        FEE_COLLECTOR
    );
    await aggressiveVault.waitForDeployment();
    const aggressiveAddress = await aggressiveVault.getAddress();
    console.log(`✅ AggressiveVault deployed: ${aggressiveAddress}\n`);

    // 4. Grant Roles
    console.log('🔐 Granting UPDATER_ROLE...');
    const UPDATER_ROLE = await pointsTracker.UPDATER_ROLE();

    await (await pointsTracker.grantRole(UPDATER_ROLE, conservativeAddress)).wait();
    console.log(`✅ Granted to ConservativeVault`);

    await (await pointsTracker.grantRole(UPDATER_ROLE, aggressiveAddress)).wait();
    console.log(`✅ Granted to AggressiveVault\n`);

    // 5. Update JSON
    console.log('📝 Updating deployed-addresses-sepolia.json...');
    const jsonPath = join(__dirname, '../deployed-addresses-sepolia.json');
    const addresses = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    addresses.contracts.pointsTracker = pointsAddress;
    addresses.contracts.conservativeVault = conservativeAddress;
    addresses.contracts.aggressiveVault = aggressiveAddress;
    addresses.deployedAt = new Date().toISOString();

    fs.writeFileSync(jsonPath, JSON.stringify(addresses, null, 2));
    console.log('✅ Updated JSON file');

    console.log('\n✅✅✅ DEPLOYMENT COMPLETE ✅✅✅');
    console.log('Update your .env.production with:');
    console.log(`VITE_POINTS_TRACKER_ADDRESS=${pointsAddress}`);
    console.log(`VITE_CONSERVATIVE_VAULT_ADDRESS=${conservativeAddress}`);
    console.log(`VITE_AGGRESSIVE_VAULT_ADDRESS=${aggressiveAddress}`);
}

main().catch(console.error);
