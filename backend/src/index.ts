import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initializeDatabase, closeDatabase } from './database/connection.js';
import { initializeWebSocket, getConnectionCount } from './websocket/server.js';
import { startBotActivityMonitor } from './websocket/channels/bot-activity.js';
import { startMarketHealthMonitor, scheduleMarketHealthUpdates } from './websocket/channels/market.js';
import { cleanupInactiveWatchers } from './websocket/channels/user.js';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import userRoutes from './routes/user.js';
import migrateRoutes from './routes/migrate.js';
import adminRoutes from './routes/admin.js';
import syncRoutes from './routes/sync.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"], // Allow inline scripts for admin interface
        }
    }
}));
import activitiesRoutes from './routes/activities.js';

// ... imports

app.use(cors({
    origin: [
        'https://base-jungle.vercel.app',
        'https://base-jungle.onrender.com',
        'http://localhost:5173',
        'http://localhost:3000'
    ],
    credentials: true
}));
app.use(express.json()); // Parse JSON request bodies

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/deposit', transactionRoutes);
app.use('/api', userRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api', migrateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sync', syncRoutes);

app.get('/api/status', (req, res) => {
    res.json({
        message: 'Base Jungle Backend API - Complete!',
        features: {
            database: true,
            websocket: true,
            authentication: true,
            transactions: true,
            userManagement: true,
        },
        connections: getConnectionCount(),
    });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
    try {
        // Initialize database connections
        await initializeDatabase();

        // Create HTTP server
        const httpServer = createServer(app);

        // Initialize WebSocket
        initializeWebSocket(httpServer);

        // Start monitoring channels
        startBotActivityMonitor();
        startMarketHealthMonitor();
        scheduleMarketHealthUpdates();
        cleanupInactiveWatchers();

        // Start HTTP server
        httpServer.listen(PORT, () => {
            console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
            console.log(`📊 Health check: http://localhost:${PORT}/health`);
            console.log(`🔌 WebSocket ready for connections`);
            console.log(`🔍 Environment: ${process.env.NODE_ENV}\n`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await closeDatabase();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await closeDatabase();
    process.exit(0);
});

// Start the server
startServer();
