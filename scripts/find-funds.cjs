const { ethers } = require("hardhat");

async function main() {
    const userAddress = "0x72377a60870E3d2493F871FA5792a1160518fcc6";
    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    
    console.log("🔍 CHECKING ALL CONTRACTS FOR $59K FUNDS...\n");
    
    // All possible contract addresses
    const contracts = {
        "Conservative Vault": "0x986ca22e9f0A6104AAdea7C2698317A690045D13",
        "Aggressive Vault": "0x7eD340313599090b25fA1F6F21671FE0210808E8", 
        "Strategy Controller": "0x65CD6764A4f574c1F6154518519925277C6CFF81",
        "Referral Manager": "0xc8A84e0BF9a4C213564e858A89c8f14738aD0f15",
        "Points Tracker": "0x3dEDE79F6aD12973e723e67071F17e5C42A93173",
        "Treasury Manager": "0x1F03650dB0917A0db88b7eE3aFCe2b057b4728D9",
        "Governance Token": "0x5253Bedd8A1b01f4613c2318fAB6930669B93054",
        "Token Sale": "0xf809b18B34A4065693d70593f5c59B13A73f2229",
        "DEX Aggregator": "0xCc549266fFa7E66086E62177c88cbDe47b23ECD7",
        "Arbitrage Strategy": "0x831369355009b828C03B824B561c8FF75bA7c371",
        "Leverage Manager": "0xe8AF6281B5E130548078f3C46B4dB0e97EBC7dbC"
    };
    
    const balanceABI = ["function balanceOf(address) view returns (uint256)"];
    
    for (const [name, address] of Object.entries(contracts)) {
        try {
            const contract = new ethers.Contract(address, balanceABI, provider);
            const balance = await contract.balanceOf(userAddress);
            
            if (balance > 0) {
                console.log(`✅ ${name}: ${ethers.formatEther(balance)} tokens`);
            } else {
                console.log(`❌ ${name}: 0 tokens`);
            }
        } catch (error) {
            console.log(`⚠️  ${name}: Cannot check (${error.message.split(' ')[0]})`);
        }
    }
    
    // Check Strategy Controller allocations
    console.log("\n🎯 CHECKING STRATEGY CONTROLLER ALLOCATIONS...");
    try {
        const strategyController = new ethers.Contract(
            contracts["Strategy Controller"],
            [
                "function userAllocations(address user, uint256 strategyId) view returns (uint256)",
                "function strategyCount() view returns (uint256)"
            ],
            provider
        );
        
        const strategyCount = await strategyController.strategyCount();
        console.log(`📊 Total Strategies: ${strategyCount}`);
        
        let totalAllocated = 0n;
        for (let i = 0; i < strategyCount; i++) {
            const allocation = await strategyController.userAllocations(userAddress, i);
            if (allocation > 0) {
                console.log(`   Strategy ${i}: ${ethers.formatEther(allocation)} USDC`);
                totalAllocated += allocation;
            }
        }
        
        if (totalAllocated > 0) {
            console.log(`✅ TOTAL ALLOCATED: ${ethers.formatEther(totalAllocated)} USDC`);
        } else {
            console.log(`❌ NO ALLOCATIONS FOUND IN STRATEGY CONTROLLER`);
        }
        
    } catch (error) {
        console.log(`❌ Strategy Controller check failed: ${error.message}`);
    }
    
    console.log("\n🤖 BOT TRACKING STATUS:");
    console.log("AllocationBot: Monitors ReferralManager for TierUpgraded events");
    console.log("RebalanceKeeper: Monitors LeverageManager for position health");
    console.log("\n💡 If funds are in a different contract, bots won't see them!");
}

main().catch(console.error);