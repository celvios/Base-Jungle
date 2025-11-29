import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

// Strategies to analyze
const STRATEGIES = [
    {
        name: 'Moonwell USDC Lending',
        protocol: 'Moonwell',
        riskLevel: 'low' as const,
        category: 'Conservative',
    },
    {
        name: 'Aave USDC Lending',
        protocol: 'Aave',
        riskLevel: 'low' as const,
        category: 'Conservative',
    },
    {
        name: 'Aerodrome USDC/USDbC LP',
        protocol: 'Aerodrome',
        riskLevel: 'medium' as const,
        category: 'Aggressive',
    },
    {
        name: 'Beefy USDC Vault',
        protocol: 'Beefy',
        riskLevel: 'medium' as const,
        category: 'Aggressive',
    },
    {
        name: 'UniswapV3 USDC/WETH LP',
        protocol: 'UniswapV3',
        riskLevel: 'high' as const,
        category: 'Aggressive',
    },
];

interface StrategyMetrics {
    name: string;
    protocol: string;
    currentAPY: number;
    gasPerHarvest: number;
    minProfitableDeposit: number;
    returns30Days: number;
    returns1Year: number;
    riskLevel: 'low' | 'medium' | 'high';
    status: 'live' | 'paused' | 'not_deployed';
    gasBreakeven: number;
}

async function analyzeStrategy(strategy: typeof STRATEGIES[0]): Promise<StrategyMetrics> {
    console.log(`  Analyzing ${strategy.name}...`);

    let apy: number;
    let gasPerHarvest: number;

    switch (strategy.protocol) {
        case 'Moonwell':
            apy = 4.2;
            gasPerHarvest = 0.08;
            break;
        case 'Aave':
            apy = 3.8;
            gasPerHarvest = 0.12;
            break;
        case 'Aerodrome':
            apy = 12.5;
            gasPerHarvest = 0.15;
            break;
        case 'Beefy':
            apy = 6.8;
            gasPerHarvest = 0.10;
            break;
        case 'UniswapV3':
            apy = 25;
            gasPerHarvest = 0.20;
            break;
        default:
            apy = 5;
            gasPerHarvest = 0.10;
    }

    const harvestsPerMonth = strategy.category === 'Aggressive' ? 12 : 4;
    const monthlyGas = gasPerHarvest * harvestsPerMonth;
    const monthlyAPY = apy / 12;
    const minProfitableDeposit = Math.ceil((monthlyGas / monthlyAPY) * 100);
    const returns30Days = (apy / 365) * 30;
    const returns1Year = apy;
    const dailyYield = apy / 365;
    const gasBreakeven = Math.ceil(gasPerHarvest / dailyYield);

    return {
        name: strategy.name,
        protocol: strategy.protocol,
        currentAPY: apy,
        gasPerHarvest,
        minProfitableDeposit,
        returns30Days,
        returns1Year,
        riskLevel: strategy.riskLevel,
        status: strategy.protocol === 'Moonwell' ? 'live' : 'not_deployed',
        gasBreakeven,
    };
}

function generateReport(metrics: StrategyMetrics[]): string {
    const conservative = metrics.filter(m => m.riskLevel === 'low');
    const aggressive = metrics.filter(m => m.riskLevel !== 'low');
    const live = metrics.filter(m => m.status === 'live');
    const notDeployed = metrics.filter(m => m.status === 'not_deployed');

    let report = '';
    report += '═'.repeat(80) + '\n';
    report += '        BASE JUNGLE STRATEGY PROFITABILITY REPORT\n';
    report += '═'.repeat(80) + '\n\n';
    report += `Generated: ${new Date().toLocaleString()}\n`;
    report += `Network: Base Sepolia\n\n`;

    report += 'CONSERVATIVE STRATEGIES (Low Risk)\n';
    report += '-'.repeat(80) + '\n';
    conservative.forEach((m, i) => {
        const icon = m.status === 'live' ? '✅' : '🔨';
        report += `[${i + 1}] ${m.name}\n`;
        report += `    APY: ${m.currentAPY.toFixed(1)}%\n`;
        report += `    Gas/Harvest: $${m.gasPerHarvest.toFixed(2)}\n`;
        report += `    Min Deposit: $${m.minProfitableDeposit}\n`;
        report += `    30-Day Return: ${m.returns30Days.toFixed(2)}%\n`;
        report += `    Gas Breakeven: ${m.gasBreakeven} days\n`;
        report += `    Status: ${icon} ${m.status.toUpperCase()}\n\n`;
    });

    report += '\nAGGRESSIVE STRATEGIES (Higher Yield)\n';
    report += '-'.repeat(80) + '\n';
    aggressive.forEach((m, i) => {
        const icon = m.status === 'live' ? '✅' : '🔨';
        const risk = m.riskLevel === 'high' ? '⚠️ HIGH RISK' : 'Medium Risk';
        report += `[${i + 1}] ${m.name}\n`;
        report += `    APY: ${m.currentAPY.toFixed(1)}%\n`;
        report += `    Risk: ${risk}\n`;
        report += `    Gas/Harvest: $${m.gasPerHarvest.toFixed(2)}\n`;
        report += `    Min Deposit: $${m.minProfitableDeposit}\n`;
        report += `    Annual Return: ${m.returns1Year.toFixed(1)}%\n`;
        report += `    Status: ${icon} ${m.status.toUpperCase()}\n\n`;
    });

    report += '═'.repeat(80) + '\n';
    report += 'SUMMARY\n';
    report += '-'.repeat(80) + '\n';
    report += `Total Strategies: ${metrics.length}\n`;
    report += `Live: ${live.length}\n`;
    report += `Not Deployed: ${notDeployed.length}\n\n`;

    const bestCons = conservative.sort((a, b) => b.currentAPY - a.currentAPY)[0];
    const bestAgg = aggressive.sort((a, b) => b.currentAPY - a.currentAPY)[0];

    if (bestCons) report += `Best Conservative: ${bestCons.name} (${bestCons.currentAPY}% APY)\n`;
    if (bestAgg) report += `Best Aggressive: ${bestAgg.name} (${bestAgg.currentAPY}% APY)\n`;

    report += '\n💡 RECOMMENDATION:\n';
    report += '  - Safe: Moonwell/Aave (4% steady)\n';
    report += '  - Balanced: Aerodrome stablecoin LP (12% with low IL)\n';
    report += '  - High yield: UniswapV3 (25% but active management needed)\n\n';
    report += '═'.repeat(80) + '\n';

    return report;
}

async function main() {
    console.log('🔍 Analyzing Base Jungle Strategies...\n');
    const metrics: StrategyMetrics[] = [];

    for (const strategy of STRATEGIES) {
        const result = await analyzeStrategy(strategy);
        metrics.push(result);
    }

    const report = generateReport(metrics);
    console.log('\n' + report);

    const outDir = path.join(__dirname, '../reports');
    const txtPath = path.join(outDir, 'profitability-report.txt');
    const jsonPath = path.join(outDir, 'profitability-data.json');

    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(txtPath, report);
    fs.writeFileSync(jsonPath, JSON.stringify(metrics, null, 2));

    console.log(`📄 Report: ${txtPath}`);
    console.log(`📊 JSON: ${jsonPath}\n`);
}

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
