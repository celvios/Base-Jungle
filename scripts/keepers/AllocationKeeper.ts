import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { getCurrentGasPrice, isGasPriceAcceptable } from './utils/gas';
import { getKeeperWallet } from './utils/contracts';
import config from './config/keepers.json';
import fs from 'fs';

dotenv.config({ path: '.env.deployment' });

const REFERRAL_MANAGER_ABI = [
    'event TierUpgraded(address indexed user, uint8 newTier)',
    'function getUserTier(address user) external view returns (uint8)',
    'function getUserTierInfo(address user) external view returns (uint8 tier, uint256 multiplier, uint256 maxLev, uint256 activeRefs, uint256 totalRefs)'
];

const STRATEGY_CONTROLLER_ABI = [
    'function rebalance(address user) external',
    'function userAllocations(address user, uint256 strategyId) external view returns (uint256)',
    'function strategies(uint256 strategyId) external view returns (uint8 strategyType, address adapter, address asset, bool isActive, uint256 totalAllocated, uint256 targetAPY, uint256 riskScore, uint8 minTier)',
    'function strategyCount() external view returns (uint256)'
];

export class AllocationKeeper {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private referralManager: ethers.Contract;
    private strategyController: ethers.Contract;

    // Config
    private CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour for full scan

    constructor() {
        // Fallback to Public RPC
        const rpcUrl = process.env.RPC_URL || process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
        if (!rpcUrl) throw new Error("Missing RPC_URL");

        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = getKeeperWallet().connect(this.provider);

        // Load addresses
        // We'll trust the config or fallback to deployment file
        let refAddr = config.contracts.referralManager;
        let ctrlAddr = config.contracts.strategyController;

        // Fallback for Base Sepolia
        if (!refAddr || !ctrlAddr) {
            try {
                const dep = JSON.parse(fs.readFileSync('./deployed-addresses-sepolia.json', 'utf8'));
                refAddr = dep.contracts.referralManager;
                ctrlAddr = dep.contracts.strategyController;
            } catch (e) {
                console.warn("⚠️ Could not load deployment file.");
            }
        }

        if (!refAddr || !ctrlAddr) throw new Error("Missing contract addresses.");

        this.referralManager = new ethers.Contract(refAddr, REFERRAL_MANAGER_ABI, this.wallet);
        this.strategyController = new ethers.Contract(ctrlAddr, STRATEGY_CONTROLLER_ABI, this.wallet);

        console.log(`🤖 Allocation Keeper Initialized`);
        console.log(`   Ref Manager: ${refAddr}`);
        console.log(`   Controller:  ${ctrlAddr}`);
    }

    async start() {
        console.log("🚀 Starting Event Listener...");

        // 1. Listen for Tier Upgrades
        this.referralManager.on("TierUpgraded", async (user, newTier, event) => {
            console.log(`\n🎉 Tier Upgrade Detected: ${user} -> Tier ${newTier}`);
            await this.rebalanceUser(user);
        });

        // 2. Periodic Scan (in case events were missed)
        setInterval(() => this.scanUsers(), this.CHECK_INTERVAL_MS);

        // Initial scan
        await this.scanUsers();

        console.log("✅ Listening for events. Press Ctrl+C to stop.");
    }

    async rebalanceUser(user: string) {
        try {
            console.log(`⚖️  Rebalancing ${user}...`);

            // Gas Check
            if (!(await isGasPriceAcceptable(100))) {
                console.log("⛽ Gas too high, skipping rebalance.");
                return;
            }

            const tx = await this.strategyController.rebalance(user);
            console.log(`   ⏳ Tx sent: ${tx.hash}`);
            await tx.wait();
            console.log(`   ✅ Rebalance Complete for ${user}`);
        } catch (error: any) {
            console.error(`   ❌ Rebalance Failed: ${error.message}`);
        }
    }

    // Naive scan: Check deployed contract events to find users? 
    // Or tracked users list? 
    // For now, let's just listen. 
    // Implementing a full user scan is expensive without a subgraph.
    // We'll skip the periodic "All User" scan for now and rely on Events + Manual Triggers.
    async scanUsers() {
        console.log("Create a list of users to scan coming soon...");
    }
}

// Run
if (require.main === module) {
    const bot = new AllocationKeeper();
    bot.start().catch(console.error);
}
