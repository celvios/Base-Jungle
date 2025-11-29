import { ethers, Contract } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

// Type definitions
interface PriceQuote {
    dex: string;
    dexAddress: string;
    price: number;
    liquidity: number;
}

interface ArbitrageOpportunity {
    tokenIn: string;
    swapPath: string[];
    dexAddresses: string[];
    flashLoanAmount: bigint;
    estimatedProfit: bigint;
    deadline: number;
}

interface DEXConfig {
    name: string;
    address: string;
    quoter?: string;
}

/**
 * ArbitrageKeeper - Automated arbitrage bot
 * Monitors prices across DEXs and executes profitable flash loan arbitrages
 */
export class ArbitrageKeeper {
    private provider: ethers.Provider;
    private wallet: ethers.Wallet;
    private strategy: Contract;
    private dexAggregator: Contract;

    // Configuration
    private readonly CHECK_INTERVAL_MS = 5000; // Check every 5 seconds
    private readonly MIN_PROFIT_USD = 10; // Minimum $10 profit
    private readonly MAX_GAS_PRICE_GWEI = 100;

    // Trading pairs to monitor
    private readonly PAIRS = [
        { tokenA: process.env.USDC_ADDRESS!, tokenB: process.env.WETH_ADDRESS!, symbol: 'USDC/WETH' },
        { tokenA: process.env.USDC_ADDRESS!, tokenB: process.env.DAI_ADDRESS!, symbol: 'USDC/DAI' },
        { tokenA: process.env.WETH_ADDRESS!, tokenB: process.env.WBTC_ADDRESS!, symbol: 'WETH/WBTC' },
    ];

    // DEX configurations
    private readonly DEXES: DEXConfig[] = [
        { name: 'Aerodrome', address: process.env.AERODROME_ROUTER! },
        { name: 'UniswapV3', address: process.env.UNISWAP_V3_ROUTER! },
    ];

    // Statistics
    private stats = {
        opportunitiesFound: 0,
        arbitragesExecuted: 0,
        totalProfit: BigInt(0),
        failedExecutions: 0,
    };

    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        this.wallet = new ethers.Wallet(process.env.KEEPER_PRIVATE_KEY!, this.provider);

        // Initialize contracts
        const strategyABI = require('../artifacts/contracts/strategies/ArbitrageStrategy.sol/ArbitrageStrategy.json').abi;
        const aggregatorABI = require('../artifacts/contracts/defi/DEXAggregator.sol/DEXAggregator.json').abi;

        this.strategy = new Contract(process.env.ARBITRAGE_STRATEGY_ADDRESS!, strategyABI, this.wallet);
        this.dexAggregator = new Contract(process.env.DEX_AGGREGATOR_ADDRESS!, aggregatorABI, this.provider);
    }

    /**
     * Start the arbitrage keeper
     */
    async start() {
        console.log('🤖 Starting Arbitrage Keeper...');
        console.log(`   Wallet: ${this.wallet.address}`);
        console.log(`   Strategy: ${await this.strategy.getAddress()}`);
        console.log(`   Check interval: ${this.CHECK_INTERVAL_MS}ms`);
        console.log('');

        // Main monitoring loop
        setInterval(async () => {
            try {
                await this.scanForArbitrages();
            } catch (error) {
                console.error('Error in scan loop:', error);
            }
        }, this.CHECK_INTERVAL_MS);

        // Print stats every minute
        setInterval(() => {
            this.printStats();
        }, 60000);
    }

    /**
     * Scan all trading pairs for arbitrage opportunities
     */
    private async scanForArbitrages() {
        for (const pair of this.PAIRS) {
            try {
                const opportunity = await this.findArbitrageOpportunity(
                    pair.tokenA,
                    pair.tokenB,
                    pair.symbol
                );

                if (opportunity) {
                    this.stats.opportunitiesFound++;
                    await this.executeArbitrage(opportunity, pair.symbol);
                }
            } catch (error: any) {
                // Silently continue - most errors are just "no opportunity"
                if (error.message && !error.message.includes('No arbitrage')) {
                    console.error(`Error scanning ${pair.symbol}:`, error.message);
                }
            }
        }
    }

    /**
     * Find arbitrage opportunity for a token pair
     */
    private async findArbitrageOpportunity(
        tokenA: string,
        tokenB: string,
        symbol: string
    ): Promise<ArbitrageOpportunity | null> {
        const testAmount = ethers.parseUnits('1000', 6); // Test with $1000

        // Get quotes from all DEXs
        const quotes: PriceQuote[] = [];

        for (const dex of this.DEXES) {
            try {
                let quote: bigint;

                if (dex.name === 'Aerodrome') {
                    quote = await this.dexAggregator.getAerodromeQuote(
                        tokenA,
                        tokenB,
                        testAmount,
                        false // volatile pool
                    );
                } else if (dex.name === 'UniswapV3') {
                    quote = await this.dexAggregator.getUniswapQuote(
                        tokenA,
                        tokenB,
                        testAmount
                    );
                } else {
                    continue;
                }

                quotes.push({
                    dex: dex.name,
                    dexAddress: dex.address,
                    price: Number(quote) / Number(testAmount),
                    liquidity: 1000000, // TODO: Get real liquidity
                });
            } catch (error) {
                // Quote failed, skip this DEX
                continue;
            }
        }

        if (quotes.length < 2) {
            return null; // Need at least 2 DEXs to arbitrage
        }

        // Find price difference
        const sortedQuotes = quotes.sort((a, b) => a.price - b.price);
        const buyDEX = sortedQuotes[0]; // Lowest price (buy here)
        const sellDEX = sortedQuotes[sortedQuotes.length - 1]; // Highest price (sell here)

        const priceDiff = ((sellDEX.price - buyDEX.price) / buyDEX.price) * 100;

        // Need >0.5% difference to cover fees and be profitable
        if (priceDiff < 0.5) {
            return null;
        }

        // Calculate optimal flash loan amount
        const flashLoanAmount = this.calculateOptimalLoanAmount(
            buyDEX.liquidity,
            sellDEX.liquidity,
            priceDiff

        );

        // Estimate profit
        const rawProfit = (flashLoanAmount * BigInt(Math.floor(priceDiff * 100))) / BigInt(10000);

        // Subtract estimated fees
        const dexFees = (flashLoanAmount * BigInt(30)) / BigInt(10000); // 0.3% DEX fees
        const estimatedProfit = rawProfit - dexFees;

        // Check if profitable
        const minProfit = ethers.parseUnits(this.MIN_PROFIT_USD.toString(), 6);
        if (estimatedProfit < minProfit) {
            return null;
        }

        // Build swap path: tokenA -> tokenB -> tokenA
        const swapPath = [tokenA, tokenB, tokenA];
        const dexAddresses = [buyDEX.dexAddress, sellDEX.dexAddress];

        return {
            tokenIn: tokenA,
            swapPath,
            dexAddresses,
            flashLoanAmount,
            estimatedProfit,
            deadline: Math.floor(Date.now() / 1000) + 300, // 5 min deadline
        };
    }

    /**
     * Execute arbitrage opportunity
     */
    private async executeArbitrage(
        opportunity: ArbitrageOpportunity,
        symbol: string
    ) {
        console.log(`\n🎯 Arbitrage Opportunity Found!`);
        console.log(`   Pair: ${symbol}`);
        console.log(`   Flash Loan: $${Number(opportunity.flashLoanAmount) / 1e6}`);
        console.log(`   Est. Profit: $${Number(opportunity.estimatedProfit) / 1e6}`);
        console.log(`   Route: ${opportunity.dexAddresses.map((_, i) => this.DEXES[i]?.name || 'Unknown').join(' -> ')}`);

        try {
            // Check gas price
            const feeData = await this.provider.getFeeData();
            const gasPriceGwei = Number(feeData.gasPrice) / 1e9;

            if (gasPriceGwei > this.MAX_GAS_PRICE_GWEI) {
                console.log(`   ⚠️  Gas too high (${gasPriceGwei.toFixed(1)} gwei), skipping`);
                return;
            }

            // Simulate first to check profitability
            const [profitable, netProfit] = await this.strategy.simulateArbitrage(opportunity);

            if (!profitable) {
                console.log(`   ❌ Not profitable after gas simulation`);
                return;
            }

            console.log(`   ✅ Simulation passed, executing...`);

            // Execute arbitrage
            const tx = await this.strategy.executeArbitrage(opportunity, {
                gasLimit: 500000,
            });

            console.log(`   📝 TX submitted: ${tx.hash}`);

            const receipt = await tx.wait();

            if (receipt.status === 1) {
                // Parse profit from events
                const event = receipt.logs.find((log: any) => {
                    try {
                        const parsed = this.strategy.interface.parseLog(log);
                        return parsed?.name === 'ArbitrageExecuted';
                    } catch {
                        return false;
                    }
                });

                if (event) {
                    const parsed = this.strategy.interface.parseLog(event);
                    const profit = parsed?.args?.profit || BigInt(0);

                    this.stats.arbitragesExecuted++;
                    this.stats.totalProfit += profit;

                    console.log(`   ✅ Success! Profit: $${Number(profit) / 1e6}`);
                    console.log(`   ⛽ Gas used: ${receipt.gasUsed.toString()}`);
                }
            } else {
                this.stats.failedExecutions++;
                console.log(`   ❌ Transaction failed`);
            }
        } catch (error: any) {
            this.stats.failedExecutions++;
            console.error(`   ❌ Execution error:`, error.message);
        }
    }

    /**
     * Calculate optimal flash loan amount
     */
    private calculateOptimalLoanAmount(
        buyLiquidity: number,
        sellLiquidity: number,
        priceDiff: number
    ): bigint {
        // Use 30% of smaller liquidity
        const maxLoan = Math.min(buyLiquidity, sellLiquidity) * 0.3;

        // Scale by price difference (smaller diff = smaller loan)
        const optimalLoan = maxLoan * Math.min(priceDiff / 2, 1);

        return ethers.parseUnits(Math.floor(optimalLoan).toString(), 6);
    }

    /**
     * Print statistics
     */
    private printStats() {
        console.log('\n📊 Arbitrage Keeper Statistics');
        console.log(`   Opportunities found: ${this.stats.opportunitiesFound}`);
        console.log(`   Executions: ${this.stats.arbitragesExecuted}`);
        console.log(`   Failed: ${this.stats.failedExecutions}`);
        console.log(`   Total profit: $${Number(this.stats.totalProfit) / 1e6}`);
        console.log(`   Average profit: $${this.stats.arbitragesExecuted > 0 ? (Number(this.stats.totalProfit) / 1e6 / this.stats.arbitragesExecuted).toFixed(2) : '0'}`);
        console.log('');
    }
}

// Start keeper if run directly
if (require.main === module) {
    const keeper = new ArbitrageKeeper();
    keeper.start().catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
