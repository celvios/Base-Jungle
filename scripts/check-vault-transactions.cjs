const hre = require("hardhat");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n🔍 Checking Vault Transactions...\n");

    const VAULT = "0xE5C6c43be0ce921a751C8aC705E2D3b95A24C06d";
    const USER = "0x72377a60870E3d2493F871FA5792a1160518fcc6";
    const MOCK_USDC = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";

    console.log("🏦 Vault:", VAULT);
    console.log("👤 User:", USER);

    // Check vault balance
    const vault = await hre.ethers.getContractAt("SimpleTestVault", VAULT);
    const usdc = await hre.ethers.getContractAt(
        ["function balanceOf(address) view returns (uint256)"],
        MOCK_USDC
    );

    const userShares = await vault.balanceOf(USER);
    const vaultUSDC = await usdc.balanceOf(VAULT);
    const totalAssets = await vault.totalAssets();

    console.log("\n📊 Current Balances:");
    console.log("  User Shares:", hre.ethers.formatEther(userShares));
    console.log("  Vault USDC:", hre.ethers.formatUnits(vaultUSDC, 6), "USDC");
    console.log("  Total Assets:", hre.ethers.formatUnits(totalAssets, 6), "USDC");

    if (userShares === 0n) {
        console.log("\n❌ User has NO shares in this vault!");
        console.log("   Either deposit failed or hasn't been made yet.");
    } else {
        console.log("\n✅ User HAS shares!");
        
        // Check if convertToAssets works
        try {
            const assets = await vault.convertToAssets(userShares);
            console.log("  Shares convert to:", hre.ethers.formatUnits(assets, 6), "USDC");
        } catch (error) {
            console.log("  ❌ convertToAssets failed:", error.message);
        }
    }

    // Check vault bytecode to verify it's the right contract
    const code = await hre.ethers.provider.getCode(VAULT);
    console.log("\n🔧 Vault deployed:", code.length > 100 ? "✅ Yes" : "❌ No");
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

