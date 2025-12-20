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

// ABIs
const pointsTrackerAbi = [
    "function UPDATER_ROLE() view returns (bytes32)",
    "function hasRole(bytes32 role, address account) view returns (bool)",
    "function grantRole(bytes32 role, address account) external"
];

const vaultAbi = [
    "function pointsTracker() view returns (address)",
    "function deposit(uint256 assets, address receiver) returns (uint256)"
];

const erc20Abi = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)"
];

async function main() {
    console.log('🔍 Verifying Contract Roles and State...\n');

    if (!PRIVATE_KEY) {
        console.error('❌ DEPLOYER_PRIVATE_KEY not found');
        return;
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log(`Checking with account: ${wallet.address}\n`);

    // Addresses
    const POINTS_TRACKER_ADDRESS = "0x3dEDE79F6aD12973e723e67071F17e5C42A93173";
    const CONSERVATIVE_VAULT_ADDRESS = "0xf1Dc3E955feCE6AFb82F527636da9aD235D05dd4";
    const AGGRESSIVE_VAULT_ADDRESS = "0x89Cf5223a9d50c6185cc8f721e7FFa8480362817";

    // 1. Check PointsTracker Roles
    console.log('1. Checking PointsTracker Roles...');
    const pointsTracker = new ethers.Contract(POINTS_TRACKER_ADDRESS, pointsTrackerAbi, wallet);
    const UPDATER_ROLE = await pointsTracker.UPDATER_ROLE();

    console.log(`   UPDATER_ROLE hash: ${UPDATER_ROLE}`);

    const isConservativeUpdater = await pointsTracker.hasRole(UPDATER_ROLE, CONSERVATIVE_VAULT_ADDRESS);
    console.log(`   ConservativeVault has UPDATER_ROLE: ${isConservativeUpdater ? '✅ YES' : '❌ NO'}`);

    const isAggressiveUpdater = await pointsTracker.hasRole(UPDATER_ROLE, AGGRESSIVE_VAULT_ADDRESS);
    console.log(`   AggressiveVault has UPDATER_ROLE: ${isAggressiveUpdater ? '✅ YES' : '❌ NO'}`);

    if (!isConservativeUpdater || !isAggressiveUpdater) {
        console.log('\n   ⚠️  MISSING ROLES DETECTED! Attempting to grant roles...');
        try {
            if (!isConservativeUpdater) {
                const tx = await pointsTracker.grantRole(UPDATER_ROLE, CONSERVATIVE_VAULT_ADDRESS);
                console.log(`   Tx sent: ${tx.hash}`);
                await tx.wait();
                console.log('   ✅ Granted UPDATER_ROLE to ConservativeVault');
            }
            if (!isAggressiveUpdater) {
                const tx = await pointsTracker.grantRole(UPDATER_ROLE, AGGRESSIVE_VAULT_ADDRESS);
                console.log(`   Tx sent: ${tx.hash}`);
                await tx.wait();
                console.log('   ✅ Granted UPDATER_ROLE to AggressiveVault');
            }
        } catch (error) {
            console.error('   ❌ Failed to grant roles:', error.message);
        }
    }

    // 2. Check Vault Config
    console.log('\n2. Checking Vault Configuration...');
    const vault = new ethers.Contract(CONSERVATIVE_VAULT_ADDRESS, vaultAbi, wallet);

    try {
        const linkedPointsTracker = await vault.pointsTracker();
        console.log(`   Vault -> PointsTracker: ${linkedPointsTracker}`);
        console.log(`   Matches expected: ${linkedPointsTracker === POINTS_TRACKER_ADDRESS ? '✅ YES' : '❌ NO'}`);
    } catch (e) {
        console.log('   Could not read pointsTracker from vault (might differ in ABI)');
    }

    // 3. Simulate Deposit (Call Static)
    console.log('\n3. Simulating Deposit...');
    const USDC_ADDRESS = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";
    const usdc = new ethers.Contract(USDC_ADDRESS, erc20Abi, wallet);

    const amount = ethers.parseUnits("500", 6); // $500 USDC

    // Check balance
    const balance = await usdc.balanceOf(wallet.address);
    console.log(`   Balance: ${ethers.formatUnits(balance, 6)} USDC`);

    if (balance < amount) {
        console.log('   ❌ Insufficient balance for simulation');
    } else {
        console.log(`   Approving ${ethers.formatUnits(amount, 6)} USDC...`);
        try {
            const approveTx = await usdc.approve(CONSERVATIVE_VAULT_ADDRESS, amount);
            await approveTx.wait();
            console.log('   ✅ Approved');

            console.log('   Attempting deposit (static call)...');
            // We use staticCall to simulate the transaction without mining it
            await vault.deposit.staticCall(amount, wallet.address);
            console.log('   ✅ Deposit simulation SUCCESSFUL! The transaction should work.');
        } catch (error) {
            console.error('   ❌ Deposit simulation FAILED:', error.message);
            if (error.data) console.log('   Error Data:', error.data);
            if (error.revert) console.log('   Revert reason:', error.revert);
        }
    }
}

main().catch(console.error);
