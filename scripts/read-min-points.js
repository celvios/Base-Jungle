import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.deployment') });

const RPC_URL = 'https://sepolia.base.org';
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const POINTS_TRACKER = "0x3dEDE79F6aD12973e723e67071F17e5C42A93173";

const pointsAbi = [
    "function MIN_POINTS_AMOUNT() view returns (uint256)"
];

async function main() {
    process.stdout.write("START_READ\n");
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
        const tracker = new ethers.Contract(POINTS_TRACKER, pointsAbi, wallet);

        const minPoints = await tracker.MIN_POINTS_AMOUNT();
        console.log(`MIN_POINTS_AMOUNT: ${minPoints.toString()}`);
    } catch (e) {
        console.log("ERROR: " + e.message);
    }
    process.stdout.write("END_READ\n");
}
main();
