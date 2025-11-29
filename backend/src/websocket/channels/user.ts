import { pool } from '../../database/connection.js';
import { broadcastUserUpdate } from '../server.js';

// Watch for user-specific updates
const userWatchers = new Map<string, NodeJS.Timeout>();

export function watchUserUpdates(userAddress: string) {
    const normalizedAddress = userAddress.toLowerCase();

    // Don't create duplicate watchers
    if (userWatchers.has(normalizedAddress)) {
        return;
    }

    let lastCheck = new Date();

    const interval = setInterval(async () => {
        try {
            // Check for new vault positions
            const positionsQuery = await pool.query(`
                SELECT * FROM vault_positions 
                WHERE user_address = $1 
                AND (created_at > $2 OR updated_at > $2)
                ORDER BY created_at DESC
            `, [normalizedAddress, lastCheck]);

            // Check for new points
            const pointsQuery = await pool.query(`
                SELECT * FROM points 
                WHERE wallet_address = $1 
                AND created_at > $2
                ORDER BY created_at DESC
            `, [normalizedAddress, lastCheck]);

            if (positionsQuery.rows.length > 0 || pointsQuery.rows.length > 0) {
                // Fetch complete user portfolio
                const portfolioQuery = await pool.query(`
                    SELECT 
                        COALESCE(SUM(principal), 0) as total_deposited,
                        COUNT(*) FILTER (WHERE is_active = true) as active_positions
                    FROM vault_positions 
                    WHERE user_address = $1
                `, [normalizedAddress]);

                const pointsTotalQuery = await pool.query(`
                    SELECT COALESCE(SUM(amount), 0) as total_points 
                    FROM points 
                    WHERE wallet_address = $1
                `, [normalizedAddress]);

                const portfolio = portfolioQuery.rows[0];
                const pointsTotal = pointsTotalQuery.rows[0];

                broadcastUserUpdate(normalizedAddress, {
                    type: 'portfolio-update',
                    data: {
                        totalDeposited: portfolio.total_deposited.toString(),
                        activePositions: parseInt(portfolio.active_positions),
                        totalPoints: parseInt(pointsTotal.total_points),
                        newPositions: positionsQuery.rows,
                        newPoints: pointsQuery.rows,
                    },
                    timestamp: Date.now(),
                });
            }

            lastCheck = new Date();
        } catch (error) {
            console.error(`❌ Error watching user ${normalizedAddress}:`, error);
        }
    }, 5000); // Check every 5 seconds

    userWatchers.set(normalizedAddress, interval);
    console.log(`✅ Started watching user: ${normalizedAddress}`);
}

export function unwatchUserUpdates(userAddress: string) {
    const normalizedAddress = userAddress.toLowerCase();
    const interval = userWatchers.get(normalizedAddress);

    if (interval) {
        clearInterval(interval);
        userWatchers.delete(normalizedAddress);
        console.log(`🛑 Stopped watching user: ${normalizedAddress}`);
    }
}

// Clean up inactive watchers periodically
export function cleanupInactiveWatchers() {
    setInterval(() => {
        console.log(`📊 Active user watchers: ${userWatchers.size}`);
    }, 60000); // Log every minute
}
