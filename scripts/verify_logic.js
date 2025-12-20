import { ethers } from 'ethers';

// Verify error selector
const signatures = [
    "InsufficientAmount(uint256,uint256)",
    "AmountTooSmall(address,uint256)"
];

console.log('--- Selector Verification ---');
for (const sig of signatures) {
    console.log(`${sig} -> ${ethers.id(sig).slice(0, 10)}`);
}

// Simulate Vault Logic
console.log('\n--- Vault Logic Simulation ---');
const assets = ethers.parseUnits("500", 6); // 500 USDC
const depositFee = 10n; // 10 basis points (0.1%)
const BASIS_POINTS = 10000n;

const fee = (assets * depositFee) / BASIS_POINTS;
const assetsAfterFee = assets - fee;

console.log(`Assets: ${assets.toString()} (${ethers.formatUnits(assets, 6)} USDC)`);
console.log(`Fee: ${fee.toString()} (${ethers.formatUnits(fee, 6)} USDC)`);
console.log(`Assets After Fee: ${assetsAfterFee.toString()} (${ethers.formatUnits(assetsAfterFee, 6)} USDC)`);

// Points Calculation
const points = assetsAfterFee * 10n ** 12n;
console.log(`Points to Award: ${points.toString()} (${ethers.formatUnits(points, 18)} Points)`);

const MIN_POINTS_AMOUNT = 100n;
console.log(`MIN_POINTS_AMOUNT: ${MIN_POINTS_AMOUNT}`);

if (points < MIN_POINTS_AMOUNT) {
    console.log('Result: ❌ Insufficient Amount (< 100)');
} else {
    console.log('Result: ✅ Valid Amount (>= 100)');
}
