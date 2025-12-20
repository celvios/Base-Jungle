import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.deployment') });

const RPC_URL = 'https://sepolia.base.org';
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const CONSERVATIVE_VAULT = "0xf1Dc3E955feCE6AFb82F527636da9aD235D05dd4";
const USDC = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";

const vaultAbi = [{
    "inputs": [
        { "name": "assets", "type": "uint256" },
        { "name": "receiver", "type": "address" }
    ],
    "name": "deposit",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
}];
const erc20Abi = [
    "function approve(address, uint256)",
    "function allowance(address, address) view returns (uint256)"
];

async function main() {
    process.stdout.write("START_DEBUG\n");
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const vault = new ethers.Contract(CONSERVATIVE_VAULT, vaultAbi, wallet);
    const usdc = new ethers.Contract(USDC, erc20Abi, wallet);

    const amount = 500000000n; // 500 USDC
    console.log("Approving...");
    await (await usdc.approve(CONSERVATIVE_VAULT, amount)).wait();

    console.log("Simulating deposit...");
    try {
        await vault.deposit.staticCall(amount, wallet.address);
        console.log("SUCCESS");
    } catch (e) {
        console.log("FAILURE");
        if (e.data) console.log("DATA:" + e.data);
        if (e.revert) console.log("REVERT:" + e.revert.name);
    }
    process.stdout.write("END_DEBUG\n");
}
main();
