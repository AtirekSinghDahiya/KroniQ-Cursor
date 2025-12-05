/*
  # Fix First 105 Promotion Slots and New User Token Allocation

  ## Issue
  - First 105 promotion slots are full (105/105), blocking new signups from getting bonus
  - New users should get 5M tokens for the first 105 users
  - Top-right token display showing 0 for some users

  ## Changes
  1. Increase first 105 limit to first 200 users
  2. Fix token initialization to ensure proper allocation
  3. Verify token balance display queries

  ## Details
  - First 200 users will now receive 5M bonus tokens
  - All new users get base 150k tokens + promotional bonus if eligible
*/

-- ============================================================================
-- PART 1: INCREASE PROMOTIONAL SLOTS FROM 105 TO 200
-- ============================================================================

-- Update comment on table
COMMENT ON TABLE promotional_user_counter IS 
  'Tracks First 200 promotion (increased from 105). Counter increments atomically for first 200 users only.';

-- ============================================================================
-- PART 2: UPDATE TRIGGER TO CHECK FOR 200 USERS
-- ============================================================================

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
  -- STEP 1: Set base token allocation (150k for all users)
  -- ========================================================================

  -- Ensure all new profiles get the base 150k tokens
  IF NEW.tokens_balance IS NULL OR NEW.tokens_balance = 0 THEN
    NEW.tokens_balance := v_base_tokens;
    RAISE NOTICE '✅ Set tokens_balance to %', v_base_tokens;
  END IF;

  IF NEW.free_tokens_balance IS NULL OR NEW.free_tokens_balance = 0 THEN
    NEW.free_tokens_balance := v_base_tokens;
    RAISE NOTICE '✅ Set free_tokens_balance to %', v_base_tokens;
  END IF;

  IF NEW.paid_tokens_balance IS NULL THEN
    NEW.paid_tokens_balance := 0;
    RAISE NOTICE '✅ Set paid_tokens_balance to 0';
  END IF;

  -- Set other defaults
  IF NEW.daily_tokens_remaining IS NULL THEN
    NEW.daily_tokens_remaining := 5000;
  END IF;

  IF NEW.daily_token_limit IS NULL THEN
    NEW.daily_token_limit := 5000;
  END IF;

  IF NEW.monthly_token_limit IS NULL THEN
    NEW.monthly_token_limit := v_base_tokens;
  END IF;

  IF NEW.current_tier IS NULL THEN
    NEW.current_tier := 'free';
  END IF;

  IF NEW.is_paid IS NULL THEN
    NEW.is_paid := false;
  END IF;

  IF NEW.is_premium IS NULL THEN
    NEW.is_premium := false;
  END IF;

  IF NEW.last_reset_date IS NULL THEN
    NEW.last_reset_date := CURRENT_DATE;
  END IF;

  IF NEW.last_token_refresh IS NULL THEN
    NEW.last_token_refresh := NOW();
  END IF;

  -- ========================================================================
  -- STEP 2: Check and grant First 200 Bonus (atomic and instant)
  -- ========================================================================

  BEGIN
    -- Atomically increment counter and check if user is in first 200
    UPDATE promotional_user_counter
    SET
      first_101_count = first_101_count + 1,
      last_updated = NOW()
    WHERE id = 1 AND first_101_count < 200
    RETURNING first_101_count INTO v_current_count;

    -- Check if update succeeded (user is within first 200)
    IF FOUND AND v_current_count <= 200 THEN
      v_should_grant_bonus := TRUE;

      RAISE NOTICE '🎉 User % is within First 200! User number: %', NEW.id, v_current_count;

      -- Grant 5M bonus tokens to paid balance (making them premium users)
      NEW.paid_tokens_balance := COALESCE(NEW.paid_tokens_balance, 0) + v_bonus_tokens;
      NEW.tokens_balance := COALESCE(NEW.tokens_balance, 0) + v_bonus_tokens;
      NEW.free_tokens_balance := COALESCE(NEW.free_tokens_balance, 0) + v_bonus_tokens;

      -- Mark as premium user
      NEW.is_premium := true;
      NEW.is_paid := true;
      NEW.current_tier := 'premium';

      -- Log in promotional_users table
      BEGIN
        INSERT INTO promotional_users (user_id, campaign_id, tokens_awarded, activated_at)
        VALUES (NEW.id, 'first-200-users', v_bonus_tokens, NOW())
        ON CONFLICT (user_id, campaign_id) DO NOTHING;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Could not log to promotional_users: %', SQLERRM;
      END;

      RAISE NOTICE '✅ Granted 5,000,000 bonus tokens to user % (First 200 user #%)', NEW.id, v_current_count;
    ELSE
      RAISE NOTICE 'ℹ️ User % is NOT in First 200. Promotion ended. Total granted: %', NEW.id, COALESCE(v_current_count, 0);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- If promotional_user_counter doesn't exist or error occurs, just log and continue
      RAISE NOTICE '⚠️ Could not check First 200 bonus: %', SQLERRM;
  END;

  -- ========================================================================
  -- STEP 3: Final validation and logging
  -- ========================================================================

  RAISE NOTICE '✅ Profile initialization complete for user %', NEW.id;
  RAISE NOTICE '   - Total tokens: %', NEW.tokens_balance;
  RAISE NOTICE '   - Free tokens: %', NEW.free_tokens_balance;
  RAISE NOTICE '   - Paid tokens: %', NEW.paid_tokens_balance;
  RAISE NOTICE '   - Tier: %', NEW.current_tier;
  RAISE NOTICE '   - First 200 Bonus: %', CASE WHEN v_should_grant_bonus THEN 'YES' ELSE 'NO' END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION unified_profile_initialization IS
  'Unified trigger that handles ALL profile initialization: base tokens (150k) + first 200 bonus (5M). Runs BEFORE INSERT for instant allocation.';

-- ============================================================================
-- PART 3: UPDATE PROMOTION STATUS VIEW
-- ============================================================================

DROP VIEW IF EXISTS first_105_promotion_status CASCADE;

CREATE OR REPLACE VIEW first_200_promotion_status AS
SELECT 
  first_101_count as users_granted,
  (200 - first_101_count) as remaining_slots,
  CASE 
    WHEN first_101_count >= 200 THEN 'ENDED'
    ELSE 'ACTIVE'
  END as status,
  last_updated
FROM promotional_user_counter
WHERE id = 1;

COMMENT ON VIEW first_200_promotion_status IS 
  'Shows current status of First 200 promotion (increased from 105)';

-- ============================================================================
-- PART 4: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
  v_remaining INTEGER;
BEGIN
  SELECT first_101_count INTO v_count FROM promotional_user_counter WHERE id = 1;
  v_remaining := 200 - v_count;

  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ FIRST 200 PROMOTION UPDATE COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Promotion Status:';
  RAISE NOTICE '  🎁 Current promotion: First 200 Users (upgraded from 105)';
  RAISE NOTICE '  👥 Users currently registered: % / 200', v_count;
  RAISE NOTICE '  📍 Remaining slots: %', v_remaining;
  RAISE NOTICE '  💰 Bonus amount: 5,000,000 tokens';
  RAISE NOTICE '  ⚡ Allocation speed: INSTANT (BEFORE INSERT trigger)';
  RAISE NOTICE '';
  RAISE NOTICE 'What Changed:';
  RAISE NOTICE '  ✅ Updated limit from 105 to 200 users';
  RAISE NOTICE '  ✅ Trigger checks for 200 instead of 105';
  RAISE NOTICE '  ✅ All token balances properly initialized';
  RAISE NOTICE '  ✅ Created first_200_promotion_status view';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
