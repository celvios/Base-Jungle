-- Users table with leaderboard data
CREATE TABLE IF NOT EXISTS users (
  address TEXT PRIMARY KEY,
  points INTEGER NOT NULL DEFAULT 0,
  tier INTEGER NOT NULL DEFAULT 0,
  direct_referrals INTEGER NOT NULL DEFAULT 0,
  indirect_referrals INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  rank INTEGER
);

-- Index for fast ranking queries
CREATE INDEX IF NOT EXISTS idx_points ON users(points DESC);
CREATE INDEX IF NOT EXISTS idx_rank ON users(rank ASC);

-- Historical leaderboard snapshots
CREATE TABLE IF NOT EXISTS leaderboard_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address TEXT NOT NULL,
  points INTEGER NOT NULL,
  rank INTEGER NOT NULL,
  snapshot_date DATE NOT NULL,
  FOREIGN KEY (address) REFERENCES users(address)
);

CREATE INDEX IF NOT EXISTS idx_history_date ON leaderboard_history(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_history_address ON leaderboard_history(address);

-- Activities/Events table for Sonar feed
CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tx_hash TEXT UNIQUE NOT NULL,
  block_number INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  user_address TEXT NOT NULL,
  vault_address TEXT,
  amount REAL,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_address);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(event_type);
