// Simple ArbitrageKeeper for testing
// Run with: node SimpleArbitrageKeeper.js

require('dotenv').config({ path: '.env.arbitrage' });
const { ethers } = require('ethers');

// Configuration
const RPC_URL = process.env.RPC_URL || 'https://sepolia.base.org';
const STRATEGY_ADDRESS = process.env.ARBITRAGE_STRATEGY_ADDRESS;
const DEX_AGGREGATOR_ADDRESS = process.env.DEX_AGGREGATOR_ADDRESS;
const KEEPER_PRIVATE_KEY = process.env.KEEPER_PRIVATE_KEY;

const USDC = process.env.USDC_ADDRESS;
const WETH = process.env.WETH_ADDRESS;
const DAI = process.env.DAI_ADDRESS;

const CHECK_INTERVAL_MS = parseInt(process.env.CHECK_INTERVAL_MS) || 5000;
const MIN_PROFIT_USD = parseInt(process.env.MIN_PROFIT_USD) || 5;

// Stats
let stats = {
    checksPerformed: 0,
    opportunitiesFound: 0,
    executionsAttempted: 0,
    successfulTrades: 0,
    failedTrades: 0
};

async function main() {
    console.log('🤖 Starting Simple Arbitrage Keeper...\n');

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(KEEPER_PRIVATE_KEY, provider);

    console.log('📊 Configuration:');
    console.log('   Wallet:', wallet.address);
    console.log('   Strategy:', STRATEGY_ADDRESS);
    console.log('   DEX Aggregator:', DEX_AGGREGATOR_ADDRESS);
    console.log('   Check interval:', CHECK_INTERVAL_MS, 'ms');
    console.log('   Min profit:', `$${MIN_PROFIT_USD}`);
    console.log('');

    // Load contract ABIs (simplified)
    const strategyABI = [
        'function executeArbitrage((address,address[],address[],uint256,uint256,uint256)) external returns (bool,uint256)',
        'function simulateArbitrage((address,address[],address[],uint256,uint256,uint256)) external view returns (bool,uint256)',
        'function getStatistics() external view returns (uint256,uint256,uint256,uint256,uint256)',
        'function paused() external view returns (bool)'
    ];

    const aggregatorABI = [
        'function getAerodromeQuote(address,address,uint256,bool) external view returns (uint256)',
        'function getUniV3Quote(address,address,uint256) external returns (uint256)'
    ];

    const strategy = new ethers.Contract(STRATEGY_ADDRESS, strategyABI, wallet);
    const dexAggregator = new ethers.Contract(DEX_AGGREGATOR_ADDRESS, aggregatorABI, provider);

    console.log('✅ Keeper bot initialized!\n');
    console.log('🔍 Starting price monitoring...\n');

    // Main monitoring loop
    setInterval(async () => {
        try {
            stats.checksPerformed++;

            // Check if strategy is paused
            const isPaused = await strategy.paused();
            if (isPaused) {
                console.log('⚠️  Strategy is paused, skipping check');
                return;
            }

            // Scan for opportunities
            await scanForArbitrage(dexAggregator, strategy);

        } catch (error) {
            console.error('❌ Error in check cycle:', error.message);
        }
    }, CHECK_INTERVAL_MS);

    // Print stats every minute
    setInterval(() => {
        printStats();
    }, 60000);
}

async function scanForArbitrage(dexAggregator, strategy) {
    const pairs = [
        { tokenA: USDC, tokenB: WETH, symbol: 'USDC/WETH' },
        { tokenA: USDC, tokenB: DAI, symbol: 'USDC/DAI' },
    ];

    for (const pair of pairs) {
        try {
            const testAmount = ethers.parseUnits('1000', 6); // $1000 test

            // Get quotes from both DEXs
            let aeroQuote, uniQuote;

            try {
                aeroQuote = await dexAggregator.getAerodromeQuote(
                    pair.tokenA,
                    pair.tokenB,
                    testAmount,
                    false // volatile
                );
            } catch (e) {
                aeroQuote = 0n;
            }

            try {
                uniQuote = await dexAggregator.getUniV3Quote(
                    pair.tokenA,
                    pair.tokenB,
                    testAmount
                );
            } catch (e) {
                uniQuote = 0n;
            }

            if (aeroQuote === 0n && uniQuote === 0n) {
                // No liquidity
                continue;
            }

            // Calculate price difference
            const aeroPrice = Number(aeroQuote) / Number(testAmount);
            const uniPrice = Number(uniQuote) / Number(testAmount);

            if (aeroPrice === 0 || uniPrice === 0) continue;

            const priceDiff = Math.abs((aeroPrice - uniPrice) / Math.min(aeroPrice, uniPrice)) * 100;

            if (priceDiff > 0.5) {
                console.log(`\n🎯 Potential Opportunity Found!`);
                console.log(`   Pair: ${pair.symbol}`);
                console.log(`   Aerodrome price: ${aeroPrice.toFixed(6)}`);
                console.log(`   Uniswap price: ${uniPrice.toFixed(6)}`);
                console.log(`   Difference: ${priceDiff.toFixed(2)}%`);

                stats.opportunitiesFound++;

                // Note: On testnet, we likely won't execute due to low liquidity
                // This is just for testing the monitoring logic
                console.log(`   ℹ️  Testnet - skipping execution (low liquidity expected)`);
            }

        } catch (error) {
            // Silently continue - most errors are just "no liquidity"
            if (error.message && !error.message.includes('No liquidity')) {
                console.error(`   Error scanning ${pair.symbol}:`, error.message);
            }
        }
    }
}

function printStats() {
    console.log('\n═══════════════════════════════════════');
    console.log('📊 Arbitrage Keeper Statistics');
    console.log('═══════════════════════════════════════');
    console.log(`Checks performed: ${stats.checksPerformed}`);
    console.log(`Opportunities found: ${stats.opportunitiesFound}`);
    console.log(`Executions attempted: ${stats.executionsAttempted}`);
    console.log(`Successful trades: ${stats.successfulTrades}`);
    console.log(`Failed trades: ${stats.failedTrades}`);
    console.log('═══════════════════════════════════════\n');
}

// Handle errors
process.on('unhandledRejection', (error) => {
    console.error('Unhandled error:', error);
});

// Start the keeper
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
