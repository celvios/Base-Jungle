const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n🔄 FULL SYSTEM REDEPLOY\n");
    console.log("═══════════════════════════════════════════════════════\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deployer:", deployer.address);
    console.log("💰 Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

    const MOCK_USDC = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";
    console.log("💰 Mock USDC:", MOCK_USDC);

    // Load existing core contracts (keep these)
    const deploymentData = JSON.parse(fs.readFileSync("./deployed-addresses-sepolia.json", "utf8"));
    const REFERRAL_MANAGER = deploymentData.contracts.referralManager;
    const POINTS_TRACKER = deploymentData.contracts.pointsTracker;
    const TREASURY_MANAGER = deploymentData.contracts.treasuryManager;

    console.log("\n📄 Keeping existing core contracts:");
    console.log("   ReferralManager:", REFERRAL_MANAGER);
    console.log("   PointsTracker:", POINTS_TRACKER);
    console.log("   TreasuryManager:", TREASURY_MANAGER);

    // 1. Deploy StrategyController
    console.log("\n📦 1/5: Deploying StrategyController...");
    const StrategyController = await hre.ethers.getContractFactory("StrategyController");
    const strategyController = await StrategyController.deploy(REFERRAL_MANAGER);
    await strategyController.waitForDeployment();
    const strategyControllerAddress = await strategyController.getAddress();
    console.log("✅ StrategyController:", strategyControllerAddress);
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 2. Deploy Conservative Vault
    console.log("\n📦 2/5: Deploying ConservativeVault...");
    const ConservativeVault = await hre.ethers.getContractFactory("ConservativeVault");
    const conservativeVault = await ConservativeVault.deploy(
        MOCK_USDC,
        REFERRAL_MANAGER,
        POINTS_TRACKER,
        strategyControllerAddress,
        TREASURY_MANAGER
    );
    await conservativeVault.waitForDeployment();
    const conservativeVaultAddress = await conservativeVault.getAddress();
    console.log("✅ ConservativeVault:", conservativeVaultAddress);
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 3. Deploy Aggressive Vault
    console.log("\n📦 3/5: Deploying AggressiveVault...");
    const AggressiveVault = await hre.ethers.getContractFactory("AggressiveVault");
    const aggressiveVault = await AggressiveVault.deploy(
        MOCK_USDC,
        REFERRAL_MANAGER,
        POINTS_TRACKER,
        strategyControllerAddress,
        TREASURY_MANAGER
    );
    await aggressiveVault.waitForDeployment();
    const aggressiveVaultAddress = await aggressiveVault.getAddress();
    console.log("✅ AggressiveVault:", aggressiveVaultAddress);
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 4. Deploy Mock Strategies
    console.log("\n📦 4/5: Deploying Mock Strategies...");
    const MockStrategy = await hre.ethers.getContractFactory("MockStrategy");
    
    const lendingStrategy = await MockStrategy.deploy(MOCK_USDC);
    await lendingStrategy.waitForDeployment();
    const lendingStrategyAddress = await lendingStrategy.getAddress();
    console.log("✅ LENDING Strategy:", lendingStrategyAddress);

    const beefyStrategy = await MockStrategy.deploy(MOCK_USDC);
    await beefyStrategy.waitForDeployment();
    const beefyStrategyAddress = await beefyStrategy.getAddress();
    console.log("✅ BEEFY Strategy:", beefyStrategyAddress);

    // 5. Register Strategies & Configure
    console.log("\n📦 5/5: Registering Strategies...");
    
    const addTx1 = await strategyController.addStrategy(
        0, // LENDING
        lendingStrategyAddress,
        MOCK_USDC,
        500, // 5% APY
        10,  // 10% risk
        0    // Novice tier
    );
    await addTx1.wait();
    console.log("✅ LENDING registered");

    const addTx2 = await strategyController.addStrategy(
        4, // VAULT_BEEFY
        beefyStrategyAddress,
        MOCK_USDC,
        700, // 7% APY
        20,  // 20% risk
        0    // Novice tier
    );
    await addTx2.wait();
    console.log("✅ BEEFY registered");
    console.log("✅ Default allocations already set (70% LENDING, 30% BEEFY)");

    // Save deployment data
    deploymentData.contracts.strategyController = strategyControllerAddress;
    deploymentData.contracts.conservativeVault = conservativeVaultAddress;
    deploymentData.contracts.aggressiveVault = aggressiveVaultAddress;
    fs.writeFileSync("./deployed-addresses-sepolia.json", JSON.stringify(deploymentData, null, 2));

    console.log("\n✅ FULL REDEPLOY COMPLETE!");
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("📝 UPDATE FRONTEND & BACKEND:");
    console.log("═══════════════════════════════════════════════════════");
    console.log("\nVITE_CONSERVATIVE_VAULT_ADDRESS=" + conservativeVaultAddress);
    console.log("VITE_AGGRESSIVE_VAULT_ADDRESS=" + aggressiveVaultAddress);
    console.log("VITE_BASE_VAULT_ADDRESS=" + aggressiveVaultAddress);
    console.log("\n🎉 System ready for testing!");
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

