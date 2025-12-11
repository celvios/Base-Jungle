const hre = require("hardhat");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n💰 Checking Your Balance...\n");

    const VAULT = "0xDffCeFEE4C9005bbe3bd2Ffc1c3b1Bb0a0A68387";
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
    
    const alloc0 = await sc.userAllocations(USER, 0);
    const alloc1 = await sc.userAllocations(USER, 1);
    
    console.log("\n📊 Strategy Allocations:");
    console.log("   LENDING (70%):", hre.ethers.formatUnits(alloc0, 6), "USDC");
    console.log("   BEEFY (30%):", hre.ethers.formatUnits(alloc1, 6), "USDC");
    console.log("   Total:", hre.ethers.formatUnits(alloc0 + alloc1, 6), "USDC");

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

