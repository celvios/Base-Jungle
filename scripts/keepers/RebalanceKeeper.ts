import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { getCurrentGasPrice, isGasPriceAcceptable, getETHPrice } from './utils/gas';
import { getKeeperWallet } from './utils/contracts';
import config from './config/keepers.json';

dotenv.config();

/**
 * RebalanceKeeper - Monitor leveraged positions and rebalance when health factor drifts
 */

// LeverageManager ABI (simplified)
const LEVERAGE_MANAGER_ABI = [
    'function getHealthFactor(address user) external view returns (uint256)',
    'function getPositionHealth(address user) external view returns (uint256 healthFactor, uint256 collateralValue, uint256 borrowValue, uint256 availableToBorrow, bool isHealthy)',
    'function rebalance(address user) external',
    'function positions(address user) external view returns (address user, uint256 initialDeposit, uint256 totalDeposited, uint256 totalBorrowed, uint256 currentLeverage, uint256 timestamp, bool active)'
];

interface LeveragedPosition {
    user: string;
    healthFactor: number;
    collateralValue: bigint;
    borrowValue: bigint;
    isHealthy: boolean;
}

export class RebalanceKeeper {
    private leverageManagerAddress: string;
    private leverageManager: ethers.Contract;
    private trackedUsers: string[];

    // Health factor thresholds (in basis points)
    private readonly DANGER_THRESHOLD = 1.3; // Below 1.3 = danger
    private readonly EMERGENCY_THRESHOLD = 1.2; // Below 1.2 = emergency
    private readonly INEFFICIENT_THRESHOLD = 2.0; // Above 2.0 = inefficient

    constructor() {
        this.leverageManagerAddress = config.contracts.leverageManager;
        const wallet = getKeeperWallet();
        this.leverageManager = new ethers.Contract(
            this.leverageManagerAddress,
            LEVERAGE_MANAGER_ABI,
            wallet
        );

        // In production, fetch from database or blockchain
        this.trackedUsers = [];
    }

    /**
     * Main rebalance logic - check all leveraged positions
     */
    async run(): Promise<void> {
        console.log('\n⚖️  RebalanceKeeper starting...\n');

        // Check gas price
        const gasAcceptable = await isGasPriceAcceptable(50);
        if (!gasAcceptable) {
            const gasPrice = await getCurrentGasPrice();
            const gasPriceGwei = Number(ethers.formatUnits(gasPrice.standard, 'gwei'));
            console.log(`⛽ Gas price too high: ${gasPriceGwei.toFixed(2)} gwei`);
            console.log('⏭️  Skipping rebalance cycle\n');
            return;
        }

        try {
            const positions = await this.getAllPositions();

            if (positions.length === 0) {
                console.log('ℹ️  No active leveraged positions to monitor\n');
                return;
            }

            console.log(`📊 Monitoring ${positions.length} leveraged positions\n`);

            // Sort by health factor (lowest first = most urgent)
            positions.sort((a, b) => a.healthFactor - b.healthFactor);

            for (const position of positions) {
                await this.checkAndRebalancePosition(position);
            }

            console.log('✅ RebalanceKeeper completed\n');
        } catch (error) {
            console.error('❌ RebalanceKeeper error:', error);
        }
    }

    /**
     * Get all active leveraged positions
     */
    private async getAllPositions(): Promise<LeveragedPosition[]> {
        const positions: LeveragedPosition[] = [];

        for (const userAddress of this.trackedUsers) {
            try {
                const positionData = await this.leverageManager.positions(userAddress);

                if (!positionData.active) continue;

                const healthData = await this.leverageManager.getPositionHealth(userAddress);

                const healthFactor = Number(healthData.healthFactor) / 10000; // Convert from basis points

                positions.push({
                    user: userAddress,
                    healthFactor,
                    collateralValue: healthData.collateralValue,
                    borrowValue: healthData.borrowValue,
                    isHealthy: healthData.isHealthy
                });
            } catch (error) {
                console.error(`Error fetching position for ${userAddress}:`, error);
            }
        }

        return positions;
    }

    /**
     * Check and rebalance a specific position if needed
     */
    private async checkAndRebalancePosition(position: LeveragedPosition): Promise<void> {
        console.log(`\n👤 User: ${position.user.slice(0, 10)}...`);
        console.log(`   Health Factor: ${position.healthFactor.toFixed(2)}x`);
        console.log(`   Collateral: ${ethers.formatEther(position.collateralValue)} USDC`);
        console.log(`   Borrowed: ${ethers.formatEther(position.borrowValue)} USDC`);

        // Determine urgency
        let shouldRebalance = false;
        let urgency = '';

        if (position.healthFactor < this.EMERGENCY_THRESHOLD) {
            shouldRebalance = true;
            urgency = '🚨 EMERGENCY';
            console.log(`   ${urgency} - HF < ${this.EMERGENCY_THRESHOLD}`);
        } else if (position.healthFactor < this.DANGER_THRESHOLD) {
            shouldRebalance = true;
            urgency = '⚠️  DANGER';
            console.log(`   ${urgency} - HF < ${this.DANGER_THRESHOLD}`);
        } else if (position.healthFactor > this.INEFFICIENT_THRESHOLD) {
            shouldRebalance = true;
            urgency = '💡 INEFFICIENT';
            console.log(`   ${urgency} - HF > ${this.INEFFICIENT_THRESHOLD}`);
        } else {
            console.log('   ✅ Healthy - no action needed');
            return;
        }

        if (!shouldRebalance) return;

        try {
            console.log(`   🚀 Executing rebalance...`);

            const tx = await this.leverageManager.rebalance(position.user, {
                gasLimit: 500000 // Conservative estimate
            });

            console.log(`   📤 Transaction sent: ${tx.hash}`);

            const receipt = await tx.wait(2);

            if (receipt && receipt.status === 1) {
                console.log(`   ✅ Rebalance successful! Block: ${receipt.blockNumber}`);

                // Check new health factor
                const newHealthData = await this.leverageManager.getPositionHealth(position.user);
                const newHF = Number(newHealthData.healthFactor) / 10000;
                console.log(`   📈 New Health Factor: ${newHF.toFixed(2)}x`);
            } else {
                console.log('   ❌ Rebalance failed');
            }
        } catch (error) {
            console.error(`   ❌ Error rebalancing:`, error);
        }
    }

    /**
     * Add user to tracking list
     */
    addUser(userAddress: string): void {
        if (!this.trackedUsers.includes(userAddress)) {
            this.trackedUsers.push(userAddress);
        }
    }

    /**
     * Get summary of all positions
     */
    async getSummary(): Promise<void> {
        const positions = await this.getAllPositions();

        const emergency = positions.filter(p => p.healthFactor < this.EMERGENCY_THRESHOLD);
        const danger = positions.filter(p => p.healthFactor < this.DANGER_THRESHOLD && p.healthFactor >= this.EMERGENCY_THRESHOLD);
        const healthy = positions.filter(p => p.healthFactor >= this.DANGER_THRESHOLD && p.healthFactor <= this.INEFFICIENT_THRESHOLD);
        const inefficient = positions.filter(p => p.healthFactor > this.INEFFICIENT_THRESHOLD);

        console.log('\n📊 Position Summary:');
        console.log(`   Total: ${positions.length}`);
        console.log(`   🚨 Emergency (HF < 1.2): ${emergency.length}`);
        console.log(`   ⚠️  Danger (HF < 1.3): ${danger.length}`);
        console.log(`   ✅ Healthy: ${healthy.length}`);
        console.log(`   💡 Inefficient (HF > 2.0): ${inefficient.length}\n`);
    }
}

// Run if called directly
if (require.main === module) {
    const keeper = new RebalanceKeeper();
    keeper.run().catch(console.error);
}
