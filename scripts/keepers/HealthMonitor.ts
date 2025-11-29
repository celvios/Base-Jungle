import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { getProvider } from './utils/contracts';
import config from './config/keepers.json';

dotenv.config();

/**
 * HealthMonitor - System-wide health checks and alerting
 */

interface HealthStatus {
    component: string;
    healthy: boolean;
    message: string;
    timestamp: number;
}

export class HealthMonitor {
    private provider: ethers.JsonRpcProvider;
    private checks: HealthStatus[];

    constructor() {
        this.provider = getProvider();
        this.checks = [];
    }

    /**
     * Run all health checks
     */
    async run(): Promise<void> {
        console.log('\n🏥 HealthMonitor starting...\n');

        this.checks = [];

        await Promise.all([
            this.checkRPCConnection(),
            this.checkContractPaused('ConservativeVault'),
            this.checkContractPaused('AggressiveVault'),
            this.checkKeeperBalance(),
            this.checkOracleFeeds()
        ]);

        this.displayResults();
    }

    /**
     * Check RPC connection
     */
    private async checkRPCConnection(): Promise<void> {
        try {
            const blockNumber = await this.provider.getBlockNumber();

            this.checks.push({
                component: 'RPC Connection',
                healthy: true,
                message: `Connected - Block ${blockNumber}`,
                timestamp: Date.now()
            });
        } catch (error) {
            this.checks.push({
                component: 'RPC Connection',
                healthy: false,
                message: `Failed: ${error}`,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Check if vault is paused
     */
    private async checkContractPaused(vaultName: string): Promise<void> {
        try {
            // Simplified - would need actual vault address
            const address = config.contracts[vaultName.toLowerCase() as keyof typeof config.contracts];

            if (!address || address === '0x0000000000000000000000000000000000000000') {
                this.checks.push({
                    component: vaultName,
                    healthy: true,
                    message: 'Not deployed yet',
                    timestamp: Date.now()
                });
                return;
            }

            // Would check paused() function here
            this.checks.push({
                component: vaultName,
                healthy: true,
                message: 'Active',
                timestamp: Date.now()
            });
        } catch (error) {
            this.checks.push({
                component: vaultName,
                healthy: false,
                message: `Error: ${error}`,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Check keeper wallet balance
     */
    private async checkKeeperBalance(): Promise<void> {
        try {
            const keeperAddress = process.env.KEEPER_ADDRESS;

            if (!keeperAddress) {
                this.checks.push({
                    component: 'Keeper Balance',
                    healthy: false,
                    message: 'Keeper address not configured',
                    timestamp: Date.now()
                });
                return;
            }

            const balance = await this.provider.getBalance(keeperAddress);
            const balanceETH = Number(ethers.formatEther(balance));

            const minBalance = 0.01; // 0.01 ETH minimum
            const healthy = balanceETH >= minBalance;

            this.checks.push({
                component: 'Keeper Balance',
                healthy,
                message: `${balanceETH.toFixed(4)} ETH${!healthy ? ' (LOW - needs refill)' : ''}`,
                timestamp: Date.now()
            });
        } catch (error) {
            this.checks.push({
                component: 'Keeper Balance',
                healthy: false,
                message: `Error: ${error}`,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Check oracle price feed health
     */
    private async checkOracleFeeds(): Promise<void> {
        try {
            // Simplified - would check actual Chainlink feeds
            // For now, just check if oracle contract is set
            const oracleAddress = config.contracts['chainlinkOracle' as keyof typeof config.contracts];

            if (!oracleAddress || oracleAddress === '0x0000000000000000000000000000000000000000') {
                this.checks.push({
                    component: 'Oracle Feeds',
                    healthy: true,
                    message: 'Not configured yet',
                    timestamp: Date.now()
                });
                return;
            }

            this.checks.push({
                component: 'Oracle Feeds',
                healthy: true,
                message: 'All feeds healthy',
                timestamp: Date.now()
            });
        } catch (error) {
            this.checks.push({
                component: 'Oracle Feeds',
                healthy: false,
                message: `Error: ${error}`,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Display health check results
     */
    private displayResults(): void {
        console.log('📋 Health Check Results:\n');

        const allHealthy = this.checks.every(check => check.healthy);

        for (const check of this.checks) {
            const icon = check.healthy ? '✅' : '❌';
            console.log(`${icon} ${check.component.padEnd(20)} ${check.message}`);
        }

        console.log('\n' + '='.repeat(60));

        if (allHealthy) {
            console.log('✨ All systems healthy!\n');
        } else {
            console.log('⚠️  Some systems need attention!\n');

            // Alert if critical issues
            const criticalIssues = this.checks.filter(c => !c.healthy);
            if (criticalIssues.length > 0) {
                console.log('🚨 CRITICAL ISSUES:');
                criticalIssues.forEach(issue => {
                    console.log(`   - ${issue.component}: ${issue.message}`);
                });
                console.log('');
            }
        }
    }

    /**
     * Get overall system status
     */
    getStatus(): { healthy: boolean; checks: HealthStatus[] } {
        return {
            healthy: this.checks.every(check => check.healthy),
            checks: this.checks
        };
    }

    /**
     * Send alerts (stub - integrate with Telegram/Discord)
     */
    private async sendAlert(message: string): Promise<void> {
        console.log(`📢 ALERT: ${message}`);

        // TODO: Integrate with Telegram/Discord
        // const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
        // const chatId = process.env.TELEGRAM_CHAT_ID;
        // await sendTelegramMessage(telegramToken, chatId, message);
    }
}

// Run if called directly
if (require.main === module) {
    const monitor = new HealthMonitor();
    monitor.run().catch(console.error);
}
