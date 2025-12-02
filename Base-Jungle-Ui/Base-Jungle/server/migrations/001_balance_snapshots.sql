-- Balance Snapshots Table
-- Stores hourly snapshots of user vault balances for historical charting

CREATE TABLE IF NOT EXISTS balance_snapshots (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL,
    vault_address VARCHAR(42) NOT NULL,
    balance_usdc DECIMAL(20, 6) NOT NULL,
    share_balance DECIMAL(30, 18) NOT NULL,
    snapshot_time TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for fast queries by user and time
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_user_time 
ON balance_snapshots(user_address, snapshot_time DESC);

-- Index for vault queries
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_vault 
ON balance_snapshots(vault_address, snapshot_time DESC);

-- Composite index for user + vault queries
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_user_vault_time 
ON balance_snapshots(user_address, vault_address, snapshot_time DESC);
