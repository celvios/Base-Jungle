import { Router } from 'express';
import { getLeaderboard, getUserRank, getStats } from '../services/ranking';

export const leaderboardRouter = Router();

// GET /api/leaderboard?limit=100&offset=0
leaderboardRouter.get('/leaderboard', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
        const offset = parseInt(req.query.offset as string) || 0;

        const leaderboard = await getLeaderboard(limit, offset);

        res.json({
            success: true,
            leaderboard,
            limit,
            offset,
            count: leaderboard.length,
        });
    } catch (error: any) {
        console.error('Leaderboard error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/user/:address/rank
leaderboardRouter.get('/user/:address/rank', async (req, res) => {
    try {
        const { address } = req.params;

        if (!address || !address.startsWith('0x')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid address'
            });
        }

        const rankData = await getUserRank(address);

        if (!rankData) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            ...rankData,
        });
    } catch (error: any) {
        console.error('User rank error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/stats
leaderboardRouter.get('/stats', async (req, res) => {
    try {
        const stats = await getStats();

        // Safely access properties
        res.json({
            success: true,
            total_users: stats.total_users || 0,
            total_points: stats.total_points || 0,
            average_points: stats.average_points || 0,
            highest_points: stats.highest_points || 0,
        });
    } catch (error: any) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: true,
            error: error.message
        });
    }
});
