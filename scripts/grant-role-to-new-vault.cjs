const hre = require("hardhat");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n🔐 Granting VAULT_ROLE to NEW ConservativeVault...\n");

    const STRATEGY_CONTROLLER = "0x8F652a77FD1D5371ab1F64aE007458F68b74d13A";
    const CONSERVATIVE_VAULT = "0x31Dc3a8ABC30f8CC391fB0fBFd43E6cB3edE7Df0";

    const sc = await hre.ethers.getContractAt("StrategyController", STRATEGY_CONTROLLER);

    // Get VAULT_ROLE from deployed contract
    const VAULT_ROLE = await sc.VAULT_ROLE();
    console.log("🔑 VAULT_ROLE:", VAULT_ROLE);
    console.log("🏦 Vault:", CONSERVATIVE_VAULT);

    // Check if vault has role
    const hasRole = await sc.hasRole(VAULT_ROLE, CONSERVATIVE_VAULT);
    console.log("\nBefore: Vault has role?", hasRole ? "✅" : "❌");

    if (!hasRole) {
        console.log("\n📝 Granting role...");
        const tx = await sc.grantRole(VAULT_ROLE, CONSERVATIVE_VAULT);
        await tx.wait();
        console.log("✅ Role granted!");

        // Verify
        const hasRoleAfter = await sc.hasRole(VAULT_ROLE, CONSERVATIVE_VAULT);
        console.log("After: Vault has role?", hasRoleAfter ? "✅" : "❌");
    } else {
        console.log("\n✅ Vault already has VAULT_ROLE!");
    }

    console.log("\n🎉 Try depositing to:", CONSERVATIVE_VAULT);
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

