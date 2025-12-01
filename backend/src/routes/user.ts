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
             WHERE wallet_address = $1`,
            [address.toLowerCase()]
        );

        // Get total deposited
        const totalQuery = await pool.query(
            `SELECT COALESCE(SUM(principal), 0) as total_deposited
             FROM vault_positions 
             WHERE wallet_address = $1 AND is_active = true`,
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

// GET /api/user/:address/points - User points (with auto-sync)
router.get('/user/:address/points', async (req, res) => {
    try {
        const { address } = req.params;
        const normalizedAddress = address.toLowerCase();

        // Check if user exists and when they were last synced
        const userCheck = await pool.query(
            `SELECT last_active_at FROM users WHERE wallet_address = $1`,
            [normalizedAddress]
        );

        const shouldSync = !userCheck.rows.length ||
            !userCheck.rows[0].last_active_at ||
            (Date.now() - new Date(userCheck.rows[0].last_active_at).getTime()) > 300000; // 5 minutes

        // Auto-sync from blockchain if needed
        if (shouldSync) {
            try {
                console.log(`🔄 Auto-syncing data for ${address.slice(0, 6)}...${address.slice(-4)}`);

                const POINTS_TRACKER_ABI = [
                    {
                        inputs: [{ name: 'user', type: 'address' }],
                        name: 'userPoints',
                        outputs: [
                            { name: 'points', type: 'uint256' },
                            { name: 'lastUpdated', type: 'uint256' }
                        ],
                        stateMutability: 'view',
                        type: 'function',
                    }
                ];

                const pointsContract = new ethers.Contract(
                    process.env.POINTS_TRACKER_ADDRESS!,
                    POINTS_TRACKER_ABI,
                    provider
                );

                const pointsData = await pointsContract.userPoints(address);
                const points = Number(pointsData[0]) / 1e18;

                // Ensure user exists
                await pool.query(`
                    INSERT INTO users (wallet_address, referral_code, tier, last_active_at)
                    VALUES ($1, $2, 0, NOW())
                    ON CONFLICT (wallet_address) 
                    DO UPDATE SET last_active_at = NOW()
                `, [normalizedAddress, address.slice(2, 8).toUpperCase()]);

                // Clear old points and insert new
                await pool.query('DELETE FROM points WHERE wallet_address = $1', [normalizedAddress]);
                if (points > 0) {
                    await pool.query(`
                        INSERT INTO points (wallet_address, amount, source, metadata)
                        VALUES ($1, $2, 'blockchain_sync', $3)
                    `, [normalizedAddress, Math.floor(points), JSON.stringify({ synced_at: new Date().toISOString() })]);
                }

                console.log(`✅ Synced ${Math.floor(points)} points for ${address.slice(0, 6)}...${address.slice(-4)}`);
            } catch (syncError) {
                console.error('Auto-sync error:', syncError);
                // Continue even if sync fails
            }
        }

        // Get total points
        const totalQuery = await pool.query(
            `SELECT COALESCE(SUM(amount), 0) as total_points
             FROM points 
             WHERE wallet_address = $1`,
            [normalizedAddress]
        );

        // Get points history
        const historyQuery = await pool.query(
            `SELECT amount as points, source, created_at as date
             FROM points 
             WHERE wallet_address = $1 
             ORDER BY created_at DESC 
             LIMIT 100`,
            [normalizedAddress]
        );

        // Get user tier
        const userQuery = await pool.query(
            `SELECT tier FROM users WHERE wallet_address = $1`,
            [normalizedAddress]
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

// GET /api/leaderboard - Top users by points (blockchain-based)
router.get('/leaderboard', async (req, res) => {
    try {
        const { limit = 100, syncAddress } = req.query;

        // If syncAddress provided, ensure user exists in database
        if (syncAddress && typeof syncAddress === 'string') {
            const normalized = syncAddress.toLowerCase();
            // Only update last_active_at if user exists, don't try to create
            await pool.query(`
                INSERT INTO users (wallet_address, referral_code, tier, last_active_at)
                VALUES ($1, $2, 0, NOW())
                ON CONFLICT (wallet_address) DO UPDATE SET last_active_at = NOW()
            `, [normalized, normalized.slice(2, 12).toUpperCase()]); // 10 chars max
        }

        // Get all known user addresses
        const usersQuery = await pool.query(
            `SELECT wallet_address FROM users ORDER BY last_active_at DESC LIMIT $1`,
            [limit]
        );

        if (usersQuery.rows.length === 0) {
            return res.json([]);
        }

        // Fetch points from blockchain for each user
        const POINTS_TRACKER_ABI = [{
            inputs: [{ name: 'user', type: 'address' }],
            name: 'userPoints',
            outputs: [{ name: 'points', type: 'uint256' }, { name: 'lastUpdated', type: 'uint256' }],
            stateMutability: 'view',
            type: 'function',
        }];

        const pointsContract = new ethers.Contract(
            process.env.POINTS_TRACKER_ADDRESS!,
            POINTS_TRACKER_ABI,
            provider
        );

        // Fetch points in parallel
        const leaderboardData = await Promise.all(
            usersQuery.rows.map(async (row) => {
                try {
                    const pointsData = await pointsContract.userPoints(row.wallet_address);
                    return {
                        address: row.wallet_address,
                        points: Math.floor(Number(pointsData[0]) / 1e18),
                    };
                } catch (error) {
                    return { address: row.wallet_address, points: 0 };
                }
            })
        );

        // Sort by points and add ranks
        leaderboardData.sort((a, b) => b.points - a.points);
        const tierNames = ['Novice', 'Scout', 'Captain', 'Whale'];

        const leaderboard = leaderboardData.map((entry, index) => ({
            rank: index + 1,
            address: entry.address,
            points: entry.points,
            tier: tierNames[0],
            referrals: 0,
        }));

        console.log(`✅ Leaderboard: ${leaderboard.length} users, fetched from blockchain`);
        res.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
});

export default router;
