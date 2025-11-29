const hre = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("\n🚀 Deploying Base Jungle to Base Sepolia...\n");
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
    const USDC_SEPOLIA = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    const addresses = {};
    const startTime = Date.now();

    console.log("═══════════════════════════════════════════════════════");
    console.log("📦 PHASE 1: Core Infrastructure");
    console.log("═══════════════════════════════════════════════════════\n");

    // 1. Deploy TreasuryManager
    console.log("Deploying TreasuryManager...");
    const TreasuryManager = await hre.ethers.getContractFactory("TreasuryManager");
    const treasuryManager = await TreasuryManager.deploy();
    await treasuryManager.waitForDeployment();
    addresses.treasuryManager = await treasuryManager.getAddress();
    console.log("✅ TreasuryManager:", addresses.treasuryManager, "\n");

    // 2. Deploy GovernanceToken
    console.log("Deploying GovernanceToken ($JUNGLE)...");
    const GovernanceToken = await hre.ethers.getContractFactory("GovernanceToken");
    const governanceToken = await GovernanceToken.deploy();
    await governanceToken.waitForDeployment();
    addresses.governanceToken = await governanceToken.getAddress();
    console.log("✅ GovernanceToken:", addresses.governanceToken, "\n");

    console.log("═══════════════════════════════════════════════════════");
    console.log("📦 PHASE 2: Tracking & Rewards");
    console.log("═══════════════════════════════════════════════════════\n");

    // 3. Deploy ReferralManager (Moved before PointsTracker)
    console.log("Deploying ReferralManager...");
    const ReferralManager = await hre.ethers.getContractFactory("ReferralManager");
    const referralManager = await ReferralManager.deploy();
    await referralManager.waitForDeployment();
    addresses.referralManager = await referralManager.getAddress();
    console.log("✅ ReferralManager:", addresses.referralManager, "\n");

    // 4. Deploy PointsTracker (Now has ReferralManager address)
    console.log("Deploying PointsTracker...");
    const PointsTracker = await hre.ethers.getContractFactory("PointsTracker");
    const pointsTracker = await PointsTracker.deploy(
        addresses.referralManager,
        hre.ethers.ZeroAddress, // activityVerifier
        hre.ethers.ZeroAddress  // nftContract - will update later
    );
    await pointsTracker.waitForDeployment();
    addresses.pointsTracker = await pointsTracker.getAddress();
    console.log("✅ PointsTracker:", addresses.pointsTracker, "\n");

    console.log("═══════════════════════════════════════════════════════");
    console.log("📦 PHASE 3: Vault System");
    console.log("═══════════════════════════════════════════════════════\n");

    // Deploy StrategyController first (vaults need it)
    console.log("Deploying StrategyController...");
    const StrategyController = await hre.ethers.getContractFactory("StrategyController");
    const strategyController = await StrategyController.deploy(
        addresses.referralManager
    );
    await strategyController.waitForDeployment();
    addresses.strategyController = await strategyController.getAddress();
    console.log("✅ StrategyController:", addresses.strategyController, "\n");

    // 5. Deploy Conservative Vault
    console.log("Deploying ConservativeVault...");
    const ConservativeVault = await hre.ethers.getContractFactory("ConservativeVault");
    const conservativeVault = await ConservativeVault.deploy(
        USDC_SEPOLIA,
        addresses.referralManager,
        addresses.pointsTracker,
        addresses.strategyController,
        addresses.treasuryManager // feeCollector
    );
    await conservativeVault.waitForDeployment();
    addresses.conservativeVault = await conservativeVault.getAddress();
    console.log("✅ ConservativeVault:", addresses.conservativeVault, "\n");

    // 6. Deploy Aggressive Vault
    console.log("Deploying AggressiveVault...");
    const AggressiveVault = await hre.ethers.getContractFactory("AggressiveVault");
    const aggressiveVault = await AggressiveVault.deploy(
        USDC_SEPOLIA,
        addresses.referralManager,
        addresses.pointsTracker,
        addresses.strategyController,
        addresses.treasuryManager // feeCollector
    );
    await aggressiveVault.waitForDeployment();
    addresses.aggressiveVault = await aggressiveVault.getAddress();
    console.log("✅ AggressiveVault:", addresses.aggressiveVault, "\n");

    // Use AggressiveVault as the base/master vault
    addresses.masterVault = addresses.aggressiveVault;

    console.log("═══════════════════════════════════════════════════════");
    console.log("📦 PHASE 4: Controllers");
    console.log("═══════════════════════════════════════════════════════\n");

    // StrategyController already deployed above
    console.log("✅ StrategyController already deployed\n");

    // 9. Deploy LeverageController (if exists)
    console.log("Deploying LeverageController...");
    try {
        const LeverageController = await hre.ethers.getContractFactory("LeverageController");
        const leverageController = await LeverageController.deploy(
            addresses.aggressiveVault,
            addresses.referralManager
        );
        await leverageController.waitForDeployment();
        addresses.leverageController = await leverageController.getAddress();
        console.log("✅ LeverageController:", addresses.leverageController, "\n");
    } catch (error) {
        console.log("⚠️  LeverageController not found, skipping...\n");
        addresses.leverageController = hre.ethers.ZeroAddress;
    }

    console.log("═══════════════════════════════════════════════════════");
    console.log("📦 PHASE 5: Token Sale");
    console.log("═══════════════════════════════════════════════════════\n");

    // 10. Deploy TokenSale
    console.log("Deploying TokenSale...");
    const TokenSale = await hre.ethers.getContractFactory("TokenSale");
    const tokenSale = await TokenSale.deploy(
        USDC_SEPOLIA,                               // _usdc
        addresses.governanceToken,                  // _jungleToken
        hre.ethers.parseUnits("0.1", 6),           // _pricePerToken (0.1 USDC per token)
        Math.floor(Date.now() / 1000),              // _startTime (now)
        Math.floor(Date.now() / 1000) + 86400 * 30, // _endTime (30 days from now)
        hre.ethers.parseUnits("10000000", 6),       // _softCap (10M USDC)
        hre.ethers.parseUnits("100000000", 6)       // _hardCap (100M USDC)
    );
    await tokenSale.waitForDeployment();
    addresses.tokenSale = await tokenSale.getAddress();
    console.log("✅ TokenSale:", addresses.tokenSale, "\n");

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
    };

    const outputPath = "./deployed-addresses-sepolia.json";
    fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
    console.log("📄 Deployment data saved to:", outputPath, "\n");

    // Generate .env update instructions
    console.log("═══════════════════════════════════════════════════════");
    console.log("📝 FRONTEND CONFIGURATION");
    console.log("═══════════════════════════════════════════════════════\n");
    console.log("Add these to your Base-Jungle-Ui/Base-Jungle/.env file:\n");
    console.log(`VITE_BASE_VAULT_ADDRESS=${addresses.masterVault}`);
    console.log(`VITE_CONSERVATIVE_VAULT_ADDRESS=${addresses.conservativeVault}`);
    console.log(`VITE_AGGRESSIVE_VAULT_ADDRESS=${addresses.aggressiveVault}`);
    console.log(`VITE_POINTS_TRACKER_ADDRESS=${addresses.pointsTracker}`);
    console.log(`VITE_TOKEN_SALE_ADDRESS=${addresses.tokenSale}`);
    console.log(`VITE_STRATEGY_CONTROLLER_ADDRESS=${addresses.strategyController}`);
    console.log(`VITE_REFERRAL_REGISTRY_ADDRESS=${addresses.referralManager}`);
    console.log(`VITE_LEVERAGE_CONTROLLER_ADDRESS=${addresses.leverageController}`);
    console.log(`VITE_USDC_ADDRESS=${USDC_SEPOLIA}\n`);

    console.log("═══════════════════════════════════════════════════════");
    console.log("🔍 VERIFICATION (Optional)");
    console.log("═══════════════════════════════════════════════════════\n");
    console.log("To verify contracts on Basescan, run:\n");
    console.log(`npx hardhat verify --network baseSepolia ${addresses.treasuryManager}`);
    console.log(`npx hardhat verify --network baseSepolia ${addresses.governanceToken}`);
    console.log("... (repeat for other contracts)\n");

    console.log("✅ Deployment successful! 🎉\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Deployment failed:");
        console.error(error);
        process.exit(1);
    });
