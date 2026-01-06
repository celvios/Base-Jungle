const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("\n🔍 AGGRESSIVE VAULT DIAGNOSTIC REPORT 🔍\n");
    console.log("=".repeat(60));

    // Load deployment addresses
    const deploymentData = JSON.parse(
        fs.readFileSync("./deployed-addresses-sepolia.json", "utf8")
    );

    const AGGRESSIVE_VAULT = deploymentData.contracts.aggressiveVault;
    const STRATEGY_CONTROLLER = deploymentData.contracts.strategyController;
    const REFERRAL_MANAGER = deploymentData.contracts.referralManager;
    const USDC = deploymentData.usdcAddress;

    const [signer] = await ethers.getSigners();
    const userAddress = signer.address;

    console.log(`\n👤 User Address: ${userAddress}`);
    console.log(`📍 Aggressive Vault: ${AGGRESSIVE_VAULT}`);
    console.log(`📍 Strategy Controller: ${STRATEGY_CONTROLLER}`);
    console.log("\n" + "=".repeat(60));

    // Get contracts
    const aggressiveVault = await ethers.getContractAt("AggressiveVault", AGGRESSIVE_VAULT);
    const strategyController = await ethers.getContractAt("StrategyController", STRATEGY_CONTROLLER);
    const referralManager = await ethers.getContractAt("ReferralManager", REFERRAL_MANAGER);
    const usdc = await ethers.getContractAt("IERC20", USDC);

    // ========== SECTION 1: USER TIER ==========
    console.log("\n\n📊 SECTION 1: USER TIER STATUS");
    console.log("-".repeat(60));

    try {
        const userTier = await referralManager.getUserTier(userAddress);
        const tierNames = ["Novice", "Scout", "Captain", "Whale"];
        console.log(`✅ Current Tier: ${tierNames[userTier]} (${userTier})`);

        const tierInfo = await referralManager.getUserTierInfo(userAddress);
        console.log(`   Active Referrals: ${tierInfo.activeReferrals}`);
        console.log(`   Total Referrals: ${tierInfo.totalReferrals}`);
    } catch (error) {
        console.log(`❌ Error getting tier: ${error.message}`);
    }

    // ========== SECTION 2: VAULT BALANCE ==========
    console.log("\n\n💰 SECTION 2: AGGRESSIVE VAULT BALANCE");
    console.log("-".repeat(60));

    try {
        const userShares = await aggressiveVault.balanceOf(userAddress);
        const totalAssets = await aggressiveVault.totalAssets();
        const totalSupply = await aggressiveVault.totalSupply();

        console.log(`   Your Shares: ${ethers.formatUnits(userShares, 6)} bjAGG`);
        console.log(`   Total Vault Assets: ${ethers.formatUnits(totalAssets, 6)} USDC`);
        console.log(`   Total Shares Supply: ${ethers.formatUnits(totalSupply, 6)} bjAGG`);

        if (userShares > 0n) {
            const userAssets = (userShares * totalAssets) / totalSupply;
            console.log(`   Your Asset Value: ${ethers.formatUnits(userAssets, 6)} USDC`);
        } else {
            console.log(`   ⚠️  You have NO shares in the Aggressive Vault`);
        }
    } catch (error) {
        console.log(`❌ Error getting vault balance: ${error.message}`);
    }

    // ========== SECTION 3: STRATEGY ALLOCATIONS ==========
    console.log("\n\n🎯 SECTION 3: STRATEGY ALLOCATIONS");
    console.log("-".repeat(60));

    try {
        const strategyCount = await strategyController.strategyCount();
        console.log(`   Total Strategies: ${strategyCount}`);

        let totalAllocated = 0n;
        const strategyTypes = [
            "LENDING", "LEVERAGED_LENDING", "LP_STABLE",
            "LP_VOLATILE", "VAULT_BEEFY", "LEVERAGED_LP", "GAUGE_FARMING"
        ];

        for (let i = 0; i < strategyCount; i++) {
            try {
                const strategy = await strategyController.strategies(i);
                const allocation = await strategyController.userAllocations(userAddress, i);

                if (allocation > 0n) {
                    const typeName = strategyTypes[strategy.strategyType] || `TYPE_${strategy.strategyType}`;
                    console.log(`\n   Strategy ${i} (${typeName}):`);
                    console.log(`      Allocated: ${ethers.formatUnits(allocation, 6)} USDC`);
                    console.log(`      Active: ${strategy.isActive}`);
                    console.log(`      Min Tier: ${strategy.minTier}`);
                    totalAllocated += allocation;
                }
            } catch (err) {
                console.log(`   ⚠️  Could not read strategy ${i}: ${err.message}`);
            }
        }

        console.log(`\n   📊 Total Allocated: ${ethers.formatUnits(totalAllocated, 6)} USDC`);

        if (totalAllocated === 0n) {
            console.log(`   ❌ NO FUNDS ALLOCATED TO ANY STRATEGY!`);
            console.log(`   💡 This is why you're not earning yield!`);
        }
    } catch (error) {
        console.log(`❌ Error checking strategies: ${error.message}`);
    }

    // ========== SECTION 4: VAULT ROLES & PERMISSIONS ==========
    console.log("\n\n🔐 SECTION 4: VAULT ROLES & PERMISSIONS");
    console.log("-".repeat(60));

    try {
        const VAULT_ROLE = await strategyController.VAULT_ROLE();
        const hasVaultRole = await strategyController.hasRole(VAULT_ROLE, AGGRESSIVE_VAULT);

        console.log(`   Aggressive Vault has VAULT_ROLE: ${hasVaultRole ? "✅ YES" : "❌ NO"}`);

        if (!hasVaultRole) {
            console.log(`   ⚠️  CRITICAL: Vault cannot allocate funds without VAULT_ROLE!`);
        }
    } catch (error) {
        console.log(`❌ Error checking roles: ${error.message}`);
    }

    // ========== SECTION 5: LEVERAGE MANAGER ==========
    console.log("\n\n⚡ SECTION 5: LEVERAGE MANAGER STATUS");
    console.log("-".repeat(60));

    try {
        const leverageControllerAddr = deploymentData.contracts.leverageController;

        if (leverageControllerAddr === "0x0000000000000000000000000000000000000000") {
            console.log(`   ❌ LEVERAGE CONTROLLER NOT DEPLOYED!`);
            console.log(`   💡 This is why the leverage toggle doesn't work!`);
        } else {
            console.log(`   📍 Leverage Controller: ${leverageControllerAddr}`);

            const leverageManager = await ethers.getContractAt("LeverageManager", leverageControllerAddr);
            const position = await leverageManager.positions(userAddress);

            console.log(`   Position Active: ${position.active}`);
            if (position.active) {
                console.log(`   Initial Deposit: ${ethers.formatUnits(position.initialDeposit, 6)} USDC`);
                console.log(`   Total Deposited: ${ethers.formatUnits(position.totalDeposited, 6)} USDC`);
                console.log(`   Total Borrowed: ${ethers.formatUnits(position.totalBorrowed, 6)} USDC`);
                console.log(`   Current Leverage: ${position.currentLeverage / 10000}x`);
            }
        }
    } catch (error) {
        console.log(`   ⚠️  Error checking leverage: ${error.message}`);
    }

    // ========== SECTION 6: TIER ALLOCATIONS CONFIG ==========
    console.log("\n\n⚙️  SECTION 6: TIER ALLOCATION CONFIGURATION");
    console.log("-".repeat(60));

    try {
        // Check if Whale tier has allocation configs
        const tierAllocations = await strategyController.getTierAllocations(3); // 3 = Whale

        console.log(`   Whale Tier Allocation Configs: ${tierAllocations.length}`);

        if (tierAllocations.length === 0) {
            console.log(`   ❌ NO ALLOCATION CONFIG FOR WHALE TIER!`);
            console.log(`   💡 This means funds cannot be allocated to strategies!`);
        } else {
            for (let i = 0; i < tierAllocations.length; i++) {
                const config = tierAllocations[i];
                console.log(`   Config ${i}: Strategy ${config.strategyId}, ${config.percentage / 100}%`);
            }
        }
    } catch (error) {
        console.log(`   ⚠️  Error checking tier allocations: ${error.message}`);
    }

    // ========== SUMMARY ==========
    console.log("\n\n" + "=".repeat(60));
    console.log("📋 DIAGNOSTIC SUMMARY");
    console.log("=".repeat(60));
    console.log("\nPotential Issues Found:");
    console.log("1. Check if you have shares in Aggressive Vault");
    console.log("2. Check if funds are allocated to strategies");
    console.log("3. Check if Aggressive Vault has VAULT_ROLE");
    console.log("4. Check if Leverage Controller is deployed");
    console.log("5. Check if Whale tier has allocation configs");
    console.log("\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
