-- Add deposits tracking table for principal/yield calculation
CREATE TABLE IF NOT EXISTS vault_deposits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_address TEXT NOT NULL,
  vault_address TEXT NOT NULL,
  
  -- Deposit information
  initial_amount REAL NOT NULL,      -- USDC deposited
  shares_received REAL NOT NULL,     -- Shares minted
  deposit_timestamp INTEGER NOT NULL,
  tx_hash TEXT UNIQUE NOT NULL,
  
  -- Current state (updated on withdrawals)
  remaining_shares REAL NOT NULL,    -- Shares left after partial withdrawals
  is_fully_withdrawn BOOLEAN DEFAULT 0,
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_address, vault_address, tx_hash)
);

CREATE INDEX IF NOT EXISTS idx_deposits_user ON vault_deposits(user_address);
CREATE INDEX IF NOT EXISTS idx_deposits_vault ON vault_deposits(vault_address);
CREATE INDEX IF NOT EXISTS idx_deposits_user_vault ON vault_deposits(user_address, vault_address);
CREATE INDEX IF NOT EXISTS idx_deposits_timestamp ON vault_deposits(deposit_timestamp DESC);

-- Withdrawals tracking  
CREATE TABLE IF NOT EXISTS vault_withdrawals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_address TEXT NOT NULL,
  vault_address TEXT NOT NULL,
  
  -- Withdrawal information
  shares_burned REAL NOT NULL,
  assets_received REAL NOT NULL,
  withdrawal_timestamp INTEGER NOT NULL,
  tx_hash TEXT UNIQUE NOT NULL,
  
  -- Maturity info
  was_mature BOOLEAN NOT NULL,
  penalty_paid REAL DEFAULT 0,
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tx_hash)
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON vault_withdrawals(user_address);
CREATE INDEX IF NOT EXISTS idx_withdrawals_vault ON vault_withdrawals(vault_address);
CREATE INDEX IF NOT EXISTS idx_withdrawals_timestamp ON vault_withdrawals(withdrawal_timestamp DESC);
