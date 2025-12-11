-- Migration: Revise token allocation to 200k for first 100 users, 100k for all after
-- Previous: 500k for first 100 users, 150k for everyone else
-- New: 200k for first 100 users, 100k for everyone else

-- 1. Update the promotional campaign token amount from 500k to 200k
UPDATE promotional_campaigns
SET 
  token_amount = 200000,  -- 200k tokens (was 500k)
  max_redemptions = 100   -- Keep 100 users cap
WHERE campaign_code = 'FIRST100';

-- 2. Recreate the unified profile initialization trigger with new values
CREATE OR REPLACE FUNCTION unified_profile_initialization()
RETURNS TRIGGER AS $$
DECLARE
  v_bonus_eligible BOOLEAN := FALSE;
  v_current_bonus_count INT;
  v_max_bonus_users INT := 100;  -- First 100 users get bonus
  v_bonus_tokens BIGINT := 200000;  -- 200k tokens for first 100 users
  v_base_tokens BIGINT := 100000;  -- 100k base tokens for all users after first 100
BEGIN
  -- Always ensure base token allocation (100k for everyone after first 100)
  NEW.tokens_balance := COALESCE(NEW.tokens_balance, v_base_tokens);
  NEW.free_tokens_balance := COALESCE(NEW.free_tokens_balance, v_base_tokens);
  
  -- Check if this user is eligible for first 100 bonus
  SELECT COUNT(*) INTO v_current_bonus_count
  FROM promo_users
  WHERE promo_type = 'first-100-users';
  
  IF v_current_bonus_count < v_max_bonus_users THEN
    v_bonus_eligible := TRUE;
    
    -- Set bonus tokens (200k in paid balance)
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
  RAISE NOTICE 'Migration complete: Token allocation changed to 200k for first 100 users, 100k for all subsequent users';
END $$;
