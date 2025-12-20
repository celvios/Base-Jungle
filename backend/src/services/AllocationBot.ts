import { ethers } from 'ethers';
import { pool } from '../database/connection.js';

const REFERRAL_MANAGER_ABI = [
    'event TierUpgraded(address indexed user, uint8 newTier)',
    'function getUserTier(address user) external view returns (uint8)'
];

const STRATEGY_CONTROLLER_ABI = [
    'function rebalance(address user) external',
    'function userAllocations(address user, uint256 strategyId) external view returns (uint256)'
];

// Sanitize address for logging
function sanitizeAddress(address: string): string {
    if (!address || typeof address !== 'string') return '[INVALID]';
    return address.replace(/[\r\n\t]/g, '').slice(0, 42); // Remove newlines and limit length
}

export class AllocationBot {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet; // Keeper wallet
    private referralManager: ethers.Contract;
    private strategyController: ethers.Contract;
    private isRunning: boolean = false;

    constructor() {
        const rpcUrl = process.env.RPC_URL || process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
        this.provider = new ethers.JsonRpcProvider(rpcUrl);

        // Use KEEPER_PRIVATE_KEY or DEPLOYER_PRIVATE_KEY
        const pk = process.env.KEEPER_PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
        if (!pk) {
            console.warn("⚠️ AllocationBot: No Private Key found. Bot disabled.");
            return;
        }

        this.wallet = new ethers.Wallet(pk, this.provider);

        const refAddr = process.env.REFERRAL_MANAGER_ADDRESS || '0xc8A84e0BF9a4C213564e858A89c8f14738aD0f15';
        const ctrlAddr = process.env.STRATEGY_CONTROLLER_ADDRESS || '0x40E0C5D813337a37130dfb0b7596BE40B048805E';

        this.referralManager = new ethers.Contract(refAddr, REFERRAL_MANAGER_ABI, this.wallet);
        this.strategyController = new ethers.Contract(ctrlAddr, STRATEGY_CONTROLLER_ABI, this.wallet);

        this.isRunning = true;
        console.log(`🤖 AllocationBot Initialized on ${rpcUrl}`);
        console.log(`   Ref Manager: ${sanitizeAddress(refAddr)}`);
    }

    public async start() {
        if (!this.isRunning) return;

        console.log("🚀 AllocationBot: Listening for TierUpgraded events...");

        // Listen to events with error handling
        this.referralManager.on("TierUpgraded", async (user, newTier, event) => {
            try {
                console.log(`\n🎉 Bot: Tier Upgrade Detected for ${sanitizeAddress(user)} -> Tier ${newTier}`);
                await this.rebalanceUser(user);
            } catch (error) {
                console.error('❌ Error handling TierUpgraded event:', error);
            }
        });
    }

    public stop() {
        if (this.referralManager) {
            this.referralManager.removeAllListeners("TierUpgraded");
        }
        this.isRunning = false;
        console.log("🛑 AllocationBot: Stopped");
    }

    private async rebalanceUser(user: string) {
        try {
            const sanitizedUser = sanitizeAddress(user);
            console.log(`⚖️  Bot: Rebalancing ${sanitizedUser}...`);

            // Validate user address
            if (!ethers.isAddress(user)) {
                console.error(`❌ Invalid user address: ${sanitizedUser}`);
                return;
            }

            // Simple gas check
            const feeData = await this.provider.getFeeData();
            if (feeData.gasPrice && feeData.gasPrice > ethers.parseUnits("100", "gwei")) {
                console.log("⛽ Bot: Gas too high, skipping.");
                return;
            }

            const tx = await this.strategyController.rebalance(user);
            console.log(`   ⏳ Bot: Tx sent: ${tx.hash}`);
            await tx.wait();
            console.log(`   ✅ Bot: Rebalance Complete for ${sanitizedUser}`);
        } catch (error: any) {
            console.error(`   ❌ Bot: Rebalance Failed: ${error?.message || 'Unknown error'}`);
        }
    }
}
