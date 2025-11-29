import { Router } from 'express';
import { getRecentActivities, getUserActivities, getActivityStats } from '../services/activity';

export const activityRouter = Router();

// GET /api/activities?limit=50&offset=0
activityRouter.get('/activities', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
        const offset = parseInt(req.query.offset as string) || 0;

        const activities = await getRecentActivities(limit, offset);

        res.json({
            success: true,
            activities,
            count: activities.length,
            limit,
            offset,
        });
    } catch (error: any) {
        console.error('Activities error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/activities/user/:address
activityRouter.get('/activities/user/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

        if (!address || !address.startsWith('0x')) {
            return res.status(400).json({
                success: false,
                error: 'Invalid address'
            });
        }

        const activities = await getUserActivities(address, limit);

        res.json({
            success: true,
            activities,
            count: activities.length,
        });
    } catch (error: any) {
        console.error('User activities error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/activities/stats
activityRouter.get('/activities/stats', async (req, res) => {
    try {
        const stats = await getActivityStats();

        res.json({
            success: true,
            ...stats,
        });
    } catch (error: any) {
        console.error('Activity stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
