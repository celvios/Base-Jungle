const hre = require("hardhat");

async function main() {
    const vaultAddress = "0x0fFc833fBaa8f567695a0cd640BD4009FF3dC841";
    console.log(`🔍 Analyzing User Profits for Vault: ${vaultAddress}`);

    const Vault = await hre.ethers.getContractAt("BaseVault", vaultAddress);

    // 1. Get all Deposit and Withdrawal events with chunking
    const currentBlock = await hre.ethers.provider.getBlockNumber();
    // Look back ~500k blocks (approx 1 week on Base Sepolia) to be safe and efficient
    // Base Sepolia block time is ~2s. 500k blocks = ~1M seconds = ~11.5 days.
    // This covers the specific user's interaction from the prompt.
    const lookback = 500000;
    let fromBlock = Math.max(0, currentBlock - lookback);

    const CHUNK_SIZE = 50000;
    console.log(`📜 Querying events from block ${fromBlock} to ${currentBlock} in chunks of ${CHUNK_SIZE}...`);

    const deposits = [];
    const withdrawals = [];

    const depositFilter = Vault.filters.Deposited();
    const withdrawFilter = Vault.filters.Withdrawn();

    for (let i = fromBlock; i < currentBlock; i += CHUNK_SIZE) {
        const toBlock = Math.min(i + CHUNK_SIZE - 1, currentBlock);
        // console.log(`   Fetching ${i} -> ${toBlock}`);

        const dEvents = await Vault.queryFilter(depositFilter, i, toBlock);
        const wEvents = await Vault.queryFilter(withdrawFilter, i, toBlock);

        deposits.push(...dEvents);
        withdrawals.push(...wEvents);
    }

    console.log(`📊 Found ${deposits.length} deposits and ${withdrawals.length} withdrawals.`);

    // 2. Aggregate per user
    const userStats = {};

    // Process Deposits
    for (const event of deposits) {
        const { user, assets } = event.args;
        if (!userStats[user]) {
            userStats[user] = { deposited: 0n, withdrawn: 0n, shares: 0n };
        }
        userStats[user].deposited += assets;
    }

    // Process Withdrawals
    for (const event of withdrawals) {
        const { user, assets } = event.args;
        if (!userStats[user]) {
            userStats[user] = { deposited: 0n, withdrawn: 0n, shares: 0n };
        }
        userStats[user].withdrawn += assets;
    }

    // 3. Get Current Value and Calculate Profit
    console.log("\n💰 User Profit Analysis:");
    console.log("-----------------------------------------------------------------------------------------------------------------");
    console.log(
        String("User Address").padEnd(44) +
        String("Net Invested").padEnd(18) +
        String("Current Value").padEnd(18) +
        String("Total Profit").padEnd(18)
    );
    console.log("-----------------------------------------------------------------------------------------------------------------");

    let totalVaultProfit = 0n;

    for (const user of Object.keys(userStats)) {
        const shares = await Vault.balanceOf(user);
        const currentValue = await Vault.convertToAssets(shares);

        const stats = userStats[user];
        const netInvested = stats.deposited - stats.withdrawn;

        // Total Profit = Current Value - Net Invested
        const profit = currentValue - netInvested;

        const netInvestedStr = hre.ethers.formatUnits(netInvested, 6);
        const currentValueStr = hre.ethers.formatUnits(currentValue, 6);
        const profitStr = hre.ethers.formatUnits(profit, 6);

        // Colorize
        const profitDisplay = Number(profitStr) >= 0 ? `+${profitStr}` : profitStr;

        console.log(
            String(user).padEnd(44) +
            String(netInvestedStr).padEnd(18) +
            String(currentValueStr).padEnd(18) +
            String(profitDisplay).padEnd(18)
        );

        totalVaultProfit += profit;
    }

    console.log("-----------------------------------------------------------------------------------------------------------------");
    console.log(`📈 TOTAL VAULT PROFIT (Across All Users): ${hre.ethers.formatUnits(totalVaultProfit, 6)} USDC`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
