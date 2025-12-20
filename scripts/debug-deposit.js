import { ethers } from 'ethers';

// The error data from the failed simulation (you need to paste the full data here)
// From previous log: "Error Data: 0xe2517014887391a926c5224d959..." (truncated)
// Since I don't have the full string, I will re-run the simulation logic properly to capture it.
// BUT, I can create a script that runs the simulation AND decodes it immediately.

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.deployment') });

const RPC_URL = 'https://sepolia.base.org';
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

const CONSERVATIVE_VAULT_ADDRESS = "0xf1Dc3E955feCE6AFb82F527636da9aD235D05dd4";
const USDC_ADDRESS = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";

const vaultAbi = [
    "function deposit(uint256 assets, address receiver) returns (uint256)"
];
const erc20Abi = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)"
];
const pointsTrackerAbi = [
    "error InsufficientAmount(uint256 provided, uint256 minimum)"
];

async function main() {
    if (!PRIVATE_KEY) { console.error('No private key'); return; }
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    const vault = new ethers.Contract(CONSERVATIVE_VAULT_ADDRESS, vaultAbi, wallet);
    const usdc = new ethers.Contract(USDC_ADDRESS, erc20Abi, wallet);

    // Check PointsTracker Interface for decoding
    const iface = new ethers.Interface(pointsTrackerAbi);

    const amount = ethers.parseUnits("500", 6);

    // Approve first
    await (await usdc.approve(CONSERVATIVE_VAULT_ADDRESS, amount)).wait();

    try {
        console.log('Simulating deposit...');
        await vault.deposit.staticCall(amount, wallet.address);
        console.log('✅ Success');
    } catch (error) {
        console.log('❌ Failed');
        if (error.data) {
            console.log(`Data: ${error.data}`);
            try {
                const decoded = iface.parseError(error.data);
                if (decoded) {
                    console.log(`Error Name: ${decoded.name}`);
                    console.log(`Args: provided=${decoded.args[0]}, minimum=${decoded.args[1]}`);
                }
            } catch (e) {
                console.log('Could not decode with InsufficientAmount signature');
            }
        }
    }
}

main().catch(console.error);
