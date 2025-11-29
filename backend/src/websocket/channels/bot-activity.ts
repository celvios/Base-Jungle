import { pool } from '../../database/connection.js';
import { broadcastBotActivity } from '../server.js';

// Poll for new bot activity from database
export async function startBotActivityMonitor() {
    let lastActivityId: string | null = null;

    setInterval(async () => {
        try {
            const query = lastActivityId
                ? `SELECT * FROM bot_activity WHERE id > $1 ORDER BY created_at DESC LIMIT 10`
                : `SELECT * FROM bot_activity ORDER BY created_at DESC LIMIT 1`;

            const params = lastActivityId ? [lastActivityId] : [];
            const result = await pool.query(query, params);

            if (result.rows.length > 0) {
                // Broadcast each new activity
                for (const activity of result.rows) {
                    broadcastBotActivity({
                        id: activity.id,
                        type: activity.bot_type,
                        action: activity.action,
                        gasUsd: parseFloat(activity.gas_usd || '0'),
                        txHash: activity.tx_hash,
                        timestamp: new Date(activity.created_at).getTime(),
                    });
                }

                // Update last seen ID
                lastActivityId = result.rows[0].id;
            }
        } catch (error) {
            console.error('❌ Bot activity monitor error:', error);
        }
    }, 5000); // Poll every 5 seconds

    console.log('✅ Bot activity monitor started');
}

// Listen to PostgreSQL notifications (more efficient than polling)
export async function listenToBotActivityNotifications() {
    const client = await pool.connect();

    try {
        // Listen to a notification channel
        await client.query('LISTEN bot_activity_channel');

        client.on('notification', (msg) => {
            if (msg.channel === 'bot_activity_channel' && msg.payload) {
                try {
                    const activity = JSON.parse(msg.payload);
                    broadcastBotActivity(activity);
                } catch (e) {
                    console.error('Error parsing notification:', e);
                }
            }
        });

        console.log('✅ Listening to bot_activity_channel');
    } catch (error) {
        console.error('❌ Failed to set up notification listener:', error);
        client.release();
        // Fall back to polling
        startBotActivityMonitor();
    }
}

// Create PostgreSQL trigger to send notifications (run this in DB)
export const createNotificationTrigger = `
CREATE OR REPLACE FUNCTION notify_bot_activity()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('bot_activity_channel', row_to_json(NEW)::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bot_activity_notify ON bot_activity;
CREATE TRIGGER bot_activity_notify
AFTER INSERT ON bot_activity
FOR EACH ROW
EXECUTE FUNCTION notify_bot_activity();
`;
