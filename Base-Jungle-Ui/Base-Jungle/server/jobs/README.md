# Backend Historical Data Tracking

This directory contains the backend infrastructure for tracking user balance history.

## Setup

### 1. Run Database Migration

```bash
psql $DATABASE_URL < server/migrations/001_balance_snapshots.sql
```

### 2. Set Up Cron Job

Add to your crontab (or use a service like Render Cron Jobs):

```bash
# Snapshot balances every hour
0 * * * * cd /path/to/Base-Jungle && node -r ts-node/register server/jobs/snapshot-balances.ts
```

**For Render/Railway/Heroku:**
- Add a "Cron Job" service
- Command: `node -r ts-node/register server/jobs/snapshot-balances.ts`
- Schedule: `0 * * * *` (every hour)

### 3. Manual Snapshot (Testing)

```bash
cd Base-Jungle-Ui/Base-Jungle
npx ts-node server/jobs/snapshot-balances.ts
```

## API Endpoints

### Get Balance History

```
GET /api/user/:walletAddress/balance-history?period=24h
```

**Query Parameters:**
- `period`: `1h`, `24h`, `7d`, `30d` (default: `24h`)
- `vaultAddress` (optional): Filter by specific vault

**Response:**
```json
[
  { "time": 1701234567000, "value": 1250.50 },
  { "time": 1701238167000, "value": 1255.75 }
]
```

## How It Works

1. **Snapshot Job** runs hourly via cron
2. Queries all users from `deposits` and `users` tables
3. For each user, reads their vault balance from the blockchain
4. Stores snapshot in `balance_snapshots` table
5. Frontend queries `/api/user/:address/balance-history` for chart data

## Database Schema

```sql
balance_snapshots (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(42),
    vault_address VARCHAR(42),
    balance_usdc DECIMAL(20, 6),
    share_balance DECIMAL(30, 18),
    snapshot_time TIMESTAMP,
    created_at TIMESTAMP
)
```

## Notes

- Snapshots are taken hourly to balance accuracy vs database size
- Old snapshots (>30 days) should be archived/deleted periodically
- The job skips users with zero balance to save resources
