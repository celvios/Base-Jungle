const hre = require("hardhat");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n🔐 Granting VAULT_ROLE to vaults...\n");

    const STRATEGY_CONTROLLER = "0x48C9310b3139dD5b8D9c05B24B56539c56C27F91";
    const CONSERVATIVE_VAULT = "0xd77a3a8714224a2d7575c6327ecC17009C13A9Dd";
    const AGGRESSIVE_VAULT = "0x365998eB082FE6f273A3d087161d69e9D51BAf1d";

    const [signer] = await hre.ethers.getSigners();
    console.log("📝 Signer:", signer.address);

    const sc = await hre.ethers.getContractAt("StrategyController", STRATEGY_CONTROLLER);

    // Get VAULT_ROLE
    const VAULT_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("VAULT_ROLE"));
    console.log("🔑 VAULT_ROLE:", VAULT_ROLE);

    // Grant to Conservative Vault
    console.log("\n📦 Granting VAULT_ROLE to Conservative Vault...");
    const tx1 = await sc.grantRole(VAULT_ROLE, CONSERVATIVE_VAULT);
    await tx1.wait();
    console.log("✅ Granted!");

    // Grant to Aggressive Vault
    console.log("\n📦 Granting VAULT_ROLE to Aggressive Vault...");
    const tx2 = await sc.grantRole(VAULT_ROLE, AGGRESSIVE_VAULT);
    await tx2.wait();
    console.log("✅ Granted!");

    // Verify
    console.log("\n🔍 Verifying roles...");
    const hasRole1 = await sc.hasRole(VAULT_ROLE, CONSERVATIVE_VAULT);
    const hasRole2 = await sc.hasRole(VAULT_ROLE, AGGRESSIVE_VAULT);
    
    console.log("Conservative Vault has VAULT_ROLE:", hasRole1 ? "✅" : "❌");
    console.log("Aggressive Vault has VAULT_ROLE:", hasRole2 ? "✅" : "❌");

    console.log("\n🎉 Done! Try depositing again!");
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

