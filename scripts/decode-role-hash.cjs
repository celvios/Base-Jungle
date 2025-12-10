const hre = require("hardhat");

async function main() {
    const roleHash = "0x73e573f9566d61418a34d5de3ff49360f9c51fec37f7486551670290f6285dab";
    
    console.log("\n🔍 Decoding Role Hash...\n");
    console.log("Role Hash:", roleHash);
    
    // Calculate common role hashes
    const roles = [
        "VAULT_ROLE",
        "KEEPER_ROLE",
        "STRATEGY_ADMIN_ROLE",
        "ADMIN_ROLE",
        "MINTER_ROLE",
        "DEFAULT_ADMIN_ROLE"
    ];
    
    for (const roleName of roles) {
        const hash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes(roleName));
        console.log(`${roleName}:`, hash);
        if (hash.toLowerCase() === roleHash.toLowerCase()) {
            console.log(`\n✅ MATCH! The role is: ${roleName}`);
        }
    }
    
    // Also check if it's DEFAULT_ADMIN_ROLE (0x00...00)
    if (roleHash === "0x0000000000000000000000000000000000000000000000000000000000000000") {
        console.log("\n✅ This is DEFAULT_ADMIN_ROLE");
    }
}

main()
    .then(() => process.exit(0))
    .catch(console.error);

