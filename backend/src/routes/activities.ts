import { Router } from 'express';
import { pool } from '../database/connection.js';

const router = Router();

// GET /api/activities - Recent activities
router.get('/', async (req, res) => {
    try {
        const { limit = 50 } = req.query;

        // For now, return empty list or mock data if table doesn't exist
        // In a real scenario, you'd query an 'activities' table
        // This is a placeholder to prevent 404s
        const activities = [];

        res.json({
            activities,
            count: 0
        });
    } catch (error) {
        console.error('Activities error:', error);
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});

// GET /api/activities/user/:address - User activities
router.get('/user/:address', async (req, res) => {
    try {
        const { address } = req.params;
        const { limit = 20 } = req.query;

        // Placeholder
        const activities = [];

        res.json({
            activities,
            count: 0
        });
    } catch (error) {
        console.error('User activities error:', error);
        res.status(500).json({ error: 'Failed to fetch user activities' });
    }
});

// GET /api/activities/stats - Activity stats
router.get('/stats', async (req, res) => {
    try {
        res.json({
            total_activities: 0,
            unique_users: 0,
            total_deposits: 0,
            total_withdrawals: 0,
            last_activity: null
        });
    } catch (error) {
        console.error('Activity stats error:', error);
        res.status(500).json({ error: 'Failed to fetch activity stats' });
    }
});

export default router;
