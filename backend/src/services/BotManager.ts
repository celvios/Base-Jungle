import { AllocationBot } from './AllocationBot.js';
import { RebalanceKeeper } from './RebalanceKeeper.js';

export class BotManager {
    private allocationBot: AllocationBot | null = null;
    private rebalanceKeeper: RebalanceKeeper | null = null;
    private rebalanceInterval: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;

    public async start(): Promise<void> {
        if (this.isRunning) return;

        console.log('🚀 BotManager: Starting 24/7 bot system...');
        
        // Start AllocationBot (event-driven)
        this.allocationBot = new AllocationBot();
        await this.allocationBot.start();
        console.log('✅ AllocationBot: Listening for tier upgrades');
        
        // Start RebalanceKeeper (interval-driven)
        this.rebalanceKeeper = new RebalanceKeeper();
        this.startRebalanceLoop();
        console.log('✅ RebalanceKeeper: Monitoring leveraged positions');
        
        this.isRunning = true;
        console.log('🎯 Both bots running 24/7');
    }

    private startRebalanceLoop(): void {
        const intervalMs = Number(process.env.REBALANCE_KEEPER_INTERVAL) || 120000; // 2 minutes default
        
        this.rebalanceInterval = setInterval(async () => {
            if (!this.isRunning || !this.rebalanceKeeper) return;
            
            try {
                await this.rebalanceKeeper.run();
            } catch (error) {
                console.error('❌ RebalanceKeeper error:', error);
            }
        }, intervalMs);
    }

    public async stop(): Promise<void> {
        this.isRunning = false;
        
        if (this.allocationBot) {
            this.allocationBot.stop();
        }
        
        if (this.rebalanceInterval) {
            clearInterval(this.rebalanceInterval);
        }
        
        console.log('🛑 Both bots stopped');
    }

    public getStatus() {
        return {
            isRunning: this.isRunning,
            allocationBot: !!this.allocationBot,
            rebalanceKeeper: !!this.rebalanceKeeper
        };
    }
}