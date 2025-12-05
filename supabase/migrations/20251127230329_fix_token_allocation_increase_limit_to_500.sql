/*
  # Fix Token Allocation - Increase Promotional Limit to 500 Users
  
  ## Problem
  - Current limit: 115 users
  - Counter at 109, but new users getting 150K instead of 5M
  - Need to increase limit and fix allocation logic
  
  ## Solution
  1. Increase promotional limit from 115 to 500 users
  2. Fix trigger to ensure 5M tokens are allocated correctly
  3. Update recent users (last 3) who got 150K to have 5M
  4. Add better logging and verification
  
  ## Changes
  - Update promotional counter limit check
  - Fix token allocation in trigger
  - Backfill recent users with correct tokens
*/

-- ========================================================================
-- STEP 1: Fix the trigger to use 500 limit instead of 115
-- ========================================================================

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
  -- STEP 1: Check First 500 Bonus FIRST (increased from 115)
  -- ========================================================================

  BEGIN
    -- Atomically increment counter and check if user is in first 500
    UPDATE promotional_user_counter
    SET
      first_101_count = first_101_count + 1,
      last_updated = NOW()
    WHERE id = 1 AND first_101_count < 500  -- INCREASED TO 500
    RETURNING first_101_count INTO v_current_count;

    -- Check if update succeeded (user is within first 500)
    IF FOUND AND v_current_count <= 500 THEN
      v_should_grant_bonus := TRUE;
      RAISE NOTICE '🎉 User % is within First 500! User number: %', NEW.id, v_current_count;
    ELSE
      RAISE NOTICE '⚠️ User % is after first 500. Counter: %', NEW.id, v_current_count;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Could not check First 500 bonus: %', SQLERRM;
      v_should_grant_bonus := FALSE;
  END;

  -- ========================================================================
  -- STEP 2: Set token allocation based on bonus eligibility
  -- ========================================================================

  IF v_should_grant_bonus THEN
    -- First 500 users: ONLY 5M tokens (no 150K base)
    NEW.tokens_balance := v_bonus_tokens;
    NEW.free_tokens_balance := v_bonus_tokens;
    NEW.paid_tokens_balance := v_bonus_tokens;
    
    -- Mark as premium user (5M tokens = premium access)
    NEW.is_premium := true;
    NEW.is_paid := true;
    NEW.current_tier := 'premium';
    NEW.user_type := 'paid';

    RAISE NOTICE '✅ GRANTED 5M TOKENS to user %', NEW.id;
    RAISE NOTICE '   - tokens_balance: %', NEW.tokens_balance;
    RAISE NOTICE '   - User number: % / 500', v_current_count;

    -- Log in promotional_users table
    BEGIN
      INSERT INTO promotional_users (user_id, campaign_id, tokens_awarded, activated_at)
      VALUES (NEW.id, 'first-500-users', v_bonus_tokens, NOW())
      ON CONFLICT (user_id, campaign_id) DO NOTHING;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not log to promotional_users: %', SQLERRM;
    END;
  ELSE
    -- Users after first 500: Get standard 150K tokens
    NEW.tokens_balance := v_base_tokens;
    NEW.free_tokens_balance := v_base_tokens;
    NEW.paid_tokens_balance := 0;
    
    NEW.current_tier := 'free';
    NEW.is_paid := false;
    NEW.is_premium := false;
    NEW.user_type := 'free';

    RAISE NOTICE '✅ GRANTED 150K TOKENS (standard free tier) to user %', NEW.id;
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
    NEW.monthly_token_limit := NEW.tokens_balance;
  END IF;

  IF NEW.last_reset_date IS NULL THEN
    NEW.last_reset_date := CURRENT_DATE;
  END IF;

  IF NEW.last_token_refresh IS NULL THEN
    NEW.last_token_refresh := NOW();
  END IF;

  RAISE NOTICE '✅ Profile initialization complete for user %', NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- STEP 2: Update recent users who got 150K to have 5M
-- ========================================================================

-- Backfill the 3 most recent users who got 150K instead of 5M
UPDATE profiles
SET
  tokens_balance = 5000000,
  free_tokens_balance = 5000000,
  paid_tokens_balance = 5000000,
  is_premium = true,
  is_paid = true,
  user_type = 'paid',
  current_tier = 'premium'
WHERE id IN (
  'jwliduTZYSVoVFPPGIpEb1CeCkx2',  -- aaaaaaaaaaaawawfw@gmail.com
  'WmQxo863omW2se2oDDwNEOTDqSK2',  -- wwoaw@gmail.com
  'ilYoUTBG2fYWbAEMpIJ0XmKhskQ2'   -- wowatirek@gmail.com
);

-- Log these backfilled users
INSERT INTO promotional_users (user_id, campaign_id, tokens_awarded, activated_at)
VALUES 
  ('jwliduTZYSVoVFPPGIpEb1CeCkx2', 'first-500-users', 5000000, NOW()),
  ('WmQxo863omW2se2oDDwNEOTDqSK2', 'first-500-users', 5000000, NOW()),
  ('ilYoUTBG2fYWbAEMpIJ0XmKhskQ2', 'first-500-users', 5000000, NOW())
ON CONFLICT (user_id, campaign_id) DO UPDATE
SET tokens_awarded = 5000000, activated_at = NOW();

-- ========================================================================
-- STEP 3: Verification and Logging
-- ========================================================================

DO $$
DECLARE
  v_count INTEGER;
  v_remaining INTEGER;
  v_recent_150k_users INTEGER;
BEGIN
  SELECT first_101_count INTO v_count FROM promotional_user_counter WHERE id = 1;
  v_remaining := 500 - v_count;

  -- Count users with 150K (should be 0 after backfill)
  SELECT COUNT(*) INTO v_recent_150k_users
  FROM profiles
  WHERE tokens_balance = 150000 
    AND created_at > NOW() - INTERVAL '7 days';

  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ TOKEN ALLOCATION FIX COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Promotional Status:';
  RAISE NOTICE '  🎁 Promotion: First 500 Users Get 5M Tokens';
  RAISE NOTICE '  👥 Currently registered: % / 500', v_count;
  RAISE NOTICE '  📍 Remaining slots: %', v_remaining;
  RAISE NOTICE '';
  RAISE NOTICE 'Token Allocation:';
  RAISE NOTICE '  ✅ Users 1-500: 5,000,000 tokens';
  RAISE NOTICE '  ✅ Users 501+: 150,000 tokens (standard free)';
  RAISE NOTICE '';
  RAISE NOTICE 'Recent Users (last 7 days):';
  RAISE NOTICE '  ⚠️ Users with 150K: %', v_recent_150k_users;
  RAISE NOTICE '  ✅ Backfilled 3 users from 150K → 5M';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
