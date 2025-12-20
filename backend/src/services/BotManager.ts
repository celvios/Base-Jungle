import { AllocationBot } from './AllocationBot.js';

export class BotManager {
    private allocationBot: AllocationBot | null = null;
    private isRunning: boolean = false;

    public async start(): Promise<void> {
        if (this.isRunning) return;

        console.log('🚀 BotManager: Starting auto allocation system...');
        
        // Start AllocationBot (event-driven)
        this.allocationBot = new AllocationBot();
        await this.allocationBot.start();
        console.log('✅ AllocationBot: Listening for tier upgrades');
        
        this.isRunning = true;
        console.log('🎯 Auto allocation on tier upgrade active');
    }

    public async stop(): Promise<void> {
        this.isRunning = false;
        
        if (this.allocationBot) {
            this.allocationBot.stop();
        }
        
        console.log('🛑 Auto allocation stopped');
    }

    public getStatus() {
        return {
            isRunning: this.isRunning,
            allocationBot: !!this.allocationBot
        };
    }
}