const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking Whale User Allocation Status...\n");

    const userAddress = "0x72377a60870E3d2493F871FA5792a1160518fcc6";
    
    // Contract addresses
    const REFERRAL_MANAGER_ADDRESS = "0xc8A84e0BF9a4C213564e858A89c8f14738aD0f15";
    const STRATEGY_CONTROLLER_ADDRESS = "0x65CD6764A4f574c1F6154518519925277C6CFF81";

    // Get provider and contracts
    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    
    const referralManager = new ethers.Contract(
        REFERRAL_MANAGER_ADDRESS,
        ["function getUserTier(address user) external view returns (uint8)"],
        provider
    );

    const strategyController = new ethers.Contract(
        STRATEGY_CONTROLLER_ADDRESS,
        [
            "function userAllocations(address user, uint256 strategyId) external view returns (uint256)",
            "function getUserTotalAllocated(address user) external view returns (uint256)",
            "function strategyCount() external view returns (uint256)"
        ],
        provider
    );

    try {
        // Check user tier
        const tier = await referralManager.getUserTier(userAddress);
        const tierNames = ["Novice", "Scout", "Captain", "Whale"];
        console.log(`👤 User: ${userAddress}`);
        console.log(`🎯 Tier: ${tierNames[tier]} (${tier})`);

        // Check total allocated
        const totalAllocated = await strategyController.getUserTotalAllocated(userAddress);
        console.log(`💰 Total Allocated: ${ethers.formatEther(totalAllocated)} USDC`);

        // Check individual strategy allocations
        const strategyCount = await strategyController.strategyCount();
        console.log(`\n📊 Strategy Allocations:`);
        
        for (let i = 0; i < strategyCount; i++) {
            const allocation = await strategyController.userAllocations(userAddress, i);
            if (allocation > 0) {
                console.log(`   Strategy ${i}: ${ethers.formatEther(allocation)} USDC`);
            }
        }

        if (totalAllocated === 0n) {
            console.log("\n❌ NO FUNDS ALLOCATED YET");
            console.log("💡 User needs to deposit funds first, then allocation will happen automatically");
        } else {
            console.log("\n✅ FUNDS ARE ALLOCATED");
            console.log("🤖 Bot system is working correctly");
        }

    } catch (error) {
        console.error("❌ Error checking allocation:", error.message);
    }
}

main().catch(console.error);