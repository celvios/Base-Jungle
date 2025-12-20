import { ethers } from 'ethers';
const RPC = 'https://sepolia.base.org';
const ADDR = "0x3dEDE79F6aD12973e723e67071F17e5C42A93173";
// ABI for min points amount
const abi = ["function MIN_POINTS_AMOUNT() view returns (uint256)"];

async function main() {
    process.stdout.write("--- READING ---\n");
    const provider = new ethers.JsonRpcProvider(RPC);
    const contract = new ethers.Contract(ADDR, abi, provider);
    try {
        const val = await contract.MIN_POINTS_AMOUNT();
        console.log("MIN_POINTS: " + val.toString());
    } catch (e) {
        console.log("ERROR: " + e.message);
    }
    process.stdout.write("--- DONE ---\n");
}
main();
