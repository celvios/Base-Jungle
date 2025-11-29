import { Router } from 'express';
import { ethers } from 'ethers';
import { pool } from '../database/connection.js';
import { optionalAuthenticate } from './auth-middleware.js';

const router = Router();

// RPC provider
const provider = new ethers.JsonRpcProvider(
    process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org'
);

// GET /api/vaults - List all vaults
router.get('/vaults', async (req, res) => {
    try {
        const vaults = [
            {
                id: 'conservative',
                name: 'Conservative Vault',
                address: process.env.CONSERVATIVE_VAULT_ADDRESS,
                apy: 5.5,
                riskLevel: 'low',
                strategies: ['lending', 'stable-lp'],
                minDeposit: 500,
                isActive: true,
            },
            {
                id: 'aggressive',
                name: 'Aggressive Vault',
                address: process.env.AGGRESSIVE_VAULT_ADDRESS,
                apy: 12.0,
                riskLevel: 'high',
                strategies: ['leveraged-lp', 'arbitrage', 'delta-neutral'],
                minDeposit: 10000,
                tierRequired: 'Captain',
                isActive: true,
            },
        ];

        res.json(vaults);
    } catch (error) {
        console.error('Vaults list error:', error);
        res.status(500).json({ error: 'Failed to fetch vaults' });
    }
});

// GET /api/user/:address/portfolio - User portfolio
router.get('/user/:address/portfolio', optionalAuthenticate, async (req, res) => {
    try {
        const { address } = req.params;

        // Get vault positions
        const positionsQuery = await pool.query(
            `SELECT vault_address, vault_type, principal, shares, deposited_at, is_active
             FROM vault_positions 
             WHERE user_address = $1`,
            [address.toLowerCase()]
        );

        // Get total deposited
        const totalQuery = await pool.query(
            `SELECT COALESCE(SUM(principal), 0) as total_deposited
             FROM vault_positions 
             WHERE user_address = $1 AND is_active = true`,
            [address.toLowerCase()]
        );

        // Get points
        const pointsQuery = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total_points
             FROM points 
             WHERE wallet_address = $1`,
            [address.toLowerCase()]
        );

        const netWorth = parseFloat(totalQuery.rows[0]?.total_deposited || '0');
        const totalPoints = parseInt(pointsQuery.rows[0]?.total_points || '0');

        res.json({
            netWorth,
            totalDeposited: netWorth,
            totalYield: 0, // Would calculate from contract
            recentHarvest: 0,
            lastHarvestTime: null,
            totalPoints,
            positions: positionsQuery.rows.map(p => ({
                vaultAddress: p.vault_address,
                vaultType: p.vault_type,
                principal: p.principal.toString(),
                shares: p.shares.toString(),
                depositedAt: p.deposited_at,
                isActive: p.is_active,
            })),
        });
    } catch (error) {
        console.error('Portfolio error:', error);
        res.status(500).json({ error: 'Failed to fetch portfolio' });
    }
});

// GET /api/user/:address/points - User points
router.get('/user/:address/points', async (req, res) => {
    try {
        const { address } = req.params;

        // Get total points
        const totalQuery = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total_points
             FROM points 
             WHERE wallet_address = $1`,
            [address.toLowerCase()]
        );

        // Get points history
        const historyQuery = await pool.query(
            `SELECT amount as points, source, created_at as date
             FROM points 
             WHERE wallet_address = $1 
             ORDER BY created_at DESC 
             LIMIT 100`,
            [address.toLowerCase()]
        );

        // Get user tier
        const userQuery = await pool.query(
            `SELECT tier FROM users WHERE wallet_address = $1`,
            [address.toLowerCase()]
        );

        const tier = parseInt(userQuery.rows[0]?.tier || '0');
        const tierNames = ['Novice', 'Scout', 'Captain', 'Whale'];

        const totalPoints = parseInt(totalQuery.rows[0]?.total_points || '0');
        const dailyPointRate = Math.floor(totalPoints / 100); // Simplified

        res.json({
            totalPoints,
            rank: tierNames[tier],
            dailyPointRate,
            pointsHistory: historyQuery.rows,
            nextRankPoints: (tier + 1) * 5000,
            nextRankName: tierNames[Math.min(tier + 1, 3)],
        });
    } catch (error) {
        console.error('Points error:', error);
        res.status(500).json({ error: 'Failed to fetch points' });
    }
});

// GET /api/user/:address/referrals - User referrals
router.get('/user/:address/referrals', async (req, res) => {
    try {
        const { address } = req.params;

        // Get user referral code
        const userQuery = await pool.query(
            `SELECT referral_code, tier FROM users WHERE wallet_address = $1`,
            [address.toLowerCase()]
        );

        const referralCode = userQuery.rows[0]?.referral_code || address.slice(2, 12).toUpperCase();
        const tier = parseInt(userQuery.rows[0]?.tier || '0');

        // Count referrals
        const directQuery = await pool.query(
            `SELECT COUNT(*) as count FROM referrals 
             WHERE referrer = $1 AND level = 1`,
            [address.toLowerCase()]
        );

        const indirectQuery = await pool.query(
            `SELECT COUNT(*) as count FROM referrals 
             WHERE referrer = $1 AND level = 2`,
            [address.toLowerCase()]
        );

        const tierNames = ['Novice', 'Scout', 'Captain', 'Whale'];
        const directReferrals = parseInt(directQuery.rows[0]?.count || '0');
        const indirectReferrals = parseInt(indirectQuery.rows[0]?.count || '0');

        res.json({
            referralCode,
            referralLink: `https://basejungle.xyz/ref/${referralCode}`,
            directReferrals,
            indirectReferrals,
            activeReferrals: directReferrals,
            currentTier: tierNames[tier],
            nextTier: tierNames[Math.min(tier + 1, 3)],
            nextTierRequirement: (tier + 1) * 5,
            totalBonusPoints: directReferrals * 100 + indirectReferrals * 50,
        });
    } catch (error) {
        console.error('Referrals error:', error);
        res.status(500).json({ error: 'Failed to fetch referrals' });
    }
});

// GET /api/leaderboard - Top users by points
router.get('/leaderboard', async (req, res) => {
    try {
        const { limit = 100 } = req.query;

        const query = await pool.query(
            `SELECT 
                u.wallet_address as address,
                COALESCE(SUM(p.amount), 0) as points,
                u.tier,
                (SELECT COUNT(*) FROM referrals WHERE referrer = u.wallet_address) as referrals
             FROM users u
             LEFT JOIN points p ON u.wallet_address = p.wallet_address
             GROUP BY u.wallet_address, u.tier
             ORDER BY points DESC
             LIMIT $1`,
            [limit]
        );

        const tierNames = ['Novice', 'Scout', 'Captain', 'Whale'];

        const leaderboard = query.rows.map((row, index) => ({
            rank: index + 1,
            address: row.address,
            points: parseInt(row.points),
            tier: tierNames[parseInt(row.tier || '0')],
            referrals: parseInt(row.referrals || '0'),
        }));

        res.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

export default router;
