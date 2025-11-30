import { Router } from 'express';
import { pool } from '../database/connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__dirname);

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
                'sessions'
            ]
        });

    } catch (err: any) {
        console.error('❌ Migration failed:', err);
        res.status(500).json({ success: false, error: err.message, hint: 'Check if DATABASE_URL is set correctly' });
    }
});

// Fix trigger endpoint - updates existing triggers without recreating tables
router.get('/fix-trigger', async (req, res) => {
    try {
        const client = await pool.connect();

        try {
            console.log('🔧 Fixing database triggers...');

            // Drop old triggers and function
            await client.query('DROP TRIGGER IF EXISTS update_user_active_on_points ON points');
            await client.query('DROP TRIGGER IF EXISTS update_user_active_on_position ON vault_positions');
            await client.query('DROP FUNCTION IF EXISTS update_user_last_active()');

            // Recreate function with correct field name
            await client.query(`
                CREATE OR REPLACE FUNCTION update_user_last_active()
                RETURNS TRIGGER AS $$
                BEGIN
                    UPDATE users 
                    SET last_active_at = NOW() 
                    WHERE wallet_address = NEW.wallet_address;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            `);

            // Recreate triggers
            await client.query(`
                CREATE TRIGGER update_user_active_on_position
                AFTER INSERT ON vault_positions
                FOR EACH ROW
                EXECUTE FUNCTION update_user_last_active();
            `);

            await client.query(`
                CREATE TRIGGER update_user_active_on_points
                AFTER INSERT ON points
                FOR EACH ROW
                EXECUTE FUNCTION update_user_last_active();
            `);

            console.log('✅ Triggers fixed successfully');

            res.json({
                success: true,
                message: 'Database triggers updated successfully'
            });

        } finally {
            client.release();
        }

    } catch (err: any) {
        console.error('❌ Trigger fix failed:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;
