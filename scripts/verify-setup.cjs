const hre = require("hardhat");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n🔍 Verifying Deployment Setup\n");
    console.log("═══════════════════════════════════════════════════════\n");

    const MOCK_USDC = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";
    const CONSERVATIVE_VAULT = "0x3942d923E5Ad84763cdCfe531c8B33031a3a81C3";
    const STRATEGY_CONTROLLER = "0x7a5F8a5CFcAe4ebFE003B97a97A1d7f1aAD60d66";
    const USER = "0x72377a60870E3d2493F871FA5792a1160518fcc6";

    // Check Vault
    console.log("📦 Checking Conservative Vault...");
    const vault = await hre.ethers.getContractAt("ConservativeVault", CONSERVATIVE_VAULT);
    const vaultAsset = await vault.asset();
    const vaultStrategyController = await vault.strategyController();
    
    console.log("  Asset:", vaultAsset);
    console.log("  Correct USDC?", vaultAsset.toLowerCase() === MOCK_USDC.toLowerCase() ? "✅" : "❌");
    console.log("  Strategy Controller:", vaultStrategyController);
    console.log("  Correct SC?", vaultStrategyController.toLowerCase() === STRATEGY_CONTROLLER.toLowerCase() ? "✅" : "❌");

    // Check Strategy Controller
    console.log("\n🎮 Checking Strategy Controller...");
    const sc = await hre.ethers.getContractAt("StrategyController", STRATEGY_CONTROLLER);
    const strategyCount = await sc.strategyCount();
    console.log("  Strategy Count:", strategyCount.toString());

    if (strategyCount > 0) {
        console.log("\n  Registered Strategies:");
        for (let i = 0; i < strategyCount; i++) {
            const strategy = await sc.strategies(i);
            console.log(`    Strategy ${i}:`);
            console.log(`      Type: ${strategy.strategyType}`);
            console.log(`      Adapter: ${strategy.adapter}`);
            console.log(`      Active: ${strategy.isActive ? "✅" : "❌"}`);
        }
    } else {
        console.log("  ❌ No strategies registered!");
    }

    // Check User USDC
    console.log("\n💰 Checking User Balance & Allowance...");
    const ERC20_ABI = [
        "function balanceOf(address) view returns (uint256)",
        "function allowance(address, address) view returns (uint256)"
    ];
    const usdc = await hre.ethers.getContractAt(ERC20_ABI, MOCK_USDC);
    const userBalance = await usdc.balanceOf(USER);
    const userAllowance = await usdc.allowance(USER, CONSERVATIVE_VAULT);
    
    console.log("  User Balance:", hre.ethers.formatUnits(userBalance, 6), "USDC");
    console.log("  Allowance to Vault:", hre.ethers.formatUnits(userAllowance, 6), "USDC");

    // Try a deposit simulation
    console.log("\n🧪 Testing Deposit (read-only simulation)...");
    try {
        const depositAmount = hre.ethers.parseUnits("500", 6); // $500
        
        // Check if user has enough balance
        if (userBalance < depositAmount) {
            console.log("  ❌ Insufficient balance");
            console.log(`     Need: ${hre.ethers.formatUnits(depositAmount, 6)} USDC`);
            console.log(`     Have: ${hre.ethers.formatUnits(userBalance, 6)} USDC`);
            return;
        }

        // Check if user has enough allowance
        if (userAllowance < depositAmount) {
            console.log("  ❌ Insufficient allowance");
            console.log(`     Need: ${hre.ethers.formatUnits(depositAmount, 6)} USDC`);
            console.log(`     Have: ${hre.ethers.formatUnits(userAllowance, 6)} USDC`);
            console.log("     User needs to approve more USDC to the vault");
            return;
        }

        // Try to call deposit (staticCall = read-only simulation)
        const shares = await vault.deposit.staticCall(depositAmount, USER);
        console.log("  ✅ Deposit simulation PASSED!");
        console.log(`     Would receive: ${hre.ethers.formatUnits(shares, 6)} shares`);
        
    } catch (error) {
        console.log("  ❌ Deposit simulation FAILED!");
        console.log("     Error:", error.message);
        
        // Try to decode error
        if (error.data) {
            console.log("     Error data:", error.data);
        }
    }

    console.log("\n═══════════════════════════════════════════════════════");
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

