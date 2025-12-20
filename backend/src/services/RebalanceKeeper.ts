import { ethers } from 'ethers';

// Sanitize address for logging
function sanitizeAddress(address: string): string {
    if (!address || typeof address !== 'string') return '[INVALID]';
    return address.replace(/[\r\n\t]/g, '').slice(0, 42);
}

// LeverageManager ABI (simplified)
const LEVERAGE_MANAGER_ABI = [
    'function getHealthFactor(address user) external view returns (uint256)',
    'function getPositionHealth(address user) external view returns (uint256 healthFactor, uint256 collateralValue, uint256 borrowValue, uint256 availableToBorrow, bool isHealthy)',
    'function rebalance(address user) external',
    'function positions(address user) external view returns (address user, uint256 initialDeposit, uint256 totalDeposited, uint256 totalBorrowed, uint256 currentLeverage, uint256 timestamp, bool active)'
];

interface LeveragedPosition {
    user: string;
    healthFactor: bigint;
    collateralValue: bigint;
    borrowValue: bigint;
    isHealthy: boolean;
}

export class RebalanceKeeper {
    private leverageManager: ethers.Contract;
    private trackedUsers: string[];
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;

    // Health factor thresholds
    private readonly DANGER_THRESHOLD = 1.3;
    private readonly EMERGENCY_THRESHOLD = 1.2;
    private readonly INEFFICIENT_THRESHOLD = 2.0;

    constructor() {
        const rpcUrl = process.env.RPC_URL || process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
        this.provider = new ethers.JsonRpcProvider(rpcUrl);

        const pk = process.env.KEEPER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
        if (!pk) {
            throw new Error("No private key found for RebalanceKeeper");
        }

        this.wallet = new ethers.Wallet(pk, this.provider);

        // Use a default address or from env
        const leverageManagerAddress = process.env.LEVERAGE_MANAGER_ADDRESS || '0x0000000000000000000000000000000000000000';
        this.leverageManager = new ethers.Contract(
            leverageManagerAddress,
            LEVERAGE_MANAGER_ABI,
            this.wallet
        );

        this.trackedUsers = this.loadTrackedUsers();
    }

    private loadTrackedUsers(): string[] {
        const envUsers = process.env.TRACKED_USERS;
        if (envUsers) {
            return envUsers.split(',').map(addr => addr.trim()).filter(addr => ethers.isAddress(addr));
        }
        return [];
    }

    async run(): Promise<void> {
        console.log('\n⚖️  RebalanceKeeper starting...\n');

        // Simple gas check
        const feeData = await this.provider.getFeeData();
        if (feeData.gasPrice && feeData.gasPrice > ethers.parseUnits("100", "gwei")) {
            console.log("⛽ Gas price too high, skipping rebalance cycle");
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
            positions.sort((a, b) => {
                const aHF = Number(a.healthFactor) / 10000;
                const bHF = Number(b.healthFactor) / 10000;
                return aHF - bHF;
            });

            for (const position of positions) {
                await this.checkAndRebalancePosition(position);
            }

            console.log('✅ RebalanceKeeper completed\n');
        } catch (error) {
            console.error('❌ RebalanceKeeper error:', error);
        }
    }

    private async getAllPositions(): Promise<LeveragedPosition[]> {
        if (this.trackedUsers.length === 0) {
            return [];
        }

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
                console.error(`Error fetching position for ${sanitizeAddress(userAddress)}:`, error);
                return null;
            }
        });

        const results = await Promise.all(positionPromises);
        return results.filter((position): position is LeveragedPosition => position !== null);
    }

    private async checkAndRebalancePosition(position: LeveragedPosition): Promise<void> {
        const sanitizedUser = sanitizeAddress(position.user);
        const healthFactorNum = Number(position.healthFactor) / 10000;
        
        console.log(`\n👤 User: ${sanitizedUser}`);
        console.log(`   Health Factor: ${healthFactorNum.toFixed(2)}x`);

        let shouldRebalance = false;
        let urgency = '';

        if (healthFactorNum < this.EMERGENCY_THRESHOLD) {
            shouldRebalance = true;
            urgency = '🚨 EMERGENCY';
        } else if (healthFactorNum < this.DANGER_THRESHOLD) {
            shouldRebalance = true;
            urgency = '⚠️  DANGER';
        } else if (healthFactorNum > this.INEFFICIENT_THRESHOLD) {
            shouldRebalance = true;
            urgency = '💡 INEFFICIENT';
        } else {
            console.log('   ✅ Healthy - no action needed');
            return;
        }

        if (!shouldRebalance) return;

        try {
            console.log(`   🚀 Executing rebalance... (${urgency})`);

            const tx = await this.leverageManager.rebalance(position.user);
            console.log(`   📤 Transaction sent: ${tx.hash}`);

            const receipt = await tx.wait(2);
            if (receipt && receipt.status === 1) {
                console.log(`   ✅ Rebalance successful! Block: ${receipt.blockNumber}`);
            } else {
                console.log('   ❌ Rebalance failed');
            }
        } catch (error: any) {
            console.error(`   ❌ Error rebalancing:`, error?.message || error);
        }
    }

    addUser(userAddress: string): void {
        if (!ethers.isAddress(userAddress)) {
            throw new Error(`Invalid Ethereum address: ${userAddress}`);
        }
        
        if (!this.trackedUsers.includes(userAddress)) {
            this.trackedUsers.push(userAddress);
            console.log(`➕ Added user to tracking: ${sanitizeAddress(userAddress)}`);
        }
    }
}