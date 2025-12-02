# Render Deployment Guide

## 1. Run Database Migration

### Option A: Via Render Shell (Recommended)

1. Go to your Render Dashboard: https://dashboard.render.com
2. Navigate to your PostgreSQL database
3. Click "Connect" → "External Connection"
4. Copy the connection string
5. Run migration locally:

```bash
psql "postgresql://..." < Base-Jungle-Ui/Base-Jungle/server/migrations/001_balance_snapshots.sql
```

### Option B: Via Render Shell (Web Service)

1. Go to your Web Service on Render
2. Click "Shell" tab
3. Run:

```bash
psql $DATABASE_URL < server/migrations/001_balance_snapshots.sql
```

## 2. Set Up Cron Job on Render

### Create a New Cron Job Service

1. Go to Render Dashboard
2. Click "New +" → "Cron Job"
3. Configure:
   - **Name**: `balance-snapshot-job`
   - **Repository**: Same as your web service
   - **Branch**: `main`
   - **Command**: 
     ```bash
     cd Base-Jungle-Ui/Base-Jungle && npx ts-node server/jobs/snapshot-balances.ts
     ```
   - **Schedule**: `0 * * * *` (every hour at minute 0)
   - **Environment**: Same as your web service

4. Add Environment Variables:
   - `DATABASE_URL` (copy from your web service)
   - `VITE_CONSERVATIVE_VAULT_ADDRESS`
   - `VITE_AGGRESSIVE_VAULT_ADDRESS`

5. Click "Create Cron Job"

## 3. Manual Test (First Run)

To populate initial data, run the snapshot job manually:

1. Go to the Cron Job service
2. Click "Trigger Run"
3. Check logs to verify it completed successfully

## 4. Verify Deployment

### Check Migration

```sql
-- Connect to your database and run:
SELECT * FROM balance_snapshots LIMIT 5;
```

### Check API Endpoint

```bash
curl https://base-jungle.onrender.com/api/user/0xYourAddress/balance-history?period=24h
```

## 5. Monitor Cron Job

- Cron job logs are available in Render Dashboard
- Check "Events" tab to see execution history
- Snapshots should run every hour

## Troubleshooting

### Migration Fails

- Ensure DATABASE_URL is correct
- Check if table already exists: `\dt balance_snapshots`
- Drop and recreate if needed: `DROP TABLE balance_snapshots CASCADE;`

### Cron Job Fails

- Check environment variables are set
- Verify vault addresses are correct
- Check logs for specific error messages

### No Data in Charts

- Ensure cron job has run at least once
- Check `balance_snapshots` table has data
- Verify API endpoint returns data
- Check frontend is using correct API_URL

## Notes

- First snapshot may take 5-10 minutes depending on user count
- Subsequent snapshots are faster (only active users)
- Consider adding cleanup job for old snapshots (>30 days)
