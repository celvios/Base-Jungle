import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.deployment') });

const RPC_URL = 'https://sepolia.base.org';
const WAULT_ADDR = "0xf1Dc3E955feCE6AFb82F527636da9aD235D05dd4";

const abi = [
    "function depositFee() view returns (uint256)",
    "function MAX_DEPOSIT_FEE() view returns (uint256)",
    "function referralManager() view returns (address)"
];

async function main() {
    console.log("Reading Vault Config...");
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const vault = new ethers.Contract(WAULT_ADDR, abi, provider);

    try {
        const fee = await vault.depositFee();
        const maxFee = await vault.MAX_DEPOSIT_FEE();
        const ref = await vault.referralManager();

        console.log(`Deposit Fee: ${fee.toString()} (Basis Points)`);
        console.log(`Max Fee: ${maxFee.toString()}`);
        console.log(`Referral Manager: ${ref}`);
    } catch (e) {
        console.log("Error", e.message);
    }
}
main();
