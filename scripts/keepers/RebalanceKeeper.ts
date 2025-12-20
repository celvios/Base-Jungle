import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { getCurrentGasPrice, isGasPriceAcceptable, getETHPrice } from './utils/gas';
import { getKeeperWallet } from './utils/contracts';
import config from './config/keepers.json';

// Load environment with error handling
try {
    dotenv.config();
} catch (error) {
    console.warn('⚠️ Failed to load .env file:', error);
}

// Sanitize address for logging
function sanitizeAddress(address: string): string {
    if (!address || typeof address !== 'string') return '[INVALID]';
    return address.replace(/[\r\n\t]/g, '').slice(0, 42);
}

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
    healthFactor: bigint; // Use bigint for precision
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

        // Initialize tracked users from environment or database
        this.trackedUsers = this.loadTrackedUsers();
        
        if (this.trackedUsers.length === 0) {
            console.warn('⚠️ No users to track. Add users via addUser() method.');
        }
    }

    private loadTrackedUsers(): string[] {
        // Load from environment variable or return empty array
        const envUsers = process.env.TRACKED_USERS;
        if (envUsers) {
            return envUsers.split(',').map(addr => addr.trim()).filter(addr => ethers.isAddress(addr));
        }
        return [];
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

        positions.sort((a, b) => {
            const aHF = Number(a.healthFactor) / 10000;
            const bHF = Number(b.healthFactor) / 10000;
            return aHF - bHF; // Lowest first = most urgent
        });

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
        if (this.trackedUsers.length === 0) {
            return [];
        }

        // Use Promise.all for concurrent blockchain calls
        const positionPromises = this.trackedUsers.map(async (userAddress) => {
            try {
                const [positionData, healthData] = await Promise.all([
                    this.leverageManager.positions(userAddress),
                    this.leverageManager.getPositionHealth(userAddress)
                ]);

                if (!positionData.active) return null;

                return {
                    user: userAddress,
                    healthFactor: healthData.healthFactor,
                    collateralValue: healthData.collateralValue,
                    borrowValue: healthData.borrowValue,
                    isHealthy: healthData.isHealthy
                };
            } catch (error) {
                console.error(`Error fetching position for ${sanitizeAddress(userAddress)}:`, error?.message || error);
                return null;
            }
        });

        const results = await Promise.all(positionPromises);
        return results.filter((position): position is LeveragedPosition => position !== null);
    }

    /**
     * Check and rebalance a specific position if needed
     */
    private async checkAndRebalancePosition(position: LeveragedPosition): Promise<void> {
        const sanitizedUser = sanitizeAddress(position.user);
        const healthFactorNum = Number(position.healthFactor) / 10000; // Convert from basis points
        
        console.log(`\n👤 User: ${sanitizedUser}`);
        console.log(`   Health Factor: ${healthFactorNum.toFixed(2)}x`);
        console.log(`   Collateral: ${ethers.formatEther(position.collateralValue)} USDC`);
        console.log(`   Borrowed: ${ethers.formatEther(position.borrowValue)} USDC`);

        // Determine urgency
        let shouldRebalance = false;
        let urgency = '';

        if (healthFactorNum < this.EMERGENCY_THRESHOLD) {
            shouldRebalance = true;
            urgency = '🚨 EMERGENCY';
            console.log(`   ${urgency} - HF < ${this.EMERGENCY_THRESHOLD}`);
        } else if (healthFactorNum < this.DANGER_THRESHOLD) {
            shouldRebalance = true;
            urgency = '⚠️  DANGER';
            console.log(`   ${urgency} - HF < ${this.DANGER_THRESHOLD}`);
        } else if (healthFactorNum > this.INEFFICIENT_THRESHOLD) {
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

            // Estimate gas dynamically
            const gasEstimate = await this.leverageManager.rebalance.estimateGas(position.user);
            const gasLimit = gasEstimate + (gasEstimate * 20n / 100n); // Add 20% buffer

            const tx = await this.leverageManager.rebalance(position.user, {
                gasLimit
            });

            console.log(`   📤 Transaction sent: ${tx.hash}`);

            const REQUIRED_CONFIRMATIONS = 2;
            const receipt = await tx.wait(REQUIRED_CONFIRMATIONS);

            if (receipt && receipt.status === 1) {
                console.log(`   ✅ Rebalance successful! Block: ${receipt.blockNumber}`);

                // Check new health factor
                const newHealthData = await this.leverageManager.getPositionHealth(position.user);
                const newHF = Number(newHealthData.healthFactor) / 10000;
                console.log(`   📈 New Health Factor: ${newHF.toFixed(2)}x`);
            } else {
                console.log('   ❌ Rebalance failed');
            }
        } catch (error: any) {
            // Enhanced error handling
            if (error?.code === 'INSUFFICIENT_FUNDS') {
                console.error(`   ❌ Insufficient funds for gas`);
            } else if (error?.code === 'UNPREDICTABLE_GAS_LIMIT') {
                console.error(`   ❌ Transaction would fail - contract revert`);
            } else if (error?.code === 'NETWORK_ERROR') {
                console.error(`   ❌ Network error - retrying later`);
            } else {
                console.error(`   ❌ Error rebalancing:`, error?.message || error);
            }
        }
    }

    /**
     * Add user to tracking list
     */
    addUser(userAddress: string): void {
        // Validate address
        if (!ethers.isAddress(userAddress)) {
            throw new Error(`Invalid Ethereum address: ${userAddress}`);
        }
        
        if (!this.trackedUsers.includes(userAddress)) {
            this.trackedUsers.push(userAddress);
            console.log(`➕ Added user to tracking: ${sanitizeAddress(userAddress)}`);
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
