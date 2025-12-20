import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.deployment') });

const RPC_URL = 'https://sepolia.base.org';
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

// Contract Constants (from deployment)
const POINTS_TRACKER = "0x32053C6f3861ac21ecd283bef904065Fa3E68263";
const CONSERVATIVE_VAULT = "0x0300e13848D119cE09F5AB027e257DB938b1F280";

const vaultAbi = ["function pointsTracker() view returns (address)"];
const pointsAbi = [
    "function UPDATER_ROLE() view returns (bytes32)",
    "function hasRole(bytes32 role, address account) view returns (bool)"
];

async function main() {
    console.log('--- SYSTEM STATUS CHECK ---');

    if (!PRIVATE_KEY) { console.error('No private key'); return; }
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const vault = new ethers.Contract(CONSERVATIVE_VAULT, vaultAbi, wallet);
    const tracker = new ethers.Contract(POINTS_TRACKER, pointsAbi, wallet);

    console.log(`Vault Address: ${CONSERVATIVE_VAULT}`);
    console.log(`Tracker Address: ${POINTS_TRACKER}`);

    try {
        const storedTracker = await vault.pointsTracker();
        console.log(`\n1. Vault.pointsTracker(): ${storedTracker}`);
        console.log(`   Matches? ${storedTracker === POINTS_TRACKER ? '✅ YES' : '❌ NO'}`);
    } catch (e) { console.error('Failed to read vault config', e); }

    try {
        const role = await tracker.UPDATER_ROLE();
        console.log(`\n2. UPDATER_ROLE Hash: ${role}`);

        const hasRole = await tracker.hasRole(role, CONSERVATIVE_VAULT);
        console.log(`   Vault has role? ${hasRole ? '✅ YES' : '❌ NO'}`);
    } catch (e) { console.error('Failed to check roles', e); }
}

main().catch(console.error);
