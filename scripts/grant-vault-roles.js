import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.deployment') });

const RPC_URL = 'https://sepolia.base.org';
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

// Addresses from deployment
const STRATEGY_CONTROLLER = "0xa1143ac8Af4074d348F3A776781A1924417d14E8";
const CONSERVATIVE_VAULT = "0x0300e13848D119cE09F5AB027e257DB938b1F280";
const AGGRESSIVE_VAULT = "0x2a504A88A4B4010000D10b96c1C0E999C7A5f345";

const scAbi = [
    "function VAULT_ROLE() view returns (bytes32)",
    "function grantRole(bytes32 role, address account) external"
];

async function main() {
    console.log('🔐 Granting VAULT_ROLE to new Vaults on StrategyController...\n');

    if (!PRIVATE_KEY) throw new Error("No Private Key");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const controller = new ethers.Contract(STRATEGY_CONTROLLER, scAbi, wallet);

    const vaultRole = await controller.VAULT_ROLE();
    console.log(`VAULT_ROLE Hash: ${vaultRole}`);

    console.log(`Granting to ConservativeVault: ${CONSERVATIVE_VAULT}`);
    try {
        const tx1 = await controller.grantRole(vaultRole, CONSERVATIVE_VAULT);
        console.log(`  Tx sent: ${tx1.hash}`);
        await tx1.wait();
        console.log('  ✅ SUCCESS');
    } catch (e) {
        console.log('  ❌ FAILED: ' + e.message);
    }

    console.log(`Granting to AggressiveVault: ${AGGRESSIVE_VAULT}`);
    try {
        const tx2 = await controller.grantRole(vaultRole, AGGRESSIVE_VAULT);
        console.log(`  Tx sent: ${tx2.hash}`);
        await tx2.wait();
        console.log('  ✅ SUCCESS');
    } catch (e) {
        console.log('  ❌ FAILED: ' + e.message);
    }
}

main().catch(console.error);
