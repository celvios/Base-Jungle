const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking Keeper Role Permissions...\n");

    const keeperAddress = "0x72377a60870E3d2493F871FA5792a1160518fcc6";
    const STRATEGY_CONTROLLER_ADDRESS = "0x65CD6764A4f574c1F6154518519925277C6CFF81";

    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    
    const strategyController = new ethers.Contract(
        STRATEGY_CONTROLLER_ADDRESS,
        [
            "function hasRole(bytes32 role, address account) external view returns (bool)",
            "function KEEPER_ROLE() external view returns (bytes32)"
        ],
        provider
    );

    try {
        // Get KEEPER_ROLE hash
        const keeperRole = await strategyController.KEEPER_ROLE();
        console.log("🔑 KEEPER_ROLE hash:", keeperRole);

        // Check if keeper has role
        const hasRole = await strategyController.hasRole(keeperRole, keeperAddress);
        console.log(`👤 Keeper: ${keeperAddress}`);
        console.log(`✅ Has KEEPER_ROLE: ${hasRole}`);

        if (!hasRole) {
            console.log("\n❌ KEEPER ROLE NOT GRANTED");
            console.log("💡 You need to grant KEEPER_ROLE to your wallet:");
            console.log(`   strategyController.grantRole(KEEPER_ROLE, "${keeperAddress}")`);
            console.log("\n🤖 This is why the AllocationBot can't rebalance automatically");
        } else {
            console.log("\n✅ KEEPER ROLE GRANTED");
            console.log("🤖 AllocationBot should be able to rebalance automatically");
        }

    } catch (error) {
        console.error("❌ Error checking role:", error.message);
    }
}

main().catch(console.error);