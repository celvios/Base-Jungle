const hre = require("hardhat");
const fs = require("fs");

/**
 * Redeploy only the vaults with the correct Mock USDC address
 * Keeps all other contracts the same
 */
async function main() {
    console.log("\n🔄 Redeploying Vaults with Mock USDC...\n");
    console.log("═══════════════════════════════════════════════════════\n");

    // Get deployer
    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deployer Address:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer Balance:", hre.ethers.formatEther(balance), "ETH\n");

    // CORRECT Mock USDC address
    const MOCK_USDC = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";
    console.log("💰 Using Mock USDC:", MOCK_USDC);

    // Load existing deployment addresses
    const existingDeployment = JSON.parse(fs.readFileSync("./deployed-addresses-sepolia.json", "utf8"));
    console.log("\n📄 Loading existing deployment...");
    console.log("   ReferralManager:", existingDeployment.contracts.referralManager);
    console.log("   PointsTracker:", existingDeployment.contracts.pointsTracker);
    console.log("   StrategyController:", existingDeployment.contracts.strategyController);
    console.log("   TreasuryManager:", existingDeployment.contracts.treasuryManager);

    const addresses = { ...existingDeployment.contracts };

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("📦 Redeploying Vaults");
    console.log("═══════════════════════════════════════════════════════\n");

    // Deploy Conservative Vault with Mock USDC
    console.log("Deploying ConservativeVault with Mock USDC...");
    const ConservativeVault = await hre.ethers.getContractFactory("ConservativeVault");
    const conservativeVault = await ConservativeVault.deploy(
        MOCK_USDC,                                    // ✅ Using Mock USDC
        addresses.referralManager,
        addresses.pointsTracker,
        addresses.strategyController,
        addresses.treasuryManager
    );
    await conservativeVault.waitForDeployment();
    addresses.conservativeVault = await conservativeVault.getAddress();
    console.log("✅ ConservativeVault:", addresses.conservativeVault);

    // Verify the asset is correct
    const conservativeAsset = await conservativeVault.asset();
    console.log("   Asset:", conservativeAsset);
    if (conservativeAsset.toLowerCase() !== MOCK_USDC.toLowerCase()) {
        console.log("❌ ERROR: Asset mismatch!");
        process.exit(1);
    }
    console.log("   ✅ Asset matches Mock USDC!\n");

    // Deploy Aggressive Vault with Mock USDC
    console.log("Deploying AggressiveVault with Mock USDC...");
    const AggressiveVault = await hre.ethers.getContractFactory("AggressiveVault");
    const aggressiveVault = await AggressiveVault.deploy(
        MOCK_USDC,                                    // ✅ Using Mock USDC
        addresses.referralManager,
        addresses.pointsTracker,
        addresses.strategyController,
        addresses.treasuryManager
    );
    await aggressiveVault.waitForDeployment();
    addresses.aggressiveVault = await aggressiveVault.getAddress();
    console.log("✅ AggressiveVault:", addresses.aggressiveVault);

    // Verify the asset is correct
    const aggressiveAsset = await aggressiveVault.asset();
    console.log("   Asset:", aggressiveAsset);
    if (aggressiveAsset.toLowerCase() !== MOCK_USDC.toLowerCase()) {
        console.log("❌ ERROR: Asset mismatch!");
        process.exit(1);
    }
    console.log("   ✅ Asset matches Mock USDC!\n");

    // Update master vault
    addresses.masterVault = addresses.aggressiveVault;

    // Save updated addresses
    const deploymentData = {
        network: "baseSepolia",
        chainId: 84532,
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        usdcAddress: MOCK_USDC,
        contracts: addresses,
    };

    const outputPath = "./deployed-addresses-sepolia.json";
    fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
    console.log("📄 Deployment data saved to:", outputPath);

    console.log("\n═══════════════════════════════════════════════════════");
    console.log("✅ VAULT REDEPLOYMENT COMPLETE!");
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("📝 UPDATE YOUR FRONTEND .env FILE:\n");
    console.log(`VITE_CONSERVATIVE_VAULT_ADDRESS=${addresses.conservativeVault}`);
    console.log(`VITE_AGGRESSIVE_VAULT_ADDRESS=${addresses.aggressiveVault}`);
    console.log(`VITE_BASE_VAULT_ADDRESS=${addresses.masterVault}`);
    console.log(`VITE_USDC_ADDRESS=${MOCK_USDC}`);
    
    console.log("\n📝 UPDATE VERCEL ENVIRONMENT VARIABLES TOO!");
    console.log("\n✅ Done! 🎉\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });

