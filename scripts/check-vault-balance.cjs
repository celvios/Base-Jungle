const hre = require("hardhat");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n🔍 Checking Vault Balance...\n");

    const VAULT = "0xE5C6c43be0ce921a751C8aC705E2D3b95A24C06d";
    const USER = "0x72377a60870E3d2493F871FA5792a1160518fcc6";
    const MOCK_USDC = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";

    const vault = await hre.ethers.getContractAt("SimpleTestVault", VAULT);
    const usdc = await hre.ethers.getContractAt(
        ["function balanceOf(address) view returns (uint256)"],
        MOCK_USDC
    );

    console.log("📊 User:", USER);
    console.log("🏦 Vault:", VAULT);
    
    // Check user's share balance
    const shares = await vault.balanceOf(USER);
    console.log("\n💎 User's Vault Shares:", hre.ethers.formatEther(shares));

    // Check vault's USDC balance
    const vaultUSDC = await usdc.balanceOf(VAULT);
    console.log("💰 Vault's USDC Balance:", hre.ethers.formatUnits(vaultUSDC, 6), "USDC");

    // Check total assets
    const totalAssets = await vault.totalAssets();
    console.log("📈 Total Assets in Vault:", hre.ethers.formatUnits(totalAssets, 6), "USDC");

    // Check user's USDC balance
    const userUSDC = await usdc.balanceOf(USER);
    console.log("\n💵 User's USDC Balance:", hre.ethers.formatUnits(userUSDC, 6), "USDC");
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

