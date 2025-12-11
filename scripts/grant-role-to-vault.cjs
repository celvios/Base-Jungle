const hre = require("hardhat");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n🔐 Granting VAULT_ROLE to ConservativeVault...\n");

    const STRATEGY_CONTROLLER = "0xa412EB221364Cc0891ad9215be7353cE0a1a2486";
    const CONSERVATIVE_VAULT = "0x7916Ea0bA5F9638fA3dD3BCD4DBD2b60f716cbFa";

    const sc = await hre.ethers.getContractAt(
        ["function grantRole(bytes32 role, address account)", "function hasRole(bytes32 role, address account) view returns (bool)"],
        STRATEGY_CONTROLLER
    );

    // The role hash from the error
    const VAULT_ROLE = "0x73e573f9566d61418a34d5de3ff49360f9c51fec37f7486551670290f6285dab";
    
    console.log("🔑 Role Hash:", VAULT_ROLE);
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
    }

    console.log("\n🎉 Try depositing again!");
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

