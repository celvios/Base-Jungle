const hre = require("hardhat");

async function main() {
    const vaultAddress = "0x0fFc833fBaa8f567695a0cd640BD4009FF3dC841";
    console.log(`💰 Calculating Profits for Vault: ${vaultAddress}`);

    const Vault = await hre.ethers.getContractAt("BaseVault", vaultAddress);
    const controllerAddress = await Vault.strategyController();
    const Controller = await hre.ethers.getContractAt("StrategyController", controllerAddress);

    const strategyCount = await Controller.strategyCount();

    let totalAllocatedSum = 0n;
    let totalCurrentValueSum = 0n;

    console.log("\n📊 Strategy Performance Breakdown:");
    console.log("--------------------------------------------------------------------------------");
    console.log(String("ID").padEnd(4) + String("Type").padEnd(18) + String("Allocated (USDC)").padEnd(20) + String("Current (USDC)").padEnd(20) + String("Profit").padEnd(20));
    console.log("--------------------------------------------------------------------------------");

    for (let i = 0; i < strategyCount; i++) {
        const strategy = await Controller.strategies(i);

        if (!strategy.isActive) continue;

        const allocations = strategy.totalAllocated;

        // Get current value from adapter
        const Adapter = await hre.ethers.getContractAt("IStrategyAdapter", strategy.adapter);
        let currentValue = 0n;
        try {
            currentValue = await Adapter.balanceOf();
        } catch (e) {
            console.log(`⚠️  Error reading balance for Strategy #${i}: ${e.message}`);
            continue;
        }

        const profit = currentValue - allocations;

        // Formatting
        const typeName = getStrategyTypeName(Number(strategy.strategyType));
        const allocStr = hre.ethers.formatUnits(allocations, 6);
        const currStr = hre.ethers.formatUnits(currentValue, 6);
        const profitStr = hre.ethers.formatUnits(profit, 6);

        // Colorize profit
        const profitDisplay = Number(profitStr) >= 0 ? `+${profitStr}` : profitStr;

        console.log(
            String(i).padEnd(4) +
            String(typeName).padEnd(18) +
            String(allocStr).padEnd(20) +
            String(currStr).padEnd(20) +
            String(profitDisplay).padEnd(20)
        );

        totalAllocatedSum += allocations;
        totalCurrentValueSum += currentValue;
    }

    console.log("--------------------------------------------------------------------------------");

    const totalProfit = totalCurrentValueSum - totalAllocatedSum;
    console.log(`\n💵 Total Funds Allocated: ${hre.ethers.formatUnits(totalAllocatedSum, 6)} USDC`);
    console.log(`💎 Current Total Value:  ${hre.ethers.formatUnits(totalCurrentValueSum, 6)} USDC`);
    console.log(`📈 NET PROFIT:           ${hre.ethers.formatUnits(totalProfit, 6)} USDC`);
}

function getStrategyTypeName(typeId) {
    const types = [
        "LENDING",           // 0
        "LEVERAGED_LENDING", // 1
        "LP_STABLE",         // 2
        "LP_VOLATILE",       // 3
        "VAULT_BEEFY",       // 4
        "LEVERAGED_LP",      // 5
        "GAUGE_FARMING"      // 6
    ];
    return types[typeId] || "UNKNOWN";
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
