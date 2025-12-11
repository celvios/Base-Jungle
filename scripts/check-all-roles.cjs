const hre = require("hardhat");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n🔍 Checking ALL Required Roles...\n");

    const CONSERVATIVE_VAULT = "0x31Dc3a8ABC30f8CC391fB0fBFd43E6cB3edE7Df0";
    const STRATEGY_CONTROLLER = "0x8F652a77FD1D5371ab1F64aE007458F68b74d13A";
    const POINTS_TRACKER = "0x3dEDE79F6aD12973e723e67071F17e5C42A93173";

    // Check StrategyController VAULT_ROLE
    const sc = await hre.ethers.getContractAt("StrategyController", STRATEGY_CONTROLLER);
    const VAULT_ROLE = await sc.VAULT_ROLE();
    const hasVaultRole = await sc.hasRole(VAULT_ROLE, CONSERVATIVE_VAULT);
    console.log("📊 StrategyController:");
    console.log("   Vault has VAULT_ROLE?", hasVaultRole ? "✅" : "❌");

    // Check PointsTracker UPDATER_ROLE
    const pt = await hre.ethers.getContractAt("PointsTracker", POINTS_TRACKER);
    const UPDATER_ROLE = await pt.UPDATER_ROLE();
    const hasUpdaterRole = await pt.hasRole(UPDATER_ROLE, CONSERVATIVE_VAULT);
    console.log("\n📊 PointsTracker:");
    console.log("   Vault has UPDATER_ROLE?", hasUpdaterRole ? "✅" : "❌");

    // Grant UPDATER_ROLE if missing
    if (!hasUpdaterRole) {
        console.log("\n🔧 Granting UPDATER_ROLE to vault...");
        const tx = await pt.grantRole(UPDATER_ROLE, CONSERVATIVE_VAULT);
        await tx.wait();
        console.log("✅ UPDATER_ROLE granted!");
    }

    console.log("\n🎉 Done! Try depositing again.");
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

