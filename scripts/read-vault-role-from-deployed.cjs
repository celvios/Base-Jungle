const hre = require("hardhat");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n🔍 Reading VAULT_ROLE from deployed StrategyController...\n");

    const STRATEGY_CONTROLLER = "0xa412EB221364Cc0891ad9215be7353cE0a1a2486";
    const VAULT = "0x7916Ea0bA5F9638fA3dD3BCD4DBD2b60f716cbFa";

    const sc = await hre.ethers.getContractAt(
        [
            "function VAULT_ROLE() view returns (bytes32)",
            "function hasRole(bytes32 role, address account) view returns (bool)"
        ],
        STRATEGY_CONTROLLER
    );

    console.log("🎮 StrategyController:", STRATEGY_CONTROLLER);
    console.log("🏦 Vault:", VAULT);

    // Try to read VAULT_ROLE constant
    try {
        const vaultRole = await sc.VAULT_ROLE();
        console.log("\n✅ VAULT_ROLE EXISTS on deployed contract!");
        console.log("   Value:", vaultRole);
        
        // Check if vault has this role
        const hasRole = await sc.hasRole(vaultRole, VAULT);
        console.log("\n📊 Vault has VAULT_ROLE?", hasRole ? "✅ YES" : "❌ NO");
        
        // Also check with the error hash
        const errorRoleHash = "0x73e573f9566d61418a34d5de3ff49360f9c51fec37f7486551670290f6285dab";
        const hasErrorRole = await sc.hasRole(errorRoleHash, VAULT);
        console.log("📊 Vault has ERROR role hash?", hasErrorRole ? "✅ YES" : "❌ NO");
        
        if (vaultRole === errorRoleHash) {
            console.log("\n✅ Role hashes MATCH!");
        } else {
            console.log("\n❌ Role hashes DON'T MATCH!");
            console.log("   Deployed VAULT_ROLE:", vaultRole);
            console.log("   Error role hash:    ", errorRoleHash);
        }
        
    } catch (error) {
        console.log("\n❌ VAULT_ROLE doesn't exist on deployed contract");
        console.log("   This means the code was compiled without VAULT_ROLE");
        console.log("   But the error shows it's checking for VAULT_ROLE!");
        console.log("   Error:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

