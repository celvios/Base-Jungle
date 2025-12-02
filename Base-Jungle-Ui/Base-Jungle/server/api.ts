import { Router, Request, Response } from 'express';
import { Pool } from 'pg';

const router = Router();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Portfolio endpoint - /api/user/:walletAddress/portfolio
router.get('/user/:walletAddress/portfolio', async (req, res) => {
    try {
        const { walletAddress } = req.params;

        // Fetch user's vault positions from database
        // In production, this would query from Ponder/The Graph or on-chain
        const depositsQuery = await pool.query(
            'SELECT SUM(amount) as total_deposited FROM deposits WHERE user_address = $1',
            [walletAddress]
        );

        const harvestsQuery = await pool.query(
            'SELECT SUM(amount) as total_yield FROM harvests WHERE user_address = $1',
            [walletAddress]
        );

        const recentHarvestQuery = await pool.query(
            'SELECT amount, timestamp FROM harvests WHERE user_address = $1 ORDER BY timestamp DESC LIMIT 1',
            [walletAddress]
        );

        const totalDeposited = parseFloat(depositsQuery.rows[0]?.total_deposited || '0');
        const totalYield = parseFloat(harvestsQuery.rows[0]?.total_yield || '0');
        const netWorth = totalDeposited + totalYield;
        const recentHarvest = parseFloat(recentHarvestQuery.rows[0]?.amount || '0');
        const lastHarvestTime = recentHarvestQuery.rows[0]?.timestamp || null;

        // TODO: Fetch positions from contracts or indexer
        const positions = [];

        res.json({
            netWorth,
            totalDeposited,
            totalYield,
            recentHarvest,
            lastHarvestTime,
            positions,
        });
    } catch (error) {
        console.error('Portfolio error:', error);
        res.status(500).json({ error: 'Failed to fetch portfolio' });
    }
});

// Market health endpoint - /api/market/health
router.get('/market/health', async (req, res) => {
    try {
        // Fetch latest market health snapshot
        const result = await pool.query(
            'SELECT current_apy, status, total_tvl, utilization_rate FROM market_health ORDER BY created_at DESC LIMIT 1'
        );

        // Fetch historical APY for seismograph
        const historyResult = await pool.query(
            'SELECT current_apy FROM market_health ORDER BY created_at DESC LIMIT 100'
        );

        const currentAPY = parseFloat(result.rows[0]?.current_apy || '18.5');
        const status = result.rows[0]?.status || 'STABLE';
        const totalTVL = parseFloat(result.rows[0]?.total_tvl || '0');
        const utilizationRate = parseFloat(result.rows[0]?.utilization_rate || '0');
        const historicalAPY = historyResult.rows.map(row => parseFloat(row.current_apy));

        res.json({
            currentAPY,
            status,
            totalTVL,
            utilizationRate,
            historicalAPY,
        });
    } catch (error) {
        console.error('Market health error:', error);
        res.status(500).json({ error: 'Failed to fetch market health' });
    }
});

// APY history endpoint - /api/market/apy-history
router.get('/market/apy-history', async (req, res) => {
    try {
        const { period = '24h' } = req.query;

        // Calculate time range based on period
        const intervalMap = {
            '1h': '1 hour',
            '24h': '24 hours',
            '7d': '7 days',
            '30d': '30 days',
        };

        const interval = intervalMap[period as string] || '24 hours';

        const result = await pool.query(
            `SELECT 
        EXTRACT(EPOCH FROM created_at) * 1000 as timestamp,
        current_apy as apy
       FROM market_health
       WHERE created_at > NOW() - INTERVAL '${interval}'
       ORDER BY created_at ASC`,
        );

        res.json(result.rows);
    } catch (error) {
        console.error('APY history error:', error);
        res.status(500).json({ error: 'Failed to fetch APY history' });
    }
});

// Bot activity endpoint - /api/bot-activity
router.get('/bot-activity', async (req, res) => {
    try {
        const { limit = 10, userAddress } = req.query;

        let query = `
      SELECT 
        id,
        bot_type as type,
        action,
        gas_usd as "gasUsd",
        tx_hash as "txHash",
        EXTRACT(EPOCH FROM created_at) * 1000 as timestamp
      FROM bot_activity
    `;

        const params: any[] = [];

        if (userAddress) {
            query += ' WHERE user_address = $1';
            params.push(userAddress);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (error) {
        console.error('Bot activity error:', error);
        res.status(500).json({ error: 'Failed to fetch bot activity' });
    }
});

// Points endpoint - /api/user/:walletAddress/points
router.get('/user/:walletAddress/points', async (req, res) => {
    try {
        const { walletAddress } = req.params;

        // Calculate total points
        const totalPointsQuery = await pool.query(
            'SELECT SUM(amount) as total_points FROM points WHERE wallet_address = $1',
            [walletAddress]
        );

        // Fetch points history
        const historyQuery = await pool.query(
            `SELECT 
        EXTRACT(EPOCH FROM created_at) * 1000 as date,
        amount as points,
        source
       FROM points
       WHERE wallet_address = $1
       ORDER BY created_at DESC
       LIMIT 100`,
            [walletAddress]
        );

        // Get user tier
        const userQuery = await pool.query(
            'SELECT tier FROM users WHERE wallet_address = $1',
            [walletAddress]
        );

        const totalPoints = parseInt(totalPointsQuery.rows[0]?.total_points || '0');
        const tier = userQuery.rows[0]?.tier || 0;
        const tierNames = ['Novice', 'Scout', 'Captain', 'Whale'];
        const rank = tierNames[tier];

        // Calculate daily point rate (points per day based on TVL)
        const dailyPointRate = Math.floor(totalPoints / 100); // Simplified

        // Next rank calculation
        const nextRankPoints = (tier + 1) * 5000;
        const nextRankName = tierNames[Math.min(tier + 1, 3)];

        res.json({
            totalPoints,
            rank,
            dailyPointRate,
            pointsHistory: historyQuery.rows,
            nextRankPoints,
            nextRankName,
        });
    } catch (error) {
        console.error('Points error:', error);
        res.status(500).json({ error: 'Failed to fetch points' });
    }
});

// Referrals endpoint - /api/user/:walletAddress/referrals
router.get('/user/:walletAddress/referrals', async (req, res) => {
    try {
        const { walletAddress } = req.params;

        // Get user referral code
        const userQuery = await pool.query(
            'SELECT referral_code FROM users WHERE wallet_address = $1',
            [walletAddress]
        );

        const referralCode = userQuery.rows[0]?.referral_code || '';
        const referralLink = `https://basejungle.xyz/ref/${referralCode}`;

        // Count direct referrals
        const directQuery = await pool.query(
            'SELECT COUNT(*) as count FROM referrals WHERE referrer = $1 AND level = 1',
            [walletAddress]
        );

        // Count indirect referrals
        const indirectQuery = await pool.query(
            'SELECT COUNT(*) as count FROM referrals WHERE referrer = $1 AND level = 2',
            [walletAddress]
        );

        // Get referral tree
        const treeQuery = await pool.query(
            `SELECT 
        referee as address,
        level,
        EXTRACT(EPOCH FROM created_at) * 1000 as "joinDate",
        true as "isActive", 
        0 as "totalDeposited"
       FROM referrals
       WHERE referrer = $1
       ORDER BY created_at DESC`,
            [walletAddress]
        );

        // Get user tier
        const tierQuery = await pool.query(
            'SELECT tier FROM users WHERE wallet_address = $1',
            [walletAddress]
        );

        const tier = tierQuery.rows[0]?.tier || 0;
        const tierNames = ['Novice', 'Scout', 'Captain', 'Whale'];
        const currentTier = tierNames[tier];
        const nextTier = tierNames[Math.min(tier + 1, 3)];

        // Calculate requirements
        const directReferrals = parseInt(directQuery.rows[0]?.count || '0');
        const indirectReferrals = parseInt(indirectQuery.rows[0]?.count || '0');
        const activeReferrals = directReferrals; // Simplified
        const nextTierRequirement = (tier + 1) * 5;

        res.json({
            referralCode,
            referralLink,
            directReferrals,
            indirectReferrals,
            activeReferrals,
            currentTier,
            nextTier,
            nextTierRequirement,
            totalBonusPoints: directReferrals * 100 + indirectReferrals * 50,
            referralTree: treeQuery.rows,
        });
    } catch (error) {
        console.error('Referrals error:', error);
        res.status(500).json({ error: 'Failed to fetch referrals' });
    }
});

// Balance history endpoint - /api/user/:walletAddress/balance-history
router.get('/user/:walletAddress/balance-history', async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const { period = '24h', vaultAddress } = req.query;

        // Calculate time range based on period
        const intervalMap: Record<string, string> = {
            '1h': '1 hour',
            '24h': '24 hours',
            '7d': '7 days',
            '30d': '30 days',
        };

        const interval = intervalMap[period as string] || '24 hours';

        let query = `
            SELECT 
                EXTRACT(EPOCH FROM snapshot_time) * 1000 as time,
                SUM(balance_usdc) as value
            FROM balance_snapshots
            WHERE user_address = $1
                AND snapshot_time > NOW() - INTERVAL '${interval}'
        `;

        const params: any[] = [walletAddress];

        if (vaultAddress) {
            query += ' AND vault_address = $2';
            params.push(vaultAddress);
        }

        query += ' GROUP BY snapshot_time ORDER BY snapshot_time ASC';

        const result = await pool.query(query, params);

        // If no data, return current balance as single point
        if (result.rows.length === 0) {
            res.json([{
                time: Date.now(),
                value: 0
            }]);
            return;
        }

        res.json(result.rows);
    } catch (error) {
        console.error('Balance history error:', error);
        res.status(500).json({ error: 'Failed to fetch balance history' });
    }
});

export default router;
