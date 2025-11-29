const hre = require("hardhat");

async function main() {
    console.log("\n🔍 Verifying Minimum Deposit Logic on Base Sepolia...\n");

    // Configuration
    const REFERRAL_MANAGER = "0xc8A84e0BF9a4C213564e858A89c8f14738aD0f15";
    const CONSERVATIVE_VAULT = "0x986ca22e9f0A6104AAdea7C2698317A690045D13";
    const AGGRESSIVE_VAULT = "0x7eD340313599090b25fA1F6F21671FE0210808E8";

    const [deployer] = await hre.ethers.getSigners();
    console.log("Testing with account:", deployer.address);

    // Get contracts
    const referralManager = await hre.ethers.getContractAt("ReferralManager", REFERRAL_MANAGER);
    const conservativeVault = await hre.ethers.getContractAt("ConservativeVault", CONSERVATIVE_VAULT);
    const aggressiveVault = await hre.ethers.getContractAt("AggressiveVault", AGGRESSIVE_VAULT);

    // 1. Check User Tier
    console.log("\n1️⃣  Checking User Tier...");
    const tier = await referralManager.getUserTier(deployer.address);
    const tierNames = ["Novice", "Scout", "Captain", "Whale"];
    console.log(`User Tier: ${tier} (${tierNames[tier]})`);

    // 2. Check Minimum Deposit via Vault
    console.log("\n2️⃣  Checking Minimum Deposit (Conservative Vault)...");
    const minDeposit = await conservativeVault.getMinimumDeposit(deployer.address);
    console.log(`Minimum Deposit: ${hre.ethers.formatUnits(minDeposit, 6)} USDC`);

    // Verify against expected
    const expectedMin = tier >= 2 ? "2000.0" : "500.0"; // Captain+ = 2000, else 500
    if (hre.ethers.formatUnits(minDeposit, 6) === expectedMin) {
        console.log("✅ Minimum deposit matches expected tier requirement");
    } else {
        console.log("❌ Minimum deposit mismatch!");
        console.log(`Expected: ${expectedMin}, Got: ${hre.ethers.formatUnits(minDeposit, 6)}`);
    }

    // 3. Check Aggressive Vault Access
    console.log("\n3️⃣  Checking Aggressive Vault Access...");
    try {
        const canDeposit = await aggressiveVault.canDeposit(deployer.address);
        console.log(`Can deposit into Aggressive Vault: ${canDeposit}`);

        if (tier < 2 && !canDeposit) {
            console.log("✅ Access correctly restricted (Tier < Captain)");
        } else if (tier >= 2 && canDeposit) {
            console.log("✅ Access correctly granted (Tier >= Captain)");
        } else {
            console.log("❌ Access control mismatch!");
        }
    } catch (error) {
        console.log("⚠️  Could not check Aggressive Vault access directly (function might be internal or named differently)");
    }

    console.log("\n✅ Verification Complete!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
