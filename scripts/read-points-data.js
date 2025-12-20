import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.deployment') });

const RPC_URL = 'https://sepolia.base.org';
const POINTS_TRACKER = "0x3dEDE79F6aD12973e723e67071F17e5C42A93173";
const DEPLOYER = "0x72377a60870E3d2493F871FA5792a1160518fcc6";

const abi = [
    "function MIN_POINTS_AMOUNT() view returns (uint256)",
    "function userPoints(address) view returns (uint256, uint256, uint256)"
];

async function main() {
    process.stdout.write("START_READ\n");
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const tracker = new ethers.Contract(POINTS_TRACKER, abi, provider);

        console.log("Reading MIN_POINTS_AMOUNT...");
        const min = await tracker.MIN_POINTS_AMOUNT();
        console.log(`MIN: ${min.toString()}`);

        console.log("Reading User Points...");
        const user = await tracker.userPoints(DEPLOYER);
        console.log(`User Points: ${user[0].toString()}`);

    } catch (e) {
        console.log("ERROR: " + e.message);
    }
    process.stdout.write("END_READ\n");
}
main();
