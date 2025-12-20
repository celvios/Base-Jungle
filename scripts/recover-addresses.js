import { ethers } from 'ethers';
const RPC = 'https://sepolia.base.org';
const ADDR = "0x3dEDE79F6aD12973e723e67071F17e5C42A93173";

const abi = [
    "function positionNFT() view returns (address)",
    "function activityVerifier() view returns (address)",
    "function referralManager() view returns (address)"
];

async function main() {
    process.stdout.write("--- RECOVERING ---\n");
    const provider = new ethers.JsonRpcProvider(RPC);
    const contract = new ethers.Contract(ADDR, abi, provider);

    try {
        const pnft = await contract.positionNFT();
        const verifier = await contract.activityVerifier();
        const ref = await contract.referralManager();

        console.log(`PositionNFT: ${pnft}`);
        console.log(`ActivityVerifier: ${verifier}`);
        console.log(`ReferralManager: ${ref}`);
    } catch (e) {
        console.log("ERROR: " + e.message);
    }
    process.stdout.write("--- DONE ---\n");
}
main();
