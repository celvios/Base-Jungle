const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n🚀 DEPLOYING YIELD-GENERATING STRATEGIES\n");
    console.log("═══════════════════════════════════════════════════════\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deployer:", deployer.address);
    console.log("💰 Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

    const MOCK_USDC = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";
    console.log("💰 Mock USDC:", MOCK_USDC);

    // Load deployment data
    const deploymentData = JSON.parse(fs.readFileSync("./deployed-addresses-sepolia.json", "utf8"));
    const STRATEGY_CONTROLLER = deploymentData.contracts.strategyController;
    console.log("🎮 Strategy Controller:", STRATEGY_CONTROLLER);

    // ═══════════════════════════════════════════════════════
    // Deploy MockYieldStrategy contracts
    // ═══════════════════════════════════════════════════════
    console.log("\n📦 Deploying MockYieldStrategy contracts...\n");

    const MockYieldStrategy = await hre.ethers.getContractFactory("MockYieldStrategy");

    // LENDING Strategy - 5% APY, Low Risk
    console.log("📈 Deploying LENDING Strategy (5% APY)...");
    const lendingStrategy = await MockYieldStrategy.deploy(
        MOCK_USDC,
        500,  // 5% APY
        10    // 10% risk
    );
    await lendingStrategy.waitForDeployment();
    const lendingAddress = await lendingStrategy.getAddress();
    console.log("✅ LENDING Strategy:", lendingAddress);

    // BEEFY Strategy - 8% APY, Medium Risk
    console.log("📈 Deploying BEEFY Strategy (8% APY)...");
    const beefyStrategy = await MockYieldStrategy.deploy(
        MOCK_USDC,
        800,  // 8% APY
        25    // 25% risk
    );
    await beefyStrategy.waitForDeployment();
    const beefyAddress = await beefyStrategy.getAddress();
    console.log("✅ BEEFY Strategy:", beefyAddress);

    // ═══════════════════════════════════════════════════════
    // Register strategies with StrategyController
    // ═══════════════════════════════════════════════════════
    console.log("\n📝 Registering strategies with StrategyController...\n");

    const sc = await hre.ethers.getContractAt("StrategyController", STRATEGY_CONTROLLER);

    // Check current strategy count
    const currentCount = await sc.strategyCount();
    console.log("Current strategies:", currentCount.toString());

    if (currentCount > 0) {
        console.log("⚠️  Strategies already registered. Skipping...");
    } else {
        // Register LENDING
        console.log("Adding LENDING strategy...");
        const tx1 = await sc.addStrategy(
            0,              // StrategyType.LENDING
            lendingAddress,
            MOCK_USDC,
            500,            // 5% APY
            10,             // 10% risk
            0               // Novice tier
        );
        await tx1.wait();
        console.log("✅ LENDING registered");

        // Register BEEFY
        console.log("Adding BEEFY strategy...");
        const tx2 = await sc.addStrategy(
            4,              // StrategyType.VAULT_BEEFY
            beefyAddress,
            MOCK_USDC,
            800,            // 8% APY
            25,             // 25% risk
            0               // Novice tier
        );
        await tx2.wait();
        console.log("✅ BEEFY registered");
    }

    // Verify final count
    const finalCount = await sc.strategyCount();
    console.log("\n📊 Total strategies registered:", finalCount.toString());

    // ═══════════════════════════════════════════════════════
    // Seed initial yield (simulate some yield for testing)
    // ═══════════════════════════════════════════════════════
    console.log("\n💰 Seeding initial yield for testing...\n");

    const usdc = await hre.ethers.getContractAt(
        ["function approve(address, uint256) returns (bool)", "function balanceOf(address) view returns (uint256)"],
        MOCK_USDC
    );

    const deployerBalance = await usdc.balanceOf(deployer.address);
    console.log("Deployer USDC:", hre.ethers.formatUnits(deployerBalance, 6));

    // Add some yield to each strategy (simulates accumulated yield)
    const yieldAmount = hre.ethers.parseUnits("50", 6); // $50 yield per strategy
    
    if (deployerBalance >= yieldAmount * 2n) {
        // Approve and add yield to LENDING
        await usdc.approve(lendingAddress, yieldAmount);
        await lendingStrategy.addYield(yieldAmount);
        console.log("✅ Added $50 yield to LENDING");

        // Approve and add yield to BEEFY
        await usdc.approve(beefyAddress, yieldAmount);
        await beefyStrategy.addYield(yieldAmount);
        console.log("✅ Added $50 yield to BEEFY");
    } else {
        console.log("⚠️  Not enough USDC to seed yield");
    }

    // ═══════════════════════════════════════════════════════
    // Summary
    // ═══════════════════════════════════════════════════════
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("✅ YIELD STRATEGIES DEPLOYED!");
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("📊 Strategy Details:");
    console.log("   LENDING Strategy:", lendingAddress);
    console.log("      - APY: 5%");
    console.log("      - Risk: Low (10%)");
    console.log("      - Allocation: 70%\n");

    console.log("   BEEFY Strategy:", beefyAddress);
    console.log("      - APY: 8%");
    console.log("      - Risk: Medium (25%)");
    console.log("      - Allocation: 30%\n");

    console.log("🎯 Yield will accumulate over time based on APY!");
    console.log("   - Check pending yield with getPendingYield()");
    console.log("   - Harvest yield with harvest()");
    console.log("   - Admin can add yield with addYield()");

    // Update deployment file
    deploymentData.contracts.lendingStrategy = lendingAddress;
    deploymentData.contracts.beefyStrategy = beefyAddress;
    fs.writeFileSync("./deployed-addresses-sepolia.json", JSON.stringify(deploymentData, null, 2));
    console.log("\n📄 Deployment data updated!");
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

