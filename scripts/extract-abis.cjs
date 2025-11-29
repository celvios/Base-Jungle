const fs = require('fs');
const path = require('path');

// Create abis directory if it doesn't exist
if (!fs.existsSync('abis')) {
    fs.mkdirSync('abis');
}

// Extract BaseVault ABI (from ConservativeVault)
const vaultArtifact = JSON.parse(
    fs.readFileSync('artifacts/contracts/vaults/ConservativeVault.sol/ConservativeVault.json', 'utf8')
);
fs.writeFileSync(
    'abis/BaseVaultAbi.ts',
    `export const BaseVaultAbi = ${JSON.stringify(vaultArtifact.abi, null, 2)} as const;\n`
);
console.log('✅ Created BaseVaultAbi.ts');

// Extract ReferralManager ABI
const refArtifact = JSON.parse(
    fs.readFileSync('artifacts/contracts/ReferralManager.sol/ReferralManager.json', 'utf8')
);
fs.writeFileSync(
    'abis/ReferralManagerAbi.ts',
    `export const ReferralManagerAbi = ${JSON.stringify(refArtifact.abi, null, 2)} as const;\n`
);
console.log('✅ Created ReferralManagerAbi.ts');

// Extract StrategyController ABI (from separate file if exists, or use a minimal one)
try {
    const strategyPath = 'artifacts/contracts/adapters/StrategyController.sol/StrategyController.json';
    if (fs.existsSync(strategyPath)) {
        const strategyArtifact = JSON.parse(fs.readFileSync(strategyPath, 'utf8'));
        fs.writeFileSync(
            'abis/StrategyControllerAbi.ts',
            `export const StrategyControllerAbi = ${JSON.stringify(strategyArtifact.abi, null, 2)} as const;\n`
        );
        console.log('✅ Created StrategyControllerAbi.ts');
    } else {
        // Use minimal ABI
        fs.writeFileSync(
            'abis/StrategyControllerAbi.ts',
            `export const StrategyControllerAbi = [] as const;\n`
        );
        console.log('⚠️  StrategyController artifact not found, using empty ABI');
    }
} catch (e) {
    console.error('⚠️  Error with StrategyController:', e.message);
}

// Extract PointsTracker ABI
const pointsArtifact = JSON.parse(
    fs.readFileSync('artifacts/contracts/PointsTracker.sol/PointsTracker.json', 'utf8')
);
fs.writeFileSync(
    'abis/PointsTrackerAbi.ts',
    `export const PointsTrackerAbi = ${JSON.stringify(pointsArtifact.abi, null, 2)} as const;\n`
);
console.log('✅ Created PointsTrackerAbi.ts');

console.log('\n✅ All ABIs exported successfully!');
