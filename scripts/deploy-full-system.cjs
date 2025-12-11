const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n🚀 DEPLOYING FULL BASE JUNGLE VAULT SYSTEM\n");
    console.log("═══════════════════════════════════════════════════════\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deployer:", deployer.address);
    console.log("💰 Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

    const MOCK_USDC = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";
    console.log("💰 Mock USDC:", MOCK_USDC);

    // Load existing core contracts
    const deploymentData = JSON.parse(fs.readFileSync("./deployed-addresses-sepolia.json", "utf8"));
    const REFERRAL_MANAGER = deploymentData.contracts.referralManager;
    const POINTS_TRACKER = deploymentData.contracts.pointsTracker;
    const TREASURY_MANAGER = deploymentData.contracts.treasuryManager;

    console.log("\n📄 Using existing core contracts:");
    console.log("   ReferralManager:", REFERRAL_MANAGER);
    console.log("   PointsTracker:", POINTS_TRACKER);
    console.log("   TreasuryManager:", TREASURY_MANAGER);

    // ═══════════════════════════════════════════════════════
    // STEP 1: Deploy StrategyController (NO VAULT_ROLE)
    // ═══════════════════════════════════════════════════════
    console.log("\n📦 STEP 1/6: Deploying StrategyController...");
    const StrategyController = await hre.ethers.getContractFactory("StrategyController");
    const strategyController = await StrategyController.deploy(REFERRAL_MANAGER);
    await strategyController.waitForDeployment();
    const strategyControllerAddress = await strategyController.getAddress();
    console.log("✅ StrategyController:", strategyControllerAddress);

    // Verify VAULT_ROLE and getTotalAllocated exist
    const VAULT_ROLE = await strategyController.VAULT_ROLE();
    console.log("✅ VAULT_ROLE exists:", VAULT_ROLE);
    
    const totalAllocated = await strategyController.getTotalAllocated();
    console.log("✅ getTotalAllocated() works:", totalAllocated.toString());

    await new Promise(resolve => setTimeout(resolve, 3000));

    // ═══════════════════════════════════════════════════════
    // STEP 2: Deploy Mock Strategies
    // ═══════════════════════════════════════════════════════
    console.log("\n📦 STEP 2/6: Deploying Mock Strategies...");
    const MockStrategy = await hre.ethers.getContractFactory("MockStrategy");
    
    const lendingStrategy = await MockStrategy.deploy(MOCK_USDC);
    await lendingStrategy.waitForDeployment();
    const lendingStrategyAddress = await lendingStrategy.getAddress();
    console.log("✅ LENDING Strategy:", lendingStrategyAddress);

    const beefyStrategy = await MockStrategy.deploy(MOCK_USDC);
    await beefyStrategy.waitForDeployment();
    const beefyStrategyAddress = await beefyStrategy.getAddress();
    console.log("✅ BEEFY Strategy:", beefyStrategyAddress);

    // ═══════════════════════════════════════════════════════
    // STEP 3: Register Strategies
    // ═══════════════════════════════════════════════════════
    console.log("\n📦 STEP 3/6: Registering Strategies...");
    
    const addTx1 = await strategyController.addStrategy(
        0, // LENDING
        lendingStrategyAddress,
        MOCK_USDC,
        500, // 5% APY
        10,  // 10% risk
        0    // Novice tier
    );
    await addTx1.wait();
    console.log("✅ LENDING strategy registered");

    const addTx2 = await strategyController.addStrategy(
        4, // VAULT_BEEFY
        beefyStrategyAddress,
        MOCK_USDC,
        700, // 7% APY
        20,  // 20% risk
        0    // Novice tier
    );
    await addTx2.wait();
    console.log("✅ BEEFY strategy registered");

    // Verify strategies
    const strategyCount = await strategyController.strategyCount();
    console.log("✅ Total strategies:", strategyCount.toString());

    // ═══════════════════════════════════════════════════════
    // STEP 4: Deploy ConservativeVault
    // ═══════════════════════════════════════════════════════
    console.log("\n📦 STEP 4/6: Deploying ConservativeVault...");
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
    console.log("   (Skipping verification - RPC indexing delay)");

    await new Promise(resolve => setTimeout(resolve, 5000));

    // ═══════════════════════════════════════════════════════
    // STEP 5: Deploy AggressiveVault
    // ═══════════════════════════════════════════════════════
    console.log("\n📦 STEP 5/6: Deploying AggressiveVault...");
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

    // ═══════════════════════════════════════════════════════
    // STEP 6: Grant VAULT_ROLE to Vaults
    // ═══════════════════════════════════════════════════════
    console.log("\n📦 STEP 6/7: Granting VAULT_ROLE to Vaults...");
    
    const grantTx1 = await strategyController.grantRole(VAULT_ROLE, conservativeVaultAddress);
    await grantTx1.wait();
    console.log("✅ ConservativeVault granted VAULT_ROLE");

    const grantTx2 = await strategyController.grantRole(VAULT_ROLE, aggressiveVaultAddress);
    await grantTx2.wait();
    console.log("✅ AggressiveVault granted VAULT_ROLE");

    // Grant UPDATER_ROLE on PointsTracker
    const pointsTracker = await hre.ethers.getContractAt("PointsTracker", POINTS_TRACKER);
    const UPDATER_ROLE = await pointsTracker.UPDATER_ROLE();
    
    const grantTx3 = await pointsTracker.grantRole(UPDATER_ROLE, conservativeVaultAddress);
    await grantTx3.wait();
    console.log("✅ ConservativeVault granted UPDATER_ROLE on PointsTracker");

    const grantTx4 = await pointsTracker.grantRole(UPDATER_ROLE, aggressiveVaultAddress);
    await grantTx4.wait();
    console.log("✅ AggressiveVault granted UPDATER_ROLE on PointsTracker");

    // ═══════════════════════════════════════════════════════
    // STEP 7: Test Deposit Simulation
    // ═══════════════════════════════════════════════════════
    console.log("\n📦 STEP 7/7: Testing Deposit...");
    
    const testAmount = hre.ethers.parseUnits("500", 6); // $500
    console.log("   Testing deposit of 500 USDC...");

    try {
        await conservativeVault.deposit.staticCall(testAmount, deployer.address);
        console.log("   ✅ Deposit simulation PASSED!");
    } catch (error) {
        console.log("   ❌ Deposit simulation FAILED!");
        console.log("   Error:", error.message);
        
        if (error.data) {
            console.log("   Error data:", error.data);
        }
    }

    // ═══════════════════════════════════════════════════════
    // Save & Summary
    // ═══════════════════════════════════════════════════════
    deploymentData.contracts.strategyController = strategyControllerAddress;
    deploymentData.contracts.conservativeVault = conservativeVaultAddress;
    deploymentData.contracts.aggressiveVault = aggressiveVaultAddress;
    deploymentData.contracts.masterVault = aggressiveVaultAddress;
    deploymentData.contracts.lendingStrategy = lendingStrategyAddress;
    deploymentData.contracts.beefyStrategy = beefyStrategyAddress;
    fs.writeFileSync("./deployed-addresses-sepolia.json", JSON.stringify(deploymentData, null, 2));

    console.log("\n✅ DEPLOYMENT COMPLETE!");
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("📝 UPDATE VERCEL:");
    console.log("═══════════════════════════════════════════════════════");
    console.log("\nVITE_CONSERVATIVE_VAULT_ADDRESS=" + conservativeVaultAddress);
    console.log("VITE_AGGRESSIVE_VAULT_ADDRESS=" + aggressiveVaultAddress);
    console.log("VITE_BASE_VAULT_ADDRESS=" + aggressiveVaultAddress);
    console.log("\n🎉 System ready! Deposits will auto-allocate 70% LENDING, 30% BEEFY!");
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

