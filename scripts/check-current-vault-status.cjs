const hre = require("hardhat");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n🔍 Checking Current Vault Status...\n");

    const STRATEGY_CONTROLLER = "0xa412EB221364Cc0891ad9215be7353cE0a1a2486";
    const CONSERVATIVE_VAULT = "0x7916Ea0bA5F9638fA3dD3BCD4DBD2b60f716cbFa";

    const sc = await hre.ethers.getContractAt("StrategyController", STRATEGY_CONTROLLER);

    // Check if VAULT_ROLE exists
    try {
        const VAULT_ROLE = await sc.VAULT_ROLE();
        console.log("✅ VAULT_ROLE exists:", VAULT_ROLE);
        
        // Check if vault has the role
        const hasRole = await sc.hasRole(VAULT_ROLE, CONSERVATIVE_VAULT);
        console.log("\n📊 ConservativeVault has VAULT_ROLE?", hasRole ? "✅ YES" : "❌ NO");
        
        if (!hasRole) {
            console.log("\n🔧 Granting VAULT_ROLE...");
            const [deployer] = await hre.ethers.getSigners();
            const grantTx = await sc.grantRole(VAULT_ROLE, CONSERVATIVE_VAULT);
            await grantTx.wait();
            console.log("✅ Role granted!");
            
            // Verify
            const hasRoleAfter = await sc.hasRole(VAULT_ROLE, CONSERVATIVE_VAULT);
            console.log("After: Has role?", hasRoleAfter ? "✅ YES" : "❌ NO");
        }
    } catch (error) {
        console.log("❌ VAULT_ROLE doesn't exist on deployed contract");
        console.log("   Error:", error.message);
        console.log("\n⚠️  You need to redeploy StrategyController with VAULT_ROLE!");
    }
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

