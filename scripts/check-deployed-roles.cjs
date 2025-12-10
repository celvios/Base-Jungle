const hre = require("hardhat");
require("dotenv").config({ path: ".env.deployment" });

async function main() {
    console.log("\n🔍 Checking deployed StrategyController roles...\n");

    const STRATEGY_CONTROLLER = "0x48C9310b3139dD5b8D9c05B24B56539c56C27F91";

    // Try to read VAULT_ROLE from deployed contract
    const sc = await hre.ethers.getContractAt(
        [
            "function VAULT_ROLE() view returns (bytes32)",
            "function KEEPER_ROLE() view returns (bytes32)",
            "function STRATEGY_ADMIN_ROLE() view returns (bytes32)",
            "function hasRole(bytes32 role, address account) view returns (bool)",
            "function grantRole(bytes32 role, address account)"
        ],
        STRATEGY_CONTROLLER
    );

    try {
        const vaultRole = await sc.VAULT_ROLE();
        console.log("✅ VAULT_ROLE exists on deployed contract!");
        console.log("   Value:", vaultRole);
        
        // Check if vaults have this role
        const CONSERVATIVE_VAULT = "0xd77a3a8714224a2d7575c6327ecC17009C13A9Dd";
        const AGGRESSIVE_VAULT = "0x365998eB082FE6f273A3d087161d69e9D51BAf1d";
        
        const hasRole1 = await sc.hasRole(vaultRole, CONSERVATIVE_VAULT);
        const hasRole2 = await sc.hasRole(vaultRole, AGGRESSIVE_VAULT);
        
        console.log("\n📊 Role Status:");
        console.log("   Conservative Vault:", hasRole1 ? "✅ HAS ROLE" : "❌ NO ROLE");
        console.log("   Aggressive Vault:", hasRole2 ? "✅ HAS ROLE" : "❌ NO ROLE");
        
        if (!hasRole1 || !hasRole2) {
            console.log("\n🔧 Granting roles...");
            
            if (!hasRole1) {
                const tx1 = await sc.grantRole(vaultRole, CONSERVATIVE_VAULT);
                await tx1.wait();
                console.log("   ✅ Granted to Conservative Vault");
            }
            
            if (!hasRole2) {
                const tx2 = await sc.grantRole(vaultRole, AGGRESSIVE_VAULT);
                await tx2.wait();
                console.log("   ✅ Granted to Aggressive Vault");
            }
            
            console.log("\n✅ All roles granted!");
        } else {
            console.log("\n✅ All vaults already have VAULT_ROLE!");
        }
        
    } catch (error) {
        console.log("❌ VAULT_ROLE doesn't exist on deployed contract");
        console.log("   Error:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

