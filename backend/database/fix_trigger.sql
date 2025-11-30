-- Fix the trigger to use wallet_address consistently
DROP TRIGGER IF EXISTS update_user_active_on_points ON points;
DROP TRIGGER IF EXISTS update_user_active_on_position ON vault_positions;
DROP FUNCTION IF EXISTS update_user_last_active();

-- Recreate the function with correct field name
CREATE OR REPLACE FUNCTION update_user_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users 
    SET last_active_at = NOW() 
    WHERE wallet_address = NEW.wallet_address;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the triggers
CREATE TRIGGER update_user_active_on_position
AFTER INSERT ON vault_positions
FOR EACH ROW
EXECUTE FUNCTION update_user_last_active();

CREATE TRIGGER update_user_active_on_points
AFTER INSERT ON points
FOR EACH ROW
EXECUTE FUNCTION update_user_last_active();
