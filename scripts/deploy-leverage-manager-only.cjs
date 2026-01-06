const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("\n🚀 Deploying LeverageManager...\n");
    console.log("═══════════════════════════════════════════════════════\n");

    // Get deployer
    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deployer Address:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer Balance:", hre.ethers.formatEther(balance), "ETH\n");

    // Load existing deployment
    const deploymentPath = "./deployed-addresses-sepolia.json";
    if (!fs.existsSync(deploymentPath)) {
        console.log("❌ ERROR: Deployment file not found!");
        process.exit(1);
    }

    const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    console.log("📄 Loaded existing deployment data\n");

    console.log("Existing contracts:");
    console.log("  • ReferralManager:", deploymentData.contracts.referralManager);
    console.log("  • StrategyController:", deploymentData.contracts.strategyController);
    console.log("  • AggressiveVault:", deploymentData.contracts.aggressiveVault);
    console.log();

    // Deploy LeverageManager
    console.log("⚡ Deploying LeverageManager...");
    const LeverageManager = await hre.ethers.getContractFactory("LeverageManager");
    const leverageManager = await LeverageManager.deploy(
        deploymentData.contracts.referralManager,
        deploymentData.contracts.strategyController,
        hre.ethers.ZeroAddress, // oracle - will set later if needed
        hre.ethers.ZeroAddress  // lendingAdapter - will set later if needed
    );
    await leverageManager.waitForDeployment();
    const leverageManagerAddress = await leverageManager.getAddress();
    console.log("   ✅", leverageManagerAddress, "\n");

    // Update deployment file
    deploymentData.contracts.leverageController = leverageManagerAddress;
    deploymentData.deployedAt = new Date().toISOString();

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
    console.log("📄 Updated deployment file\n");

    console.log("═══════════════════════════════════════════════════════");
    console.log("⚙️  Configuring Roles");
    console.log("═══════════════════════════════════════════════════════\n");

    // Grant KEEPER_ROLE to deployer (so bot can call rebalance)
    console.log("🔐 Granting KEEPER_ROLE to deployer...");
    const KEEPER_ROLE = await leverageManager.KEEPER_ROLE();
    let tx = await leverageManager.grantRole(KEEPER_ROLE, deployer.address);
    await tx.wait();
    console.log("   ✅ Done\n");

    // Grant VAULT_ROLE to AggressiveVault
    console.log("🔐 Granting VAULT_ROLE to AggressiveVault...");
    const VAULT_ROLE = await leverageManager.VAULT_ROLE();
    tx = await leverageManager.grantRole(VAULT_ROLE, deploymentData.contracts.aggressiveVault);
    await tx.wait();
    console.log("   ✅ Done\n");

    console.log("═══════════════════════════════════════════════════════");
    console.log("✅ LEVERAGE MANAGER DEPLOYMENT COMPLETE!");
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("📋 Summary:");
    console.log("  • LeverageManager:", leverageManagerAddress);
    console.log("  • KEEPER_ROLE granted to:", deployer.address);
    console.log("  • VAULT_ROLE granted to:", deploymentData.contracts.aggressiveVault);
    console.log("\n");

    console.log("🔧 Next Steps:");
    console.log("1. Run diagnostic: node scripts/diagnose-aggressive-vault.cjs");
    console.log("2. Test leverage toggle in UI");
    console.log("3. Verify leverage positions work\n");

    console.log("✅ Deployment successful! 🎉\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
