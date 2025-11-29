import cron from 'node-cron';
import { PointsEngine } from './PointsEngine';

dotenv.config();

/**
 * Main keeper bot runner - orchestrates all autonomous operations
 */

console.log('🤖 Base Jungle Keeper Bots Starting...\n');
console.log('='.repeat(60));
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Network:', process.env.BASE_RPC_URL?.includes('mainnet') ? 'Base Mainnet' : 'Base Testnet');
console.log('='.repeat(60) + '\n');

// Initialize keepers
const harvestKeeper = new HarvestKeeper();
const rebalanceKeeper = new RebalanceKeeper();
const healthMonitor = new HealthMonitor();
// PointsEngine is static

/**
 * Run initial health check
 */
async function initialHealthCheck() {
    console.log('🏥 Running initial health check...\n');
    await healthMonitor.run();

    const status = healthMonitor.getStatus();
    if (!status.healthy) {
        console.log('⚠️  WARNING: System not fully healthy. Keepers may not function correctly.\n');
    }
}

/**
 * Schedule all keeper jobs
 */
function scheduleJobs() {
    // HarvestKeeper - every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        console.log('\n' + '='.repeat(60));
        console.log('⏰ Scheduled: HarvestKeeper');
        console.log('='.repeat(60));
        try {
            await harvestKeeper.run();
        } catch (error) {
            console.error('❌ HarvestKeeper failed:', error);
        }
    });
    console.log('✅ HarvestKeeper scheduled: Every 6 hours');

    // RebalanceKeeper - every 2 hours
    cron.schedule('0 */2 * * *', async () => {
        console.log('\n' + '='.repeat(60));
        console.log('⏰ Scheduled: RebalanceKeeper');
        console.log('='.repeat(60));
        try {
            await rebalanceKeeper.run();
        } catch (error) {
            console.error('❌ RebalanceKeeper failed:', error);
        }
    });
    console.log('✅ RebalanceKeeper scheduled: Every 2 hours');

    // PointsEngine - Daily at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('\n' + '='.repeat(60));
        console.log('⏰ Scheduled: PointsEngine');
        console.log('='.repeat(60));
        try {
            await PointsEngine.run();
        } catch (error) {
            console.error('❌ PointsEngine failed:', error);
        }
    });
    console.log('✅ PointsEngine scheduled: Daily at midnight');

    // HealthMonitor - every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            await healthMonitor.run();
        } catch (error) {
            console.error('❌ HealthMonitor failed:', error);
        }
    });
    console.log('✅ HealthMonitor scheduled: Every 5 minutes');

    console.log('\n🎯 All keepers active and monitoring...\n');
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
    console.log('\n\n⏹️  Shutting down keeper bots...');
    console.log('👋 Goodbye!\n');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n⏹️  Received SIGTERM, shutting down...');
    process.exit(0);
});

/**
 * Start the keeper system
 */
async function main() {
    try {
        // Run initial health check
        await initialHealthCheck();

        // Schedule all jobs
        scheduleJobs();

        // Run all keepers immediately for testing
        if (process.env.RUN_IMMEDIATELY === 'true') {
            console.log('🚀 Running all keepers immediately (test mode)...\n');

            await harvestKeeper.run();
            await rebalanceKeeper.run();
        }

        // Keep process alive
        console.log('✨ Keeper system running. Press Ctrl+C to stop.\n');
    } catch (error) {
        console.error('❌ Fatal error in keeper system:', error);
        process.exit(1);
    }
}

// Start the system
main().catch((error) => {
    console.error('❌ Failed to start keeper system:', error);
    process.exit(1);
});
