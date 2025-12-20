import { ethers } from 'ethers';
const RPC = 'https://sepolia.base.org';
const ADDR = "0x3dEDE79F6aD12973e723e67071F17e5C42A93173";

async function main() {
    console.log("Checking Code Size...");
    const provider = new ethers.JsonRpcProvider(RPC);
    const code = await provider.getCode(ADDR);
    console.log(`Code Length: ${code.length}`);
    if (code === '0x') {
        console.log("❌ NO CODE AT ADDRESS (Contract does not exist)");
    } else {
        console.log("✅ Code exists");
    }
}
main();
