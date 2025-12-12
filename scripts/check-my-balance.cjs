const hre = require("hardhat");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n💰 Checking Your Balance...\n");

    const VAULT = "0x0fFc833fBaa8f567695a0cd640BD4009FF3dC841";
    const USER = "0x72377a60870E3d2493F871FA5792a1160518fcc6";
    const MOCK_USDC = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";

    // Check vault shares
    const vault = await hre.ethers.getContractAt("ConservativeVault", VAULT);
    const shares = await vault.balanceOf(USER);
    console.log("📊 Vault Shares:", hre.ethers.formatUnits(shares, 18));

    // Get totalAssets and totalSupply
    const totalAssets = await vault.totalAssets();
    const totalSupply = await vault.totalSupply();
    console.log("📊 Total Assets in Vault:", hre.ethers.formatUnits(totalAssets, 6), "USDC");
    console.log("📊 Total Supply:", hre.ethers.formatUnits(totalSupply, 18), "shares");

    // Convert to assets
    if (shares > 0n) {
        const assets = await vault.convertToAssets(shares);
        console.log("💵 Your Value in USDC:", hre.ethers.formatUnits(assets, 6), "USDC");
    }

    // Check strategy allocations - get from deployed-addresses
    const fs = require("fs");
    const deploymentData = JSON.parse(fs.readFileSync("./deployed-addresses-sepolia.json", "utf8"));
    const STRATEGY_CONTROLLER = deploymentData.contracts.strategyController;
    const sc = await hre.ethers.getContractAt("StrategyController", STRATEGY_CONTROLLER);
    
    // Check ALL 6 strategy allocations
    const STRATEGY_NAMES = ["LENDING", "LP_STABLE", "LP_VOLATILE", "LEVERAGED_LP", "VAULT_BEEFY", "ARBITRAGE"];
    
    console.log("\n📊 Strategy Allocations:");
    let totalAlloc = 0n;
    
    for (let i = 0; i < 6; i++) {
        const alloc = await sc.userAllocations(USER, i);
        const allocNum = Number(hre.ethers.formatUnits(alloc, 6));
        totalAlloc += alloc;
        
        if (alloc > 0n) {
            console.log(`   ${STRATEGY_NAMES[i]}: $${allocNum.toFixed(2)} USDC`);
        }
    }
    
    console.log("   ─────────────────");
    console.log("   Total Allocated:", hre.ethers.formatUnits(totalAlloc, 6), "USDC");

    // Check remaining USDC
    const usdc = await hre.ethers.getContractAt(
        ["function balanceOf(address) view returns (uint256)"],
        MOCK_USDC
    );
    const remaining = await usdc.balanceOf(USER);
    console.log("\n💰 Remaining USDC in wallet:", hre.ethers.formatUnits(remaining, 6), "USDC");
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

