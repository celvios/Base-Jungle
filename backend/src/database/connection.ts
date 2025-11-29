import { Pool } from 'pg';
import { createClient } from 'redis';

// PostgreSQL connection pool with explicit configuration
export const pool = new Pool({
    user: 'basejungle',
    password: 'basejungle_dev_pass',
    host: 'localhost',
    port: 5432,
    database: 'basejungle',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ PostgreSQL error:', err);
    process.exit(-1);
});

// Redis client
export const redis = createClient({
    url: process.env.REDIS_URL,
});

redis.on('connect', () => {
    console.log('✅ Connected to Redis');
});

redis.on('error', (err) => {
    console.error('❌ Redis error:', err);
});

// Initialize connections
export async function initializeDatabase() {
    try {
        // Test PostgreSQL
        await pool.query('SELECT 1');
        console.log('✅ PostgreSQL connection verified');

        // Connect Redis
        await redis.connect();
        console.log('✅ Redis connection verified');

        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        throw error;
    }
}

// Graceful shutdown
export async function closeDatabase() {
    await pool.end();
    await redis.quit();
    console.log('🔌 Database connections closed');
}
