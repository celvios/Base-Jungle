const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("\n🚀 FULL SYSTEM REDEPLOY - Base Jungle to Base Sepolia\n");
    console.log("═══════════════════════════════════════════════════════\n");

    // Get deployer
    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deployer Address:", deployer.address);

    const balance = await hre.ethers.provider.getBalance(deployer.address);
    console.log("💰 Deployer Balance:", hre.ethers.formatEther(balance), "ETH\n");

    if (balance === 0n) {
        console.log("❌ ERROR: Deployer has no ETH!");
        console.log("Get Base Sepolia ETH from: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");
        process.exit(1);
    }

    // Configuration
    const USDC_SEPOLIA = process.env.USDC_ADDRESS || "0x634c1cf5129fC7bd49736b9684375E112e4000E1";
    const addresses = {};
    const strategies = {};
    const startTime = Date.now();

    console.log("═══════════════════════════════════════════════════════");
    console.log("📦 PHASE 1: Core Infrastructure");
    console.log("═══════════════════════════════════════════════════════\n");

    // 1. Deploy TreasuryManager
    console.log("1️⃣  Deploying TreasuryManager...");
    const TreasuryManager = await hre.ethers.getContractFactory("TreasuryManager");
    const treasuryManager = await TreasuryManager.deploy();
    await treasuryManager.waitForDeployment();
    addresses.treasuryManager = await treasuryManager.getAddress();
    console.log("   ✅", addresses.treasuryManager, "\n");

    // 2. Deploy GovernanceToken
    console.log("2️⃣  Deploying GovernanceToken ($JUNGLE)...");
    const GovernanceToken = await hre.ethers.getContractFactory("GovernanceToken");
    const governanceToken = await GovernanceToken.deploy();
    await governanceToken.waitForDeployment();
    addresses.governanceToken = await governanceToken.getAddress();
    console.log("   ✅", addresses.governanceToken, "\n");

    console.log("═══════════════════════════════════════════════════════");
    console.log("📦 PHASE 2: Tracking & Rewards");
    console.log("═══════════════════════════════════════════════════════\n");

    // 3. Deploy ReferralManager
    console.log("3️⃣  Deploying ReferralManager...");
    const ReferralManager = await hre.ethers.getContractFactory("ReferralManager");
    const referralManager = await ReferralManager.deploy();
    await referralManager.waitForDeployment();
    addresses.referralManager = await referralManager.getAddress();
    console.log("   ✅", addresses.referralManager, "\n");

    // 4. Deploy PointsTracker
    console.log("4️⃣  Deploying PointsTracker...");
    const PointsTracker = await hre.ethers.getContractFactory("PointsTracker");
    const pointsTracker = await PointsTracker.deploy(
        addresses.referralManager,
        hre.ethers.ZeroAddress, // activityVerifier
        hre.ethers.ZeroAddress  // nftContract
    );
    await pointsTracker.waitForDeployment();
    addresses.pointsTracker = await pointsTracker.getAddress();
    console.log("   ✅", addresses.pointsTracker, "\n");

    console.log("═══════════════════════════════════════════════════════");
    console.log("📦 PHASE 3: Strategy System");
    console.log("═══════════════════════════════════════════════════════\n");

    // 5. Deploy StrategyController
    console.log("5️⃣  Deploying StrategyController...");
    const StrategyController = await hre.ethers.getContractFactory("StrategyController");
    const strategyController = await StrategyController.deploy(
        addresses.referralManager
    );
    await strategyController.waitForDeployment();
    addresses.strategyController = await strategyController.getAddress();
    console.log("   ✅", addresses.strategyController, "\n");

    console.log("═══════════════════════════════════════════════════════");
    console.log("📦 PHASE 4: Vaults");
    console.log("═══════════════════════════════════════════════════════\n");

    // 6. Deploy ConservativeVault
    console.log("6️⃣  Deploying ConservativeVault...");
    const ConservativeVault = await hre.ethers.getContractFactory("ConservativeVault");
    const conservativeVault = await ConservativeVault.deploy(
        USDC_SEPOLIA,
        addresses.referralManager,
        addresses.pointsTracker,
        addresses.strategyController,
        addresses.treasuryManager
    );
    await conservativeVault.waitForDeployment();
    addresses.conservativeVault = await conservativeVault.getAddress();
    console.log("   ✅", addresses.conservativeVault, "\n");

    // 7. Deploy AggressiveVault
    console.log("7️⃣  Deploying AggressiveVault...");
    const AggressiveVault = await hre.ethers.getContractFactory("AggressiveVault");
    const aggressiveVault = await AggressiveVault.deploy(
        USDC_SEPOLIA,
        addresses.referralManager,
        addresses.pointsTracker,
        addresses.strategyController,
        addresses.treasuryManager
    );
    await aggressiveVault.waitForDeployment();
    addresses.aggressiveVault = await aggressiveVault.getAddress();
    console.log("   ✅", addresses.aggressiveVault, "\n");

    // Use AggressiveVault as master vault
    addresses.masterVault = addresses.aggressiveVault;

    console.log("═══════════════════════════════════════════════════════");
    console.log("📦 PHASE 5: Leverage System");
    console.log("═══════════════════════════════════════════════════════\n");

    // 8. Deploy LeverageManager (CRITICAL - was missing!)
    console.log("8️⃣  Deploying LeverageManager...");
    try {
        const LeverageManager = await hre.ethers.getContractFactory("LeverageManager");
        const leverageManager = await LeverageManager.deploy(
            addresses.referralManager,
            addresses.strategyController,
            hre.ethers.ZeroAddress, // oracle - will set later
            hre.ethers.ZeroAddress  // lendingAdapter - will set later
        );
        await leverageManager.waitForDeployment();
        addresses.leverageController = await leverageManager.getAddress();
        console.log("   ✅", addresses.leverageController, "\n");
    } catch (error) {
        console.log("   ⚠️  LeverageManager deployment failed:", error.message);
        console.log("   Setting to zero address...\n");
        addresses.leverageController = hre.ethers.ZeroAddress;
    }

    console.log("═══════════════════════════════════════════════════════");
    console.log("📦 PHASE 6: Strategy Adapters & Protocols");
    console.log("═══════════════════════════════════════════════════════\n");

    // Deploy mock strategies for testing
    console.log("9️⃣  Deploying Strategy Adapters...\n");

    // Deploy Lending Strategy
    try {
        console.log("   📍 Deploying Lending Strategy...");
        const LendingStrategy = await hre.ethers.getContractFactory("LendingStrategy");
        const lendingStrategy = await LendingStrategy.deploy(
            USDC_SEPOLIA,
            addresses.strategyController
        );
        await lendingStrategy.waitForDeployment();
        addresses.lendingStrategy = await lendingStrategy.getAddress();
        console.log("      ✅", addresses.lendingStrategy);
    } catch (error) {
        console.log("      ⚠️  Skipped:", error.message);
    }

    // Deploy Beefy Strategy
    try {
        console.log("   📍 Deploying Beefy Strategy...");
        const BeefyStrategy = await hre.ethers.getContractFactory("BeefyStrategy");
        const beefyStrategy = await BeefyStrategy.deploy(
            USDC_SEPOLIA,
            addresses.strategyController
        );
        await beefyStrategy.waitForDeployment();
        addresses.beefyStrategy = await beefyStrategy.getAddress();
        console.log("      ✅", addresses.beefyStrategy);
    } catch (error) {
        console.log("      ⚠️  Skipped:", error.message);
    }

    console.log();

    console.log("═══════════════════════════════════════════════════════");
    console.log("📦 PHASE 7: Token Sale");
    console.log("═══════════════════════════════════════════════════════\n");

    // 10. Deploy TokenSale
    console.log("🔟 Deploying TokenSale...");
    const TokenSale = await hre.ethers.getContractFactory("TokenSale");
    const tokenSale = await TokenSale.deploy(
        USDC_SEPOLIA,
        addresses.governanceToken,
        hre.ethers.parseUnits("0.1", 6),           // 0.1 USDC per token
        Math.floor(Date.now() / 1000),              // startTime (now)
        Math.floor(Date.now() / 1000) + 86400 * 30, // endTime (30 days)
        hre.ethers.parseUnits("10000000", 6),       // softCap (10M USDC)
        hre.ethers.parseUnits("100000000", 6)       // hardCap (100M USDC)
    );
    await tokenSale.waitForDeployment();
    addresses.tokenSale = await tokenSale.getAddress();
    console.log("   ✅", addresses.tokenSale, "\n");

    console.log("═══════════════════════════════════════════════════════");
    console.log("⚙️  PHASE 8: Configuration & Roles");
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("🔐 Granting roles...\n");

    // Grant VAULT_ROLE to vaults
    const VAULT_ROLE = await strategyController.VAULT_ROLE();

    console.log("   📍 Granting VAULT_ROLE to ConservativeVault...");
    let tx = await strategyController.grantRole(VAULT_ROLE, addresses.conservativeVault);
    await tx.wait();
    console.log("      ✅ Done");

    console.log("   📍 Granting VAULT_ROLE to AggressiveVault...");
    tx = await strategyController.grantRole(VAULT_ROLE, addresses.aggressiveVault);
    await tx.wait();
    console.log("      ✅ Done");

    // Grant UPDATER_ROLE to vaults on PointsTracker
    const UPDATER_ROLE = await pointsTracker.UPDATER_ROLE();

    console.log("   📍 Granting UPDATER_ROLE to ConservativeVault...");
    tx = await pointsTracker.grantRole(UPDATER_ROLE, addresses.conservativeVault);
    await tx.wait();
    console.log("      ✅ Done");

    console.log("   📍 Granting UPDATER_ROLE to AggressiveVault...");
    tx = await pointsTracker.grantRole(UPDATER_ROLE, addresses.aggressiveVault);
    await tx.wait();
    console.log("      ✅ Done\n");

    // Register strategies with StrategyController
    console.log("📊 Registering strategies...\n");

    if (addresses.lendingStrategy) {
        try {
            console.log("   📍 Registering Lending Strategy...");
            const strategyId = await strategyController.addStrategy(
                0, // LENDING
                addresses.lendingStrategy,
                USDC_SEPOLIA,
                800, // 8% APY
                30,  // Low risk
                0    // Novice tier
            );
            await strategyId.wait();
            strategies.LENDING = addresses.lendingStrategy;
            console.log("      ✅ Registered");
        } catch (error) {
            console.log("      ⚠️  Failed:", error.message);
        }
    }

    if (addresses.beefyStrategy) {
        try {
            console.log("   📍 Registering Beefy Strategy...");
            const strategyId = await strategyController.addStrategy(
                4, // VAULT_BEEFY
                addresses.beefyStrategy,
                USDC_SEPOLIA,
                1500, // 15% APY
                60,   // Medium risk
                2     // Captain tier
            );
            await strategyId.wait();
            strategies.VAULT_BEEFY = addresses.beefyStrategy;
            console.log("      ✅ Registered");
        } catch (error) {
            console.log("      ⚠️  Failed:", error.message);
        }
    }

    console.log();

    // Configure tier allocations
    console.log("🎯 Configuring tier allocations...\n");

    try {
        // Whale tier allocations (tier 3)
        console.log("   📍 Setting Whale tier allocations...");

        // This would require the setTierAllocations function
        // For now, we'll skip if it doesn't exist
        console.log("      ⚠️  Manual configuration required via admin panel\n");
    } catch (error) {
        console.log("      ⚠️  Skipped:", error.message, "\n");
    }

    // Calculate deployment time
    const deployTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("═══════════════════════════════════════════════════════");
    console.log("✅ DEPLOYMENT COMPLETE!");
    console.log("═══════════════════════════════════════════════════════\n");
    console.log(`⏱️  Total time: ${deployTime}s\n`);

    // Save addresses to file
    const deploymentData = {
        network: "baseSepolia",
        chainId: 84532,
        deployedAt: new Date().toISOString(),
        deployer: deployer.address,
        usdcAddress: USDC_SEPOLIA,
        contracts: addresses,
        strategies: strategies,
    };

    const outputPath = "./deployed-addresses-sepolia.json";
    fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
    console.log("📄 Deployment data saved to:", outputPath, "\n");

    // Summary
    console.log("═══════════════════════════════════════════════════════");
    console.log("📋 DEPLOYMENT SUMMARY");
    console.log("═══════════════════════════════════════════════════════\n");
    console.log("Core Contracts:");
    console.log("  • TreasuryManager:", addresses.treasuryManager);
    console.log("  • GovernanceToken:", addresses.governanceToken);
    console.log("  • ReferralManager:", addresses.referralManager);
    console.log("  • PointsTracker:", addresses.pointsTracker);
    console.log("  • StrategyController:", addresses.strategyController);
    console.log("\nVaults:");
    console.log("  • ConservativeVault:", addresses.conservativeVault);
    console.log("  • AggressiveVault:", addresses.aggressiveVault);
    console.log("\nLeverage:");
    console.log("  • LeverageController:", addresses.leverageController);
    console.log("\nToken Sale:");
    console.log("  • TokenSale:", addresses.tokenSale);
    console.log("\n");

    console.log("═══════════════════════════════════════════════════════");
    console.log("🔧 NEXT STEPS");
    console.log("═══════════════════════════════════════════════════════\n");
    console.log("1. Run diagnostic: node scripts/diagnose-aggressive-vault.cjs");
    console.log("2. Update frontend .env with new addresses");
    console.log("3. Test deposit flow");
    console.log("4. Verify leverage toggle works\n");

    console.log("✅ Deployment successful! 🎉\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
