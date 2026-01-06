const { ethers } = require("hardhat");

async function main() {
    console.log("🤖 Testing Manual Rebalance for Whale User...\n");

    const userAddress = "0x72377a60870E3d2493F871FA5792a1160518fcc6";
    const STRATEGY_CONTROLLER_ADDRESS = "0x65CD6764A4f574c1F6154518519925277C6CFF81";

    // Get signer (your keeper wallet)
    const [signer] = await ethers.getSigners();
    console.log("🔑 Using keeper wallet:", signer.address);

    const strategyController = new ethers.Contract(
        STRATEGY_CONTROLLER_ADDRESS,
        ["function rebalance(address user) external"],
        signer
    );

    try {
        console.log(`🎯 Triggering rebalance for whale user: ${userAddress}`);
        
        // This is what the AllocationBot does when tier upgrades
        const tx = await strategyController.rebalance(userAddress);
        console.log(`📤 Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log("✅ REBALANCE SUCCESSFUL!");
            console.log(`📊 Block: ${receipt.blockNumber}`);
            console.log("\n🎉 Your $50k should now be allocated according to Whale tier:");
            console.log("   • 30% → Leveraged LP Strategy");
            console.log("   • 40% → Gauge Farming Strategy");
            console.log("   • 30% → Leveraged Lending Strategy");
        } else {
            console.log("❌ Transaction failed");
        }

    } catch (error) {
        console.error("❌ Rebalance failed:", error.message);
        
        if (error.message.includes("KEEPER_ROLE")) {
            console.log("💡 Need to grant KEEPER_ROLE to your wallet first");
        }
    }
}

main().catch(console.error);