const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    // 1. Setup
    const deploymentData = JSON.parse(fs.readFileSync("./deployed-addresses-sepolia.json", "utf8"));
    const VAULT_ADDRESS = "0x7aB126E4503c8574099e926DE1B1e18a9012D888"; // From User Report/Artifacts
    const DEPLOYER = "0x72377a60870E3d2493F871FA5792a1160518fcc6"; // User Address

    console.log(`🕵️ DEEP ANALYSIS for ${DEPLOYER}`);

    // 2. Check Vault's PointsTracker
    const vault = await ethers.getContractAt(["function pointsTracker() view returns (address)"], VAULT_ADDRESS);
    const vaultPtAddress = await vault.pointsTracker();
    console.log(`\n🏦 Vault points to PointsTracker: ${vaultPtAddress}`);

    // 3. Check Bytecode at that address
    const code = await ethers.provider.getCode(vaultPtAddress);
    console.log(`   Bytecode length: ${code.length}`);
    if (code === "0x") {
        console.error("   ❌ CRITICAL: No contract at Vault's PointsTracker address!");
    }

    // 4. Try to read points using RAW call (low level) to debug ABI issues
    const tracker = await ethers.getContractAt([], vaultPtAddress);

    // Function selector for userPoints(address) -> 0x2f01229a (standard mapping) or similar?
    // Let's use standard ethers interface to decode
    const abiV1 = ["function userPoints(address) view returns (uint256, uint256)"];
    const abiV2 = ["function userPoints(address) view returns (uint256, uint256, uint256)"];

    console.log("\n🧪 Testing ABIs on PointsTracker:");

    try {
        const c1 = new ethers.Contract(vaultPtAddress, abiV1, ethers.provider);
        const r1 = await c1.userPoints(DEPLOYER);
        console.log(`   ✅ V1 Call (2 args) Result: Points=${r1[0].toString()}, Last=${r1[1].toString()}`);
    } catch (e) {
        console.log(`   ❌ V1 Call Failed`);
    }

    try {
        const c2 = new ethers.Contract(vaultPtAddress, abiV2, ethers.provider);
        const r2 = await c2.userPoints(DEPLOYER);
        console.log(`   ✅ V2 Call (3 args) Result: Points=${r2[0].toString()}, Last=${r2[1].toString()}, Pending=${r2[2].toString()}`);
    } catch (e) {
        console.log(`   ❌ V2 Call Failed`);
    }

    // 5. Check if user has "Self Awarded" 5000 points in Frontend but not on chain?
    // Maybe they are seeing mock data?
}

main().catch(console.error);
