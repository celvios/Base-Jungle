import { Router } from 'express';
import { pool } from '../database/connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/migrate - Run database migrations
router.get('/migrate', async (req, res) => {
    try {
        console.log('🔄 Starting database migration...');

        // Read schema.sql
        const schemaPath = path.join(__dirname, '../../database/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Run schema
        await pool.query(schema);
        console.log('✅ Schema created');

        // Read seed data
        const seedPath = path.join(__dirname, '../../database/seeds/initial_data.sql');
        const seedData = fs.readFileSync(seedPath, 'utf8');

        // Run seed data
        await pool.query(seedData);
        console.log('✅ Seed data inserted');

        res.json({
            success: true,
            message: 'Database migrated successfully!',
            tables: [
                'users',
                'vault_positions',
                'points',
                'referrals',
                'bot_activity',
                'market_health',
                'transactions',
        // Check if tables exist
        const result = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

            const tables = result.rows.map(r => r.table_name);

            res.json({
                success: true,
                tablesExist: tables.length > 0,
                tables: tables,
                expectedTables: [
                    'users',
                    'vault_positions',
                    'points',
                    'referrals',
                    'bot_activity',
                    'market_health',
                    'transactions',
                    'sessions'
                ]
            });

        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

export default router;
