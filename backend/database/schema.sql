-- Base Jungle Database Schema
-- PostgreSQL 15+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
    wallet_address VARCHAR(42) PRIMARY KEY,
    username VARCHAR(50),
    referral_code VARCHAR(10) UNIQUE NOT NULL,
    referred_by VARCHAR(42),
    tier INTEGER DEFAULT 0 CHECK (tier >= 0 AND tier <= 3), -- 0=Novice, 1=Scout, 2=Captain, 3=Whale
    
    -- Settings
    auto_compound BOOLEAN DEFAULT true,
    risk_level INTEGER DEFAULT 0 CHECK (risk_level >= 0 AND risk_level <= 2), -- 0=low, 1=medium, 2=high
    leverage_active BOOLEAN DEFAULT false,
    leverage_multiplier INTEGER DEFAULT 1 CHECK (leverage_multiplier IN (1, 2, 3, 5)),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    last_active_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (referred_by) REFERENCES users(wallet_address) ON DELETE SET NULL
);

CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_referred_by ON users(referred_by);
CREATE INDEX idx_users_tier ON users(tier);


-- ============================================================================
-- VAULT POSITIONS TABLE
-- ============================================================================
CREATE TABLE vault_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_address VARCHAR(42) NOT NULL,
    vault_address VARCHAR(42) NOT NULL,
    vault_type VARCHAR(20) NOT NULL CHECK (vault_type IN ('conservative', 'aggressive')),
    
    -- Amounts (stored as strings to handle uint256)
    principal NUMERIC(78, 0) NOT NULL,
    shares NUMERIC(78, 0) NOT NULL,
    
    -- Timestamps
    deposited_at TIMESTAMP NOT NULL,
    last_harvest_at TIMESTAMP,
    withdrawn_at TIMESTAMP,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Transaction reference
    deposit_tx_hash VARCHAR(66),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

CREATE INDEX idx_vault_positions_user ON vault_positions(user_address);
CREATE INDEX idx_vault_positions_vault ON vault_positions(vault_address);
CREATE INDEX idx_vault_positions_active ON vault_positions(is_active);
CREATE INDEX idx_vault_positions_deposited_at ON vault_positions(deposited_at);


-- ============================================================================
-- POINTS TABLE
-- ============================================================================
CREATE TABLE points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) NOT NULL,
    amount INTEGER NOT NULL,
    source VARCHAR(20) NOT NULL CHECK (source IN ('deposit', 'harvest', 'referral', 'bonus', 'daily', 'tier_upgrade')),
    
    -- Optional metadata (JSON for flexibility)
    metadata JSONB,
    
    -- Transaction reference (if applicable)
    tx_hash VARCHAR(66),
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

CREATE INDEX idx_points_wallet ON points(wallet_address);
CREATE INDEX idx_points_source ON points(source);
CREATE INDEX idx_points_created_at ON points(created_at DESC);

-- View for quick points totals
CREATE VIEW user_points_totals AS
SELECT 
    wallet_address,
    SUM(amount) as total_points,
    COUNT(*) as point_events
FROM points
GROUP BY wallet_address;


-- ============================================================================
-- REFERRALS TABLE
-- ============================================================================
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer VARCHAR(42) NOT NULL,
    referee VARCHAR(42) NOT NULL,
    level INTEGER NOT NULL CHECK (level IN (1, 2)), -- 1=direct, 2=indirect
    
    -- Activity tracking
    is_active BOOLEAN DEFAULT true,
    total_deposited NUMERIC(78, 0) DEFAULT 0,
    last_deposit_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (referrer) REFERENCES users(wallet_address) ON DELETE CASCADE,
    FOREIGN KEY (referee) REFERENCES users(wallet_address) ON DELETE CASCADE,
    UNIQUE(referrer, referee)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer);
CREATE INDEX idx_referrals_referee ON referrals(referee);
CREATE INDEX idx_referrals_level ON referrals(level);
CREATE INDEX idx_referrals_active ON referrals(is_active);

-- View for referral counts
CREATE VIEW referral_counts AS
SELECT 
    referrer,
    COUNT(CASE WHEN level = 1 THEN 1 END) as direct_referrals,
    COUNT(CASE WHEN level = 2 THEN 1 END) as indirect_referrals,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_referrals
FROM referrals
GROUP BY referrer;


-- ============================================================================
-- BOT ACTIVITY TABLE
-- ============================================================================
CREATE TABLE bot_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_type VARCHAR(20) NOT NULL CHECK (bot_type IN ('HARVESTER', 'REBALANCER', 'LIQUIDATOR', 'ARBITRAGE')),
    action TEXT NOT NULL,
    
    -- Optional user context
    user_address VARCHAR(42),
    vault_id VARCHAR(42),
    
    -- Amounts
    amount_processed NUMERIC(78, 0),
    
    -- Gas tracking
    gas_used NUMERIC(78, 0),
    gas_usd NUMERIC(10, 2),
    
    -- Transaction
    tx_hash VARCHAR(66) NOT NULL UNIQUE,
    block_number BIGINT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE SET NULL
);

CREATE INDEX idx_bot_activity_type ON bot_activity(bot_type);
CREATE INDEX idx_bot_activity_user ON bot_activity(user_address);
CREATE INDEX idx_bot_activity_created_at ON bot_activity(created_at DESC);
CREATE INDEX idx_bot_activity_tx_hash ON bot_activity(tx_hash);


-- ============================================================================
-- MARKET HEALTH TABLE
-- ============================================================================
CREATE TABLE market_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    current_apy NUMERIC(5, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'STABLE' CHECK (status IN ('STABLE', 'VOLATILE', 'CRISIS')),
    
    -- TVL tracking
    total_tvl NUMERIC(78, 0) NOT NULL,
    conservative_tvl NUMERIC(78, 0),
    aggressive_tvl NUMERIC(78, 0),
    
    -- Utilization
    utilization_rate NUMERIC(5, 2),
    
    -- Additional metrics
    total_users INTEGER,
    active_positions INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_market_health_created_at ON market_health(created_at DESC);

-- View for latest market health
CREATE VIEW latest_market_health AS
SELECT * FROM market_health
ORDER BY created_at DESC
LIMIT 1;


-- ============================================================================
-- TRANSACTIONS TABLE (Track pending/confirmed)
-- ============================================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_address VARCHAR(42) NOT NULL,
    tx_type VARCHAR(20) NOT NULL CHECK (tx_type IN ('deposit', 'withdraw', 'harvest', 'compound', 'settings')),
    
    -- Transaction details
    tx_hash VARCHAR(66) UNIQUE,
    nonce INTEGER,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'reverted')),
    
    -- Metadata
    metadata JSONB,
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    confirmed_at TIMESTAMP,
    
    FOREIGN KEY (user_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

CREATE INDEX idx_transactions_user ON transactions(user_address);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);


-- ============================================================================
-- SESSIONS TABLE (For SIWE authentication)
-- ============================================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address VARCHAR(42) NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    
    -- Session metadata
    ip_address INET,
    user_agent TEXT,
    
    -- Expiry
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    last_accessed_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (wallet_address) REFERENCES users(wallet_address) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_wallet ON sessions(wallet_address);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Auto-cleanup expired sessions (can be run by cron)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to vault_positions
CREATE TRIGGER update_vault_positions_updated_at
BEFORE UPDATE ON vault_positions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Update last_active_at on user activity
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET last_active_at = NOW() 
    WHERE wallet_address = NEW.user_address;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_active_on_position
AFTER INSERT ON vault_positions
FOR EACH ROW
EXECUTE FUNCTION update_user_last_active();

CREATE TRIGGER update_user_active_on_points
AFTER INSERT ON points
FOR EACH ROW
EXECUTE FUNCTION update_user_last_active();
