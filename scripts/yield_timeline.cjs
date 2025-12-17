const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("⏳ BUILDING YIELD TIMELINE...");

    const deploymentData = JSON.parse(fs.readFileSync("./deployed-addresses-sepolia.json", "utf8"));
    const USDC_ADDRESS = "0x634c1cf5129fC7bd49736b9684375E112e4000E1";

    // Strategies to check
    const strategies = [
        { name: "Lending (Novice)", address: deploymentData.strategies.LENDING },
        { name: "Beefy (Novice)", address: deploymentData.strategies.VAULT_BEEFY },
        // Add others if needed
    ];

    const usdc = await ethers.getContractAt([
        "event Transfer(address indexed from, address indexed to, uint256 value)"
    ], USDC_ADDRESS);

    const currentBlock = await ethers.provider.getBlockNumber();
    const startBlock = Math.max(0, currentBlock - 250000); // Check last ~5 days

    console.log(`   Scanning last 250k blocks (${startBlock} to ${currentBlock})...`);

    let allEvents = [];

    for (const strat of strategies) {
        if (!strat.address) continue;
        console.log(`   Scanning ${strat.name}: ${strat.address}`);

        const filter = usdc.filters.Transfer(null, strat.address);
        const events = await usdc.queryFilter(filter, startBlock, currentBlock);

        for (const e of events) {
            const block = await e.getBlock();
            allEvents.push({
                time: new Date(block.timestamp * 1000),
                amount: Number(ethers.formatUnits(e.args.value, 6)),
                strategy: strat.name,
                txHash: e.transactionHash
            });
        }
    }

    // Sort by time
    allEvents.sort((a, b) => a.time - b.time);

    console.log("\nYield Event Log:");
    console.log("───────────────────────────────────────────────────────");
    allEvents.forEach(e => {
        console.log(`[${e.time.toLocaleString()}] +$${e.amount.toFixed(2)} to ${e.strategy}`);
    });
    console.log("───────────────────────────────────────────────────────");
}

main().catch(console.error);
