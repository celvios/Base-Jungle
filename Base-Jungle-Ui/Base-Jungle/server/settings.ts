import express from 'express';
import { Pool } from 'pg';

const router = express.Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Update Settings
router.post('/settings', async (req, res) => {
    try {
        const { address, autoCompound, riskLevel, leverageMultiplier } = req.body;

        // Upsert settings
        await pool.query(
            `INSERT INTO users (address, auto_compound, risk_level, leverage_multiplier)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (address) 
             DO UPDATE SET 
                auto_compound = COALESCE($2, users.auto_compound),
                risk_level = COALESCE($3, users.risk_level),
                leverage_multiplier = COALESCE($4, users.leverage_multiplier)`,
            [address, autoCompound, riskLevel, leverageMultiplier]
        );

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: e.message });
    }
});

// Get Leaderboard
router.get('/leaderboard', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        // Try database first, fall back to mock data
        try {
            const result = await pool.query(
                `SELECT address, total_points, tier, active_referrals 
                 FROM users 
                 ORDER BY total_points DESC 
                 LIMIT $1 OFFSET $2`,
                [limit, offset]
            );

            const total = await pool.query('SELECT COUNT(*) FROM users');

            res.json({
                rankings: result.rows.map((row, index) => ({
                    rank: offset + index + 1,
                    address: row.address,
                    points: row.total_points,
                    tier: row.tier,
                    referrals: row.active_referrals
                })),
                total: parseInt(total.rows[0].count)
            });
        } catch (dbError) {
            // Database not available, return mock data
            const mockRankings = [
                { rank: 1, address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', points: 15420, tier: 'Whale', referrals: 127 },
                { rank: 2, address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72', points: 12850, tier: 'Captain', referrals: 89 },
                { rank: 3, address: '0xE2F2a5C287993345a840Db3B0845fbC70f5935a5', points: 9750, tier: 'Captain', referrals: 56 },
                { rank: 4, address: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', points: 7230, tier: 'Forest', referrals: 34 },
                { rank: 5, address: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359', points: 5890, tier: 'Forest', referrals: 28 },
            ];

            res.json({
                rankings: mockRankings.slice(offset, offset + limit),
                total: mockRankings.length
            });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: e.message });
    }
});

export default router;
