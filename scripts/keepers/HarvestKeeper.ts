import { ethers } from 'ethers';
import dotenv from 'dotenv';
import {
    getCurrentGasPrice,
    isGasPriceAcceptable,
    getETHPrice
} from './utils/gas';
import {
    getAEROPrice,
    checkProfitability,
    formatProfitabilityReport
} from './utils/profitability';
import {
    getGaugeAdapterContract,
    estimateGas,
    waitForTransaction
} from './utils/contracts';
import config from './config/keepers.json';

dotenv.config();

/**
 * HarvestKeeper - Automatically harvest DeFi rewards when profitable
 */

export class HarvestKeeper {
    private gaugeAdapterAddress: string;
    private gauges: typeof config.gauges;
    private config: typeof config.keeper;

    constructor() {
        this.gaugeAdapterAddress = config.contracts.aerodromeGaugeAdapter;
        this.gauges = config.gauges;
        this.config = config.keeper;
    }

    /**
     * Main harvest logic - check all gauges and harvest if profitable
     */
    async run(): Promise<void> {
        console.log('\n🌾 HarvestKeeper starting...\n');

        // Check gas price first
        const gasAcceptable = await isGasPriceAcceptable(this.config.maxGasPriceGwei);
        if (!gasAcceptable) {
            const gasPrice = await getCurrentGasPrice();
            const gasPriceGwei = Number(ethers.formatUnits(gasPrice.standard, 'gwei'));
            console.log(`⛽ Gas price too high: ${gasPriceGwei.toFixed(2)} gwei (max: ${this.config.maxGasPriceGwei})`);
            console.log('⏭️  Skipping harvest cycle\n');
            return;
        }

        try {
            const [aeroPrice, ethPrice] = await Promise.all([
                getAEROPrice(),
                getETHPrice()
            ]);

            console.log(`💰 AERO Price: $${aeroPrice.toFixed(4)}`);
            console.log(`💰 ETH Price: $${ethPrice.toFixed(2)}\n`);

            for (const gauge of this.gauges) {
                await this.checkAndHarvestGauge(gauge, aeroPrice, ethPrice);
            }

            console.log('✅ HarvestKeeper completed\n');
        } catch (error) {
            console.error('❌ HarvestKeeper error:', error);
        }
    }

    /**
     * Check and harvest a specific gauge if profitable
     */
    private async checkAndHarvestGauge(
        gauge: typeof config.gauges[0],
        aeroPrice: number,
        ethPrice: number
    ): Promise<void> {
        console.log(`\n📊 Checking gauge: ${gauge.name}`);
        console.log(`   Address: ${gauge.address}`);

        try {
            const gaugeAdapter = getGaugeAdapterContract(this.gaugeAdapterAddress);

            // Get pending rewards
            const pendingRewards = await gaugeAdapter.getPendingRewards(
                gauge.address,
                this.gaugeAdapterAddress
            );

            console.log(`   Pending AERO: ${ethers.formatEther(pendingRewards)}`);

            if (pendingRewards === BigInt(0)) {
                console.log('   ⏭️  No rewards to harvest');
                return;
            }

            // Estimate gas for harvest
            const estimatedGas = await estimateGas(
                gaugeAdapter,
                'compound',
                [gauge.address]
            );

            // Get current gas price
            const gasPrice = await getCurrentGasPrice();

            // Check profitability
            const profitCheck = checkProfitability(
                pendingRewards,
                aeroPrice,
                estimatedGas,
                gasPrice.standard,
                ethPrice,
                this.config.profitabilityThreshold
            );

            console.log(formatProfitabilityReport(profitCheck));

            if (!profitCheck.isProfitable) {
                console.log('   ⏭️  Not profitable, skipping harvest');
                return;
            }

            if (profitCheck.rewardValueUSD < this.config.minHarvestValueUSD) {
                console.log(`   ⏭️  Reward too small ($${profitCheck.rewardValueUSD.toFixed(2)} < $${this.config.minHarvestValueUSD})`);
                return;
            }

            // Execute harvest
            console.log('   🚀 Executing harvest...');
            const tx = await gaugeAdapter.compound(gauge.address, {
                gasLimit: estimatedGas
            });

            console.log(`   📤 Transaction sent: ${tx.hash}`);

            const receipt = await waitForTransaction(tx);

            if (receipt && receipt.status === 1) {
                console.log(`   ✅ Harvest successful! Block: ${receipt.blockNumber}`);
                console.log(`   💰 Net profit: $${profitCheck.netProfitUSD.toFixed(2)}`);
            } else {
                console.log('   ❌ Harvest failed');
            }
        } catch (error) {
            console.error(`   ❌ Error harvesting ${gauge.name}:`, error);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const keeper = new HarvestKeeper();
    keeper.run().catch(console.error);
}
