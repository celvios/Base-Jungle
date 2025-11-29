import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { leaderboardRouter } from './routes/leaderboard';
import { activityRouter } from './routes/activity';
import { initializeDatabase } from './db/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', leaderboardRouter);
app.use('/api', activityRouter);

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Initialize and start server
async function start() {
    try {
        console.log('🚀 Starting Base Jungle API Server...\n');

        // Initialize database
        await initializeDatabase();

        // Start server
        app.listen(PORT, () => {
            console.log(`\n✅ Server running on http://localhost:${PORT}`);
            console.log(`📊 API endpoints:`);
            console.log(`   GET /api/leaderboard`);
            console.log(`   GET /api/user/:address/rank`);
            console.log(`   GET /api/stats`);
            console.log(`   GET /api/activities`);
            console.log(`   GET /api/activities/user/:address`);
            console.log(`\n🔄 To sync blockchain data, run: npm run sync\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

start();
