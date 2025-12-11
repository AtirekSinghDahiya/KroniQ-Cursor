-- Migration: Change token allocation to 500k for first 100 users
-- Previously: 5M tokens for first 105 users
-- New: 500k tokens for first 100 users, 150k for everyone else

-- 1. Update the promotional campaign token amount from 5M to 500k
UPDATE promotional_campaigns
SET 
  token_amount = 500000,  -- 500k tokens (was 5M)
  max_redemptions = 100   -- 100 users (was 105)
WHERE campaign_code = 'FIRST100';

-- 2. Recreate the unified profile initialization trigger with new values
CREATE OR REPLACE FUNCTION unified_profile_initialization()
RETURNS TRIGGER AS $$
DECLARE
  v_bonus_eligible BOOLEAN := FALSE;
  v_current_bonus_count INT;
  v_max_bonus_users INT := 100;  -- Changed from 105 to 100
  v_bonus_tokens BIGINT := 500000;  -- Changed from 5M to 500k
  v_base_tokens BIGINT := 150000;  -- 150k base for all users
BEGIN
  -- Always ensure base token allocation (150k for everyone)
  NEW.tokens_balance := COALESCE(NEW.tokens_balance, v_base_tokens);
  NEW.free_tokens_balance := COALESCE(NEW.free_tokens_balance, v_base_tokens);
  
  -- Check if this user is eligible for first 100 bonus
  SELECT COUNT(*) INTO v_current_bonus_count
  FROM promo_users
  WHERE promo_type = 'first-100-users';
  
  IF v_current_bonus_count < v_max_bonus_users THEN
    v_bonus_eligible := TRUE;
    
    -- Set bonus tokens (500k in paid balance)
    NEW.paid_tokens_balance := v_bonus_tokens;
    NEW.tokens_balance := NEW.tokens_balance + v_bonus_tokens;
    
    -- Track this bonus allocation
    BEGIN
      INSERT INTO promo_users (user_id, promo_type, tokens_awarded, activated_at)
      VALUES (NEW.id, 'first-100-users', v_bonus_tokens, NOW())
      ON CONFLICT (user_id, promo_type) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      -- Ignore errors in bonus tracking
      NULL;
    END;
  ELSE
    -- No bonus for users after the first 100
    NEW.paid_tokens_balance := COALESCE(NEW.paid_tokens_balance, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Verify the trigger is properly attached
DROP TRIGGER IF EXISTS trigger_unified_profile_init ON profiles;
CREATE TRIGGER trigger_unified_profile_init
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION unified_profile_initialization();

-- 4. Log this migration
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: Token allocation changed to 500k for first 100 users, 150k for others';
END $$;
