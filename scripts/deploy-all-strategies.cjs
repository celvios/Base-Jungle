const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config({ path: ".env.deployment" });

/**
 * Deploy ALL mock strategies that simulate real DeFi behavior
 * 
 * Strategy Types & Realistic Parameters:
 * 0. LENDING (Moonwell/Aave) - 4% APY, 10% risk - Safest
 * 1. LP_STABLE (USDC/DAI) - 12% APY, 20% risk - Stable pairs
 * 2. LP_VOLATILE (ETH/USDC) - 25% APY, 45% risk - Volatile pairs  
 * 3. LEVERAGED_LP - 40% APY, 70% risk - Borrowed + LP
 * 4. VAULT_BEEFY - 8% APY, 15% risk - Auto-compound
 * 5. ARBITRAGE - 15% APY, 50% risk - Flash loans
 */

const STRATEGY_CONFIG = [
    {
        type: 0,
        name: "LENDING",
        description: "Moonwell/Aave lending - Earn interest on supplied USDC",
        apy: 400,      // 4% APY
        risk: 10,      // 10% risk score
        minTier: 0     // Available to all tiers (Novice+)
    },
    {
        type: 1,
        name: "LP_STABLE", 
        description: "Stable LP (USDC/DAI) - Low impermanent loss",
        apy: 1200,     // 12% APY
        risk: 20,      // 20% risk score
        minTier: 1     // Scout+ (5 referrals)
    },
    {
        type: 2,
        name: "LP_VOLATILE",
        description: "Volatile LP (ETH/USDC) - Higher rewards, IL risk",
        apy: 2500,     // 25% APY
        risk: 45,      // 45% risk score
        minTier: 2     // Captain+ (20 referrals)
    },
    {
        type: 3,
        name: "LEVERAGED_LP",
        description: "Leveraged LP - Borrow to amplify LP position",
        apy: 4000,     // 40% APY
        risk: 70,      // 70% risk score
        minTier: 3     // Whale only (100 referrals)
    },
    {
        type: 4,
        name: "VAULT_BEEFY",
        description: "Beefy auto-compound vault - Set and forget",
        apy: 800,      // 8% APY
        risk: 15,      // 15% risk score
        minTier: 0     // Available to all tiers
    },
    {
        type: 5,
        name: "ARBITRAGE",
        description: "Flash loan arbitrage - Advanced strategy",
        apy: 1500,     // 15% APY (variable)
        risk: 50,      // 50% risk score
        minTier: 3     // Whale only
    }
];

async function main() {
    console.log("\n🚀 DEPLOYING ALL MOCK STRATEGIES\n");
    console.log("═══════════════════════════════════════════════════════\n");
    console.log("These mock strategies simulate REAL DeFi behavior:\n");

    STRATEGY_CONFIG.forEach(s => {
        console.log(`  ${s.type}. ${s.name}`);
        console.log(`     APY: ${s.apy/100}% | Risk: ${s.risk}% | Min Tier: ${['Novice','Scout','Captain','Whale'][s.minTier]}`);
        console.log(`     ${s.description}\n`);
    });

    const [deployer] = await hre.ethers.getSigners();
    console.log("📝 Deployer:", deployer.address);
    console.log("💰 Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "ETH\n");

    const MOCK_USDC = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";
    console.log("💰 Mock USDC:", MOCK_USDC);

    // Load deployment data
    const deploymentData = JSON.parse(fs.readFileSync("./deployed-addresses-sepolia.json", "utf8"));

    // ═══════════════════════════════════════════════════════
    // Step 1: Deploy new StrategyController
    // ═══════════════════════════════════════════════════════
    console.log("\n📦 STEP 1: Deploying new StrategyController...\n");

    const StrategyController = await hre.ethers.getContractFactory("StrategyController");
    const strategyController = await StrategyController.deploy(deploymentData.contracts.referralManager);
    await strategyController.waitForDeployment();
    const scAddress = await strategyController.getAddress();
    console.log("✅ StrategyController:", scAddress);

    // Verify VAULT_ROLE exists
    const VAULT_ROLE = await strategyController.VAULT_ROLE();
    console.log("✅ VAULT_ROLE:", VAULT_ROLE);

    // Verify getTotalAllocated exists
    const totalAllocated = await strategyController.getTotalAllocated();
    console.log("✅ getTotalAllocated() works:", totalAllocated.toString());

    await new Promise(r => setTimeout(r, 3000));

    // ═══════════════════════════════════════════════════════
    // Step 2: Deploy MockYieldStrategy for each type
    // ═══════════════════════════════════════════════════════
    console.log("\n📦 STEP 2: Deploying MockYieldStrategy contracts...\n");

    const MockYieldStrategy = await hre.ethers.getContractFactory("MockYieldStrategy");
    const deployedStrategies = {};

    for (const config of STRATEGY_CONFIG) {
        console.log(`📈 Deploying ${config.name} (${config.apy/100}% APY)...`);
        
        const strategy = await MockYieldStrategy.deploy(
            MOCK_USDC,
            config.apy,
            config.risk
        );
        await strategy.waitForDeployment();
        const address = await strategy.getAddress();
        
        deployedStrategies[config.name] = address;
        console.log(`   ✅ ${config.name}: ${address}`);

        await new Promise(r => setTimeout(r, 2000));
    }

    // ═══════════════════════════════════════════════════════
    // Step 3: Register all strategies
    // ═══════════════════════════════════════════════════════
    console.log("\n📦 STEP 3: Registering strategies...\n");

    for (const config of STRATEGY_CONFIG) {
        console.log(`   Adding ${config.name}...`);
        
        const tx = await strategyController.addStrategy(
            config.type,
            deployedStrategies[config.name],
            MOCK_USDC,
            config.apy,
            config.risk,
            config.minTier
        );
        await tx.wait();
        console.log(`   ✅ ${config.name} registered`);
    }

    const strategyCount = await strategyController.strategyCount();
    console.log(`\n📊 Total strategies registered: ${strategyCount}`);

    // ═══════════════════════════════════════════════════════
    // Step 4: Deploy new ConservativeVault
    // ═══════════════════════════════════════════════════════
    console.log("\n📦 STEP 4: Deploying ConservativeVault...\n");

    const ConservativeVault = await hre.ethers.getContractFactory("ConservativeVault");
    const vault = await ConservativeVault.deploy(
        MOCK_USDC,
        deploymentData.contracts.referralManager,
        deploymentData.contracts.pointsTracker,
        scAddress,
        deploymentData.contracts.treasuryManager
    );
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log("✅ ConservativeVault:", vaultAddress);

    // ═══════════════════════════════════════════════════════
    // Step 5: Grant roles
    // ═══════════════════════════════════════════════════════
    console.log("\n📦 STEP 5: Granting roles...\n");

    // Grant VAULT_ROLE
    const grantTx1 = await strategyController.grantRole(VAULT_ROLE, vaultAddress);
    await grantTx1.wait();
    console.log("✅ VAULT_ROLE granted to vault");

    // Grant UPDATER_ROLE on PointsTracker
    const pt = await hre.ethers.getContractAt("PointsTracker", deploymentData.contracts.pointsTracker);
    const UPDATER_ROLE = await pt.UPDATER_ROLE();
    const grantTx2 = await pt.grantRole(UPDATER_ROLE, vaultAddress);
    await grantTx2.wait();
    console.log("✅ UPDATER_ROLE granted to vault");

    // ═══════════════════════════════════════════════════════
    // Step 6: Seed initial yield to strategies
    // ═══════════════════════════════════════════════════════
    console.log("\n📦 STEP 6: Seeding yield to strategies...\n");

    const usdc = await hre.ethers.getContractAt(
        ["function approve(address, uint256)", "function balanceOf(address) view returns (uint256)"],
        MOCK_USDC
    );

    const balance = await usdc.balanceOf(deployer.address);
    console.log("Deployer USDC:", hre.ethers.formatUnits(balance, 6));

    // Add yield to simulate accumulated earnings
    const yieldAmounts = {
        LENDING: 25,      // $25 accumulated
        LP_STABLE: 50,    // $50 accumulated
        LP_VOLATILE: 100, // $100 accumulated
        LEVERAGED_LP: 150,// $150 accumulated
        VAULT_BEEFY: 35,  // $35 accumulated
        ARBITRAGE: 75     // $75 accumulated
    };

    for (const [name, amount] of Object.entries(yieldAmounts)) {
        const strategyAddress = deployedStrategies[name];
        const strategy = await hre.ethers.getContractAt("MockYieldStrategy", strategyAddress);
        const amountWei = hre.ethers.parseUnits(amount.toString(), 6);
        
        if (balance >= amountWei) {
            await usdc.approve(strategyAddress, amountWei);
            await strategy.addYield(amountWei);
            console.log(`   ✅ Added $${amount} yield to ${name}`);
        }
    }

    // ═══════════════════════════════════════════════════════
    // Summary
    // ═══════════════════════════════════════════════════════
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("✅ ALL STRATEGIES DEPLOYED!");
    console.log("═══════════════════════════════════════════════════════\n");

    console.log("📊 Strategy Summary:");
    console.log("┌─────────────────┬────────┬───────┬────────────────────────────────────────────┐");
    console.log("│ Strategy        │ APY    │ Risk  │ Address                                    │");
    console.log("├─────────────────┼────────┼───────┼────────────────────────────────────────────┤");
    for (const config of STRATEGY_CONFIG) {
        const apy = (config.apy/100).toString().padEnd(4);
        const risk = config.risk.toString().padEnd(3);
        console.log(`│ ${config.name.padEnd(15)} │ ${apy}%  │ ${risk}%  │ ${deployedStrategies[config.name]} │`);
    }
    console.log("└─────────────────┴────────┴───────┴────────────────────────────────────────────┘");

    console.log("\n📊 Tier Allocations:");
    console.log("  Novice  (0 refs):  70% LENDING, 30% BEEFY");
    console.log("  Scout   (5 refs):  50% LENDING, 30% LP_STABLE, 20% BEEFY");
    console.log("  Captain (20 refs): 40% LENDING, 30% LP_VOLATILE, 30% BEEFY");
    console.log("  Whale   (100 refs): 20% LENDING, 30% LEVERAGED_LP, 30% LP_VOLATILE, 20% ARBITRAGE");

    console.log("\n📝 UPDATE VERCEL:");
    console.log("═══════════════════════════════════════════════════════");
    console.log(`VITE_CONSERVATIVE_VAULT_ADDRESS=${vaultAddress}`);
    console.log(`VITE_AGGRESSIVE_VAULT_ADDRESS=${vaultAddress}`);
    console.log(`VITE_BASE_VAULT_ADDRESS=${vaultAddress}`);

    // Update deployment file
    deploymentData.contracts.strategyController = scAddress;
    deploymentData.contracts.conservativeVault = vaultAddress;
    deploymentData.contracts.aggressiveVault = vaultAddress;
    deploymentData.strategies = deployedStrategies;
    fs.writeFileSync("./deployed-addresses-sepolia.json", JSON.stringify(deploymentData, null, 2));

    console.log("\n🎉 System ready! Yield will accumulate based on APY over time!");
    console.log("   - Novice gets conservative strategies (4-8% APY)");
    console.log("   - Higher tiers unlock aggressive strategies (25-40% APY)");
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

