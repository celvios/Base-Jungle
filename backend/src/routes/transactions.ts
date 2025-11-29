import { Router } from 'express';
import { ethers } from 'ethers';
import { pool } from '../database/connection.js';
import { authenticate } from './auth-middleware.js';

const router = Router();

// RPC provider
const provider = new ethers.JsonRpcProvider(
    process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org'
);

// Vault ABIs (minimal for deposit/withdraw)
const VAULT_ABI = [
    'function deposit(uint256 assets, address receiver) external returns (uint256)',
    'function withdraw(uint256 assets, address receiver, address owner) external returns (uint256)',
    'function getMinimumDeposit(address user) external view returns (uint256)',
    'function balanceOf(address account) external view returns (uint256)',
    'function convertToAssets(uint256 shares) external view returns (uint256)',
];

const USDC_ABI = [
    'function allowance(address owner, address spender) external view returns (uint256)',
    'function balanceOf(address account) external view returns (uint256)',
];

// Contract addresses from env
const CONSERVATIVE_VAULT = process.env.CONSERVATIVE_VAULT_ADDRESS || '';
const AGGRESSIVE_VAULT = process.env.AGGRESSIVE_VAULT_ADDRESS || '';
const USDC_ADDRESS = process.env.USDC_ADDRESS || '';

// POST /api/deposit/preview - Preview deposit
router.post('/preview', authenticate, async (req, res) => {
    try {
        const { vaultAddress, amount } = req.body;
        const userAddress = req.user!.address;

        if (!vaultAddress || !amount) {
            return res.status(400).json({ error: 'Missing vaultAddress or amount' });
        }

        // Get vault contract
        const vault = new ethers.Contract(vaultAddress, VAULT_ABI, provider);
        const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);

        // Get minimum deposit
        const minDeposit = await vault.getMinimumDeposit(userAddress);

        // Parse amount (assuming it's in USDC with 6 decimals)
        const amountWei = ethers.parseUnits(amount.toString(), 6);

        // Check minimum
        if (amountWei < minDeposit) {
            return res.status(400).json({
                error: `Minimum deposit is ${ethers.formatUnits(minDeposit, 6)} USDC`,
                minDeposit: ethers.formatUnits(minDeposit, 6),
            });
        }

        // Check USDC balance
        const balance = await usdc.balanceOf(userAddress);
        if (balance < amountWei) {
            return res.status(400).json({
                error: 'Insufficient USDC balance',
                balance: ethers.formatUnits(balance, 6),
            });
        }

        // Check allowance
        const allowance = await usdc.allowance(userAddress, vaultAddress);
        const needsApproval = allowance < amountWei;

        // Estimate daily yield (simplified)
        const estimatedAPY = vaultAddress === CONSERVATIVE_VAULT ? 5.5 : 12.0;
        const dailyYield = (parseFloat(amount) * estimatedAPY / 100) / 365;

        // Calculate points (1 point per $100)
        const multiplier = vaultAddress === AGGRESSIVE_VAULT ? 1.5 : 1.0;
        const dailyPoints = Math.floor((parseFloat(amount) / 100) * multiplier);

        res.json({
            estimatedAPY,
            dailyYield,
            dailyPoints,
            gasEstimate: 0.001, // Placeholder
            needsApproval,
            allowance: ethers.formatUnits(allowance, 6),
            minDeposit: ethers.formatUnits(minDeposit, 6),
        });
    } catch (error: any) {
        console.error('Deposit preview error:', error);
        res.status(500).json({ error: 'Failed to preview deposit' });
    }
});

// POST /api/withdraw/preview - Preview withdrawal
router.post('/withdraw/preview', authenticate, async (req, res) => {
    try {
        const { vaultAddress, amount } = req.body;
        const userAddress = req.user!.address;

        if (!vaultAddress || !amount) {
            return res.status(400).json({ error: 'Missing vaultAddress or amount' });
        }

        // Get vault contract
        const vault = new ethers.Contract(vaultAddress, VAULT_ABI, provider);

        // Get user's share balance
        const shares = await vault.balanceOf(userAddress);
        const assets = await vault.convertToAssets(shares);

        // Parse withdrawal amount
        const withdrawAmount = ethers.parseUnits(amount.toString(), 6);

        if (withdrawAmount > assets) {
            return res.status(400).json({
                error: 'Insufficient vault balance',
                available: ethers.formatUnits(assets, 6),
            });
        }

        // Get deposit info from database to check maturity
        const depositQuery = await pool.query(
            `SELECT deposited_at FROM vault_positions 
             WHERE user_address = $1 AND vault_address = $2 AND is_active = true 
             ORDER BY deposited_at ASC LIMIT 1`,
            [userAddress, vaultAddress]
        );

        let penalty = 0;
        let isMature = true;
        let pointsForfeited = 0;

        if (depositQuery.rows.length > 0) {
            const depositedAt = new Date(depositQuery.rows[0].deposited_at);
            const daysSinceDeposit = (Date.now() - depositedAt.getTime()) / (1000 * 60 * 60 * 24);
            isMature = daysSinceDeposit >= 60; // 60-day maturity

            if (!isMature) {
                penalty = parseFloat(amount) * 0.10; // 10% penalty
                pointsForfeited = 500; // Lose bonus points
            }
        }

        const amountToReceive = parseFloat(amount) - penalty;

        res.json({
            amountToReceive,
            penalty,
            pointsForfeited,
            isMature,
            gasEstimate: 0.001,
            needsApproval: false,
        });
    } catch (error: any) {
        console.error('Withdraw preview error:', error);
        res.status(500).json({ error: 'Failed to preview withdrawal' });
    }
});

export default router;
