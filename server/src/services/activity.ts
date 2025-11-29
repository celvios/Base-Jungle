import { dbRun, dbGet, dbAll } from '../db/database';

export interface Activity {
    id?: number;
    tx_hash: string;
    block_number: number;
    timestamp: number;
    event_type: 'deposit' | 'withdraw' | 'harvest' | 'strategy_change' | 'referral';
    user_address: string;
    vault_address?: string;
    amount?: number;
    metadata?: any;
    created_at?: string;
}

/**
 * Get recent activities for Sonar feed
 */
export async function getRecentActivities(limit: number = 50, offset: number = 0): Promise<Activity[]> {
    return dbAll(
        `SELECT * FROM activities
     ORDER BY timestamp DESC
     LIMIT ? OFFSET ?`,
        [limit, offset]
    ) as Promise<Activity[]>;
}

/**
 * Get user-specific activities
 */
export async function getUserActivities(address: string, limit: number = 20): Promise<Activity[]> {
    return dbAll(
        `SELECT * FROM activities
     WHERE LOWER(user_address) = LOWER(?)
     ORDER BY timestamp DESC
     LIMIT ?`,
        [address, limit]
    ) as Promise<Activity[]>;
}

/**
 * Add new activity to database
 */
export async function addActivity(activity: Activity): Promise<void> {
    const metadata = activity.metadata ? JSON.stringify(activity.metadata) : null;

    await dbRun(
        `INSERT OR IGNORE INTO activities 
     (tx_hash, block_number, timestamp, event_type, user_address, vault_address, amount, metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            activity.tx_hash,
            activity.block_number,
            activity.timestamp,
            activity.event_type,
            activity.user_address.toLowerCase(),
            activity.vault_address?.toLowerCase() || null,
            activity.amount || null,
            metadata
        ]
    );
}

/**
 * Get activity statistics
 */
export async function getActivityStats() {
    const stats = await dbGet(
        `SELECT 
      COUNT(*) as total_activities,
      COUNT(DISTINCT user_address) as unique_users,
      SUM(CASE WHEN event_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
      SUM(CASE WHEN event_type = 'withdraw' THEN amount ELSE 0 END) as total_withdrawals,
      MAX(timestamp) as last_activity
     FROM activities`
    );

    return stats || {
        total_activities: 0,
        unique_users: 0,
        total_deposits: 0,
        total_withdrawals: 0,
        last_activity: null
    };
}

/**
 * Clear old activities (optional cleanup)
 */
export async function cleanOldActivities(daysToKeep: number = 90): Promise<void> {
    const cutoffTimestamp = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 60 * 60);

    await dbRun(
        `DELETE FROM activities WHERE timestamp < ?`,
        [cutoffTimestamp]
    );
}
