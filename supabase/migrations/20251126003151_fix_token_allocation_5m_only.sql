/*
  # Fix Token Allocation - Give ONLY 5M Tokens to First 115 Users
  
  ## Summary
  Fixes token allocation so new users in first 115 slots get:
  - ONLY 5,000,000 tokens (not 5,150,000)
  - No additional 150K base tokens
  
  ## Changes
  1. Update trigger to NOT add 150K base when granting 5M bonus
  2. Set tokens_balance = 5M directly (not 5M + 150K)
  3. Keep promotional limit at 115 users
*/

CREATE OR REPLACE FUNCTION unified_profile_initialization()
RETURNS TRIGGER AS $$
DECLARE
  v_current_count INTEGER;
  v_should_grant_bonus BOOLEAN := FALSE;
  v_base_tokens BIGINT := 150000;
  v_bonus_tokens BIGINT := 5000000;
BEGIN
  RAISE NOTICE '🚀 Starting unified profile initialization for user: %', NEW.id;

  -- ========================================================================
  -- STEP 1: Check First 115 Bonus FIRST (before setting base tokens)
  -- ========================================================================

  BEGIN
    -- Atomically increment counter and check if user is in first 115
    UPDATE promotional_user_counter
    SET
      first_101_count = first_101_count + 1,
      last_updated = NOW()
    WHERE id = 1 AND first_101_count < 115
    RETURNING first_101_count INTO v_current_count;

    -- Check if update succeeded (user is within first 115)
    IF FOUND AND v_current_count <= 115 THEN
      v_should_grant_bonus := TRUE;
      RAISE NOTICE '🎉 User % is within First 115! User number: %', NEW.id, v_current_count;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Could not check First 115 bonus: %', SQLERRM;
  END;

  -- ========================================================================
  -- STEP 2: Set token allocation based on bonus eligibility
  -- ========================================================================

  IF v_should_grant_bonus THEN
    -- First 115 users: ONLY 5M tokens (no 150K base)
    NEW.tokens_balance := v_bonus_tokens;
    NEW.free_tokens_balance := v_bonus_tokens;
    NEW.paid_tokens_balance := v_bonus_tokens;
    
    -- Mark as premium user
    NEW.is_premium := true;
    NEW.is_paid := true;
    NEW.current_tier := 'premium';

    RAISE NOTICE '✅ Set tokens_balance to % (First 115 user - 5M only)', v_bonus_tokens;

    -- Log in promotional_users table
    BEGIN
      INSERT INTO promotional_users (user_id, campaign_id, tokens_awarded, activated_at)
      VALUES (NEW.id, 'first-115-users', v_bonus_tokens, NOW())
      ON CONFLICT (user_id, campaign_id) DO NOTHING;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not log to promotional_users: %', SQLERRM;
    END;
  ELSE
    -- Users after first 115: Get standard 150K tokens
    NEW.tokens_balance := v_base_tokens;
    NEW.free_tokens_balance := v_base_tokens;
    NEW.paid_tokens_balance := 0;
    
    NEW.current_tier := 'free';
    NEW.is_paid := false;
    NEW.is_premium := false;

    RAISE NOTICE '✅ Set tokens_balance to % (Standard free user)', v_base_tokens;
  END IF;

  -- ========================================================================
  -- STEP 3: Set other default values
  -- ========================================================================

  IF NEW.daily_tokens_remaining IS NULL THEN
    NEW.daily_tokens_remaining := 5000;
  END IF;

  IF NEW.daily_token_limit IS NULL THEN
    NEW.daily_token_limit := 5000;
  END IF;

  IF NEW.monthly_token_limit IS NULL THEN
    NEW.monthly_token_limit := v_base_tokens;
  END IF;

  IF NEW.last_reset_date IS NULL THEN
    NEW.last_reset_date := CURRENT_DATE;
  END IF;

  IF NEW.last_token_refresh IS NULL THEN
    NEW.last_token_refresh := NOW();
  END IF;

  -- ========================================================================
  -- STEP 4: Final logging
  -- ========================================================================

  RAISE NOTICE '✅ Profile initialization complete for user %', NEW.id;
  RAISE NOTICE '   - Total tokens: %', NEW.tokens_balance;
  RAISE NOTICE '   - Free tokens: %', NEW.free_tokens_balance;
  RAISE NOTICE '   - Paid tokens: %', NEW.paid_tokens_balance;
  RAISE NOTICE '   - Tier: %', NEW.current_tier;
  RAISE NOTICE '   - Is Premium: %', NEW.is_premium;
  RAISE NOTICE '   - First 115 Bonus: %', CASE WHEN v_should_grant_bonus THEN 'YES (5M only)' ELSE 'NO (150K standard)' END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger is attached
DROP TRIGGER IF EXISTS unified_profile_init_trigger ON profiles;
CREATE TRIGGER unified_profile_init_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION unified_profile_initialization();

-- ========================================================================
-- VERIFICATION
-- ========================================================================

DO $$
DECLARE
  v_count INTEGER;
  v_remaining INTEGER;
BEGIN
  SELECT first_101_count INTO v_count FROM promotional_user_counter WHERE id = 1;
  v_remaining := 115 - v_count;

  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ TOKEN ALLOCATION FIX COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Promotional Status:';
  RAISE NOTICE '  🎁 Promotion: First 115 Users';
  RAISE NOTICE '  👥 Currently registered: % / 115', v_count;
  RAISE NOTICE '  📍 Remaining slots: %', v_remaining;
  RAISE NOTICE '';
  RAISE NOTICE 'Token Allocation:';
  RAISE NOTICE '  ✅ Users 1-115: 5,000,000 tokens (ONLY)';
  RAISE NOTICE '  ✅ Users 116+: 150,000 tokens (standard free)';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
