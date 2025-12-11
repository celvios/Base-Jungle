const hre = require("hardhat");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n🔍 Verifying Strategy Allocation...\n");

    const STRATEGY_CONTROLLER = "0xa412EB221364Cc0891ad9215be7353cE0a1a2486";
    const LENDING_STRATEGY = "0xA95cE14be6c44293067C31f322cD7663d36756d2";
    const BEEFY_STRATEGY = "0x0C2ea68834A2Ab4472E56eF38dACf23df8221429";
    const VAULT = "0x7916Ea0bA5F9638fA3dD3BCD4DBD2b60f716cbFa";
    const USER = "0x72377a60870E3d2493F871FA5792a1160518fcc6";

    // Check strategy balances
    const lendingStrategy = await hre.ethers.getContractAt("MockStrategy", LENDING_STRATEGY);
    const beefyStrategy = await hre.ethers.getContractAt("MockStrategy", BEEFY_STRATEGY);

    const lendingBalance = await lendingStrategy.balanceOf();
    const beefyBalance = await beefyStrategy.balanceOf();

    console.log("📊 Strategy Balances:");
    console.log("   LENDING (70%):", hre.ethers.formatUnits(lendingBalance, 6), "USDC");
    console.log("   BEEFY (30%):", hre.ethers.formatUnits(beefyBalance, 6), "USDC");
    console.log("   Total in Strategies:", hre.ethers.formatUnits(lendingBalance + beefyBalance, 6), "USDC");

    // Check user allocations in StrategyController
    const sc = await hre.ethers.getContractAt("StrategyController", STRATEGY_CONTROLLER);
    
    const userAlloc0 = await sc.userAllocations(USER, 0);
    const userAlloc1 = await sc.userAllocations(USER, 1);

    console.log("\n📊 User Allocations in StrategyController:");
    console.log("   Strategy 0 (LENDING):", hre.ethers.formatUnits(userAlloc0, 6), "USDC");
    console.log("   Strategy 1 (BEEFY):", hre.ethers.formatUnits(userAlloc1, 6), "USDC");
    console.log("   Total Allocated:", hre.ethers.formatUnits(userAlloc0 + userAlloc1, 6), "USDC");

    // Check vault shares
    const vault = await hre.ethers.getContractAt("ConservativeVault", VAULT);
    const userShares = await vault.balanceOf(USER);

    console.log("\n💎 User Vault Shares:");
    console.log("   Shares:", hre.ethers.formatUnits(userShares, 18));

    // Verify the split
    const total = lendingBalance + beefyBalance;
    if (total > 0n) {
        const lendingPercent = (Number(lendingBalance) * 100) / Number(total);
        const beefyPercent = (Number(beefyBalance) * 100) / Number(total);
        
        console.log("\n✅ Allocation Check:");
        console.log("   LENDING:", lendingPercent.toFixed(1) + "%", "(should be 70%)");
        console.log("   BEEFY:", beefyPercent.toFixed(1) + "%", "(should be 30%)");
        
        if (Math.abs(lendingPercent - 70) < 1 && Math.abs(beefyPercent - 30) < 1) {
            console.log("\n🎉 PERFECT! Allocation is correct!");
        } else {
            console.log("\n⚠️  Allocation is off from target 70/30 split");
        }
    } else {
        console.log("\n⚠️  No funds in strategies yet");
    }
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

