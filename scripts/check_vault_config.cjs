const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("🔍 INSPECTING VAULT CONFIGURATION");

    const deploymentData = JSON.parse(fs.readFileSync("./deployed-addresses-sepolia.json", "utf8"));
    const vaultAddress = deploymentData.contracts.conservativeVault;
    const pointsTrackerAddress = deploymentData.contracts.pointsTracker;

    console.log(`Vault: ${vaultAddress}`);
    console.log(`Expected PointsTracker: ${pointsTrackerAddress}`);

    const vault = await ethers.getContractAt([
        "function pointsTracker() view returns (address)",
        "function referralManager() view returns (address)"
    ], vaultAddress);

    const actualPointsTracker = await vault.pointsTracker();
    const actualReferralManager = await vault.referralManager();

    console.log(`\nActual on-chain config:`);
    console.log(`   pointsTracker: ${actualPointsTracker}`);
    console.log(`   referralManager: ${actualReferralManager}`);

    if (actualPointsTracker.toLowerCase() === pointsTrackerAddress.toLowerCase()) {
        console.log("\n✅ Configuration MATCHES.");

        // Check UPDATER_ROLE
        const tracker = await ethers.getContractAt(["function hasRole(bytes32, address) view returns (bool)"], pointsTrackerAddress);
        const UPDATER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("UPDATER_ROLE"));
        const hasRole = await tracker.hasRole(UPDATER_ROLE, vaultAddress);
        console.log(`   Vault has UPDATER_ROLE: ${hasRole}`);
    } else {
        console.log("\n❌ Configuration MISMATCH!");
        if (actualPointsTracker === ethers.ZeroAddress) {
            console.log("⚠️  PointsTracker is NOT SET (0x0). Points are being skipped.");
        }
    }
}

main().catch(console.error);
