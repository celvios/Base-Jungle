import { pool } from '../../database/connection.js';
import { broadcastMarketHealth } from '../server.js';

// Poll for market health updates
export async function startMarketHealthMonitor() {
    let lastUpdate: Date | null = null;

    setInterval(async () => {
        try {
            const query = lastUpdate
                ? `SELECT * FROM market_health WHERE created_at > $1 ORDER BY created_at DESC LIMIT 1`
                : `SELECT * FROM market_health ORDER BY created_at DESC LIMIT 1`;

            const params = lastUpdate ? [lastUpdate] : [];
            const result = await pool.query(query, params);

            if (result.rows.length > 0) {
                const health = result.rows[0];

                broadcastMarketHealth({
                    currentAPY: parseFloat(health.current_apy),
                    status: health.status,
                    totalTVL: health.total_tvl.toString(),
                    utilizationRate: parseFloat(health.utilization_rate || '0'),
                    timestamp: new Date(health.created_at).getTime(),
                });

                lastUpdate = health.created_at;
            }
        } catch (error) {
            console.error('❌ Market health monitor error:', error);
        }
    }, 10000); // Poll every 10 seconds

    console.log('✅ Market health monitor started');
}

// Calculate and insert market health snapshot
export async function updateMarketHealthSnapshot() {
    try {
        // Get total TVL from vault positions
        const tvlQuery = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN vault_type = 'conservative' THEN principal ELSE 0 END), 0) as conservative_tvl,
                COALESCE(SUM(CASE WHEN vault_type = 'aggressive' THEN principal ELSE 0 END), 0) as aggressive_tvl,
                COUNT(DISTINCT user_address) as total_users,
                COUNT(*) FILTER (WHERE is_active = true) as active_positions
            FROM vault_positions
        `);

        const tvlData = tvlQuery.rows[0];
        const conservativeTvl = BigInt(tvlData.conservative_tvl || '0');
        const aggressiveTvl = BigInt(tvlData.aggressive_tvl || '0');
        const totalTvl = conservativeTvl + aggressiveTvl;

        // Calculate APY (placeholder - would come from contract calls)
        const currentApy = 18.5;

        // Determine status based on TVL changes
        const status = 'STABLE'; // Can be enhanced with actual volatility calculation

        // Insert snapshot
        await pool.query(`
            INSERT INTO market_health (
                current_apy, status, total_tvl, 
                conservative_tvl, aggressive_tvl,
                utilization_rate, total_users, active_positions
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            currentApy,
            status,
            totalTvl.toString(),
            conservativeTvl.toString(),
            aggressiveTvl.toString(),
            75.0, // Placeholder
            parseInt(tvlData.total_users),
            parseInt(tvlData.active_positions),
        ]);

        console.log('✅ Market health snapshot updated');
    } catch (error) {
        console.error('❌ Failed to update market health:', error);
    }
}

// Schedule periodic snapshots
export function scheduleMarketHealthUpdates() {
    // Update every 5 minutes
    setInterval(updateMarketHealthSnapshot, 5 * 60 * 1000);

    // Initial update
    updateMarketHealthSnapshot();

    console.log('✅ Market health updates scheduled');
}
