const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("\n🚀 Deploying LeverageManager Dependencies...\n");
    console.log("═══════════════════════════════════════════════════════\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deployer:", deployer.address);
    console.log("💰 Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

    // Load existing deployment
    const deploymentPath = "./deployed-addresses-sepolia.json";
    const deploymentData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

    console.log("═══════════════════════════════════════════════════════");
    console.log("📦 STEP 1: Deploy ChainlinkOracle");
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("Deploying ChainlinkOracle (no constructor params)...");
    const ChainlinkOracle = await hre.ethers.getContractFactory("ChainlinkOracle");
    const oracle = await ChainlinkOracle.deploy();
    await oracle.waitForDeployment();
    const oracleAddress = await oracle.getAddress();
    console.log("   ✅", oracleAddress, "\n");

    console.log("═══════════════════════════════════════════════════════");
    console.log("📦 STEP 2: Deploy MoonwellAdapter");
    console.log("═══════════════════════════════════════════════════════\n");

    // Base Sepolia Moonwell addresses (if available, otherwise use mock)
    // For now, we'll use placeholder addresses since we don't have real Moonwell on Sepolia
    // In production, these would be the actual Moonwell mToken and Comptroller addresses
    const MOCK_MTOKEN = "0x0000000000000000000000000000000000000001"; // Placeholder
    const MOCK_COMPTROLLER = "0x0000000000000000000000000000000000000002"; // Placeholder

    console.log("⚠️  Note: Using placeholder addresses for MoonwellAdapter");
    console.log("   (Real Moonwell deployment needed for production)\n");

    try {
        console.log("Deploying MoonwellAdapter...");
        const MoonwellAdapter = await hre.ethers.getContractFactory("MoonwellAdapter");
        const moonwellAdapter = await MoonwellAdapter.deploy(
            MOCK_MTOKEN,
            MOCK_COMPTROLLER
        );
        await moonwellAdapter.waitForDeployment();
        const adapterAddress = await moonwellAdapter.getAddress();
        console.log("   ✅", adapterAddress, "\n");
        deploymentData.contracts.moonwellAdapter = adapterAddress;
    } catch (error) {
        console.log("   ⚠️  MoonwellAdapter deployment failed (expected with mock addresses)");
        console.log("   Continuing with zero address...\n");
        deploymentData.contracts.moonwellAdapter = hre.ethers.ZeroAddress;
    }

    console.log("═══════════════════════════════════════════════════════");
    console.log("📦 STEP 3: Deploy LeverageManager");
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("Deploying LeverageManager...");
    const LeverageManager = await hre.ethers.getContractFactory("contracts/LeverageManager.sol:LeverageManager");
    const leverageManager = await LeverageManager.deploy(
        deploymentData.contracts.referralManager,
        deploymentData.usdcAddress  // USDC address
    );
    await leverageManager.waitForDeployment();
    const leverageManagerAddress = await leverageManager.getAddress();
    console.log("   ✅", leverageManagerAddress, "\n");

    // Set oracle and strategy controller via setter functions
    console.log("⚙️  Configuring LeverageManager...");

    console.log("   Setting StrategyController...");
    let configTx = await leverageManager.setStrategyController(deploymentData.contracts.strategyController);
    await configTx.wait();
    console.log("   ✅ Done");

    console.log("   Setting ChainlinkOracle...");
    configTx = await leverageManager.setOracle(oracleAddress);
    await configTx.wait();
    console.log("   ✅ Done\n");

    console.log("═══════════════════════════════════════════════════════");
    console.log("⚙️  STEP 4: Configure Roles");
    console.log("═══════════════════════════════════════════════════════\n");

    // Grant KEEPER_ROLE to deployer
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
    console.log("💾 STEP 5: Update Deployment File");
    console.log("═══════════════════════════════════════════════════════\n");

    // Update deployment data
    deploymentData.contracts.leverageController = leverageManagerAddress;
    deploymentData.contracts.chainlinkOracle = oracleAddress;
    deploymentData.deployedAt = new Date().toISOString();

    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
    console.log("📄 Updated:", deploymentPath, "\n");

    console.log("═══════════════════════════════════════════════════════");
    console.log("✅ DEPLOYMENT COMPLETE!");
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("📋 Deployed Contracts:");
    console.log("  • ChainlinkOracle:", oracleAddress);
    console.log("  • MoonwellAdapter:", deploymentData.contracts.moonwellAdapter || "N/A");
    console.log("  • LeverageManager:", leverageManagerAddress);
    console.log("\n");

    console.log("🔐 Roles Granted:");
    console.log("  • KEEPER_ROLE → Deployer");
    console.log("  • VAULT_ROLE → AggressiveVault");
    console.log("\n");

    console.log("🔧 Next Steps:");
    console.log("1. Run diagnostic: node scripts/diagnose-aggressive-vault.cjs");
    console.log("2. Update frontend .env with LeverageController address");
    console.log("3. Test leverage toggle in UI");
    console.log("4. Configure tier allocations if needed\n");

    console.log("✅ Success! 🎉\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
