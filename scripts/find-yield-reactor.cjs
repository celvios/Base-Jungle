const { ethers } = require("hardhat");

async function main() {
    const userAddress = "0x72377a60870E3d2493F871FA5792a1160518fcc6";
    const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    
    console.log("🔍 FINDING YIELD REACTOR CONTRACT...\n");
    
    // Get recent transactions
    const currentBlock = await provider.getBlockNumber();
    console.log(`Current block: ${currentBlock}`);
    
    // Check last 1000 blocks for transactions
    const fromBlock = currentBlock - 1000;
    
    try {
        // Get transaction history
        const filter = {
            fromBlock: fromBlock,
            toBlock: currentBlock,
            address: null // We'll check all addresses
        };
        
        console.log("Checking recent transactions...");
        
        // This is a simplified approach - in reality we'd need to check transaction logs
        // Let's check if there are any unknown contracts in your .env that might be the Yield Reactor
        
        console.log("\n💡 LIKELY YIELD REACTOR CONTRACTS:");
        console.log("Check your frontend code for the actual contract address");
        console.log("Or check Base Sepolia explorer for recent transactions from your wallet");
        console.log(`https://sepolia.basescan.org/address/${userAddress}`);
        
        console.log("\n🔧 TO FIX THE BOTS:");
        console.log("1. Find the Yield Reactor contract address");
        console.log("2. Update AllocationBot to listen to that contract's events");
        console.log("3. Update RebalanceKeeper to monitor that contract's positions");
        
    } catch (error) {
        console.error("Error:", error.message);
    }
}

main().catch(console.error);