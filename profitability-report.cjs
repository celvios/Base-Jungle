const fs = require('fs');
const path = require('path');

const STRATEGIES = [
    { name: 'Moonwell USDC', apy: 4.2, gas: 0.08, risk: 'low', status: 'live' },
    { name: 'Aave USDC', apy: 3.8, gas: 0.12, risk: 'low', status: 'not_deployed' },
    { name: 'Aerodrome LP', apy: 12.5, gas: 0.15, risk: 'medium', status: 'not_deployed' },
    { name: 'Beefy Vault', apy: 6.8, gas: 0.10, risk: 'medium', status: 'not_deployed' },
    { name: 'UniswapV3 LP', apy: 25, gas: 0.20, risk: 'high', status: 'not_deployed' },
];

const results = STRATEGIES.map(s => ({
    ...s,
    minDeposit: Math.ceil((s.gas * (s.risk === 'high' ? 12 : 4) / (s.apy / 12)) * 100),
    returns30Days: (s.apy / 365) * 30,
    gasBreakeven: Math.ceil(s.gas / (s.apy / 365)),
}));

let report = '═'.repeat(80) + '\n';
report += '    BASE JUNGLE STRATEGY PROFITABILITY REPORT\n';
report += '═'.repeat(80) + '\n\n';
report += `Generated: ${new Date().toLocaleString()}\n\n`;

// Conservative
report += 'CONSERVATIVE (Low Risk)\n' + '-'.repeat(80) + '\n';
results.filter(r => r.risk === 'low').forEach((r, i) => {
    const icon = r.status === 'live' ? '✅' : '🔨';
    report += `[${i + 1}] ${r.name}\n`;
    report += `    APY: ${r.apy}% | Gas: $${r.gas} | Min: $${r.minDeposit}\n`;
    report += `    30-Day Return: ${r.returns30Days.toFixed(2)}%\n`;
    report += `    Status: ${icon} ${r.status.toUpperCase()}\n\n`;
});

// Aggressive
report += '\nAGGRESSIVE (Higher Yield)\n' + '-'.repeat(80) + '\n';
results.filter(r => r.risk !== 'low').forEach((r, i) => {
    const icon = r.status === 'live' ? '✅' : '🔨';
    report += `[${i + 1}] ${r.name}\n`;
    report += `    APY: ${r.apy}% | Risk: ${r.risk.toUpperCase()} | Gas: $${r.gas}\n`;
    report += `    Min Deposit: $${r.minDeposit}\n`;
    report += `    Status: ${icon} ${r.status.toUpperCase()}\n\n`;
});

report += '═'.repeat(80) + '\n';
report += 'SUMMARY\n' + '-'.repeat(80) + '\n';
report += `Live: ${results.filter(r => r.status === 'live').length} | Not Deployed: ${results.filter(r => r.status === 'not_deployed').length}\n\n`;
report += `Best Conservative: Moonwell (4.2% APY)\n`;
report += `Best Aggressive: UniswapV3 (25% APY, high risk)\n\n`;
report += '💡 RECOMMENDATIONS:\n';
report += '  Safe: Start with Moonwell (4.2% steady)\n';
report += '  Balanced: Aerodrome LP (12.5%, low IL)\n';
report += '  Max Yield: UniswapV3 (25%, active mgmt)\n';
report += '═'.repeat(80) + '\n';

console.log('\n' + report);

const outDir = path.join(__dirname, 'scripts/reports');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'profitability-report.txt'), report);
fs.writeFileSync(path.join(outDir, 'profitability-data.json'), JSON.stringify(results, null, 2));

console.log('\n📄 Report: scripts/reports/profitability-report.txt');
console.log('📊 JSON: scripts/reports/profitability-data.json\n');
