-- Initial seed data for Base Jungle
-- This runs after schema creation

-- Insert initial market health snapshot
INSERT INTO market_health (current_apy, status, total_tvl, conservative_tvl, aggressive_tvl, utilization_rate, total_users, active_positions)
VALUES (18.50, 'STABLE', 0, 0, 0, 0.00, 0, 0);

-- Insert sample bot activity for UI testing (optional)
INSERT INTO bot_activity (bot_type, action, gas_used, gas_usd, tx_hash, block_number)
VALUES 
    ('HARVESTER', 'Harvested 150 AERO from gauge', 250000, 0.15, '0x' || md5(random()::text), 1),
    ('REBALANCER', 'Rebalanced portfolio', 180000, 0.11, '0x' || md5(random()::text), 2),
    ('ARBITRAGE', 'Executed arbitrage trade', 320000, 0.19, '0x' || md5(random()::text), 3);

-- Note: Users are created when they connect their wallet and sign in
-- Referral codes are generated dynamically
