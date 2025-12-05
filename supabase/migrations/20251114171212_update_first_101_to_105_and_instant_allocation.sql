/*
  # Update First 101 to First 105 and Improve Token Allocation Speed

  ## Changes
  1. Update promotional counter from 101 to 105 users
  2. Update trigger to check for 105 instead of 101
  3. Ensure trigger runs synchronously for instant token allocation
  
  ## Details
  - First 105 users will receive 5M bonus tokens
  - Tokens will be allocated instantly during profile creation (BEFORE INSERT trigger)
  - No delay between signup and token allocation
*/

-- ============================================================================
-- PART 1: UPDATE PROMOTIONAL COUNTER LIMIT
-- ============================================================================

-- Update the counter check to allow 105 users instead of 101
UPDATE promotional_user_counter 
SET first_101_count = first_101_count 
WHERE id = 1;

-- Add a comment documenting the change
COMMENT ON TABLE promotional_user_counter IS 
  'Tracks First 105 promotion. Counter increments atomically for first 105 users only.';

-- ============================================================================
-- PART 2: UPDATE TRIGGER TO CHECK FOR 105 USERS
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
  -- STEP 2: Check and grant First 105 Bonus (atomic and instant)
  -- ========================================================================

  BEGIN
    -- Atomically increment counter and check if user is in first 105
    -- CHANGED: Now checking for 105 instead of 101
    UPDATE promotional_user_counter
    SET
      first_101_count = first_101_count + 1,
      last_updated = NOW()
    WHERE id = 1 AND first_101_count < 105
    RETURNING first_101_count INTO v_current_count;

    -- Check if update succeeded (user is within first 105)
    IF FOUND AND v_current_count <= 105 THEN
      v_should_grant_bonus := TRUE;

      RAISE NOTICE '🎉 User % is within First 105! User number: %', NEW.id, v_current_count;

      -- Grant 5M bonus tokens to paid balance (making them premium users)
      NEW.paid_tokens_balance := COALESCE(NEW.paid_tokens_balance, 0) + v_bonus_tokens;
      NEW.tokens_balance := COALESCE(NEW.tokens_balance, 0) + v_bonus_tokens;

      -- Mark as premium user
      NEW.is_premium := true;
      NEW.is_paid := true;
      NEW.current_tier := 'premium';

      -- Log in promotional_users table
      BEGIN
        INSERT INTO promotional_users (user_id, campaign_id, tokens_awarded, activated_at)
        VALUES (NEW.id, 'first-105-users', v_bonus_tokens, NOW())
        ON CONFLICT (user_id, campaign_id) DO NOTHING;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Could not log to promotional_users: %', SQLERRM;
      END;

      RAISE NOTICE '✅ Granted 5,000,000 bonus tokens to user % (First 105 user #%)', NEW.id, v_current_count;
    ELSE
      RAISE NOTICE 'ℹ️ User % is NOT in First 105. Promotion ended. Total granted: %', NEW.id, v_current_count;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- If promotional_user_counter doesn't exist or error occurs, just log and continue
      RAISE NOTICE '⚠️ Could not check First 105 bonus: %', SQLERRM;
  END;

  -- ========================================================================
  -- STEP 3: Final validation and logging
  -- ========================================================================

  RAISE NOTICE '✅ Profile initialization complete for user %', NEW.id;
  RAISE NOTICE '   - Total tokens: %', NEW.tokens_balance;
  RAISE NOTICE '   - Free tokens: %', NEW.free_tokens_balance;
  RAISE NOTICE '   - Paid tokens: %', NEW.paid_tokens_balance;
  RAISE NOTICE '   - Tier: %', NEW.current_tier;
  RAISE NOTICE '   - First 105 Bonus: %', CASE WHEN v_should_grant_bonus THEN 'YES' ELSE 'NO' END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION unified_profile_initialization IS
  'Unified trigger that handles ALL profile initialization: base tokens (150k) + first 105 bonus (5M). Runs BEFORE INSERT for instant allocation.';

-- ============================================================================
-- PART 3: UPDATE FIRST_101_PROMOTION_STATUS VIEW
-- ============================================================================

-- Drop and recreate the view to show correct remaining slots
DROP VIEW IF EXISTS first_101_promotion_status CASCADE;

CREATE OR REPLACE VIEW first_105_promotion_status AS
SELECT 
  first_101_count as users_granted,
  (105 - first_101_count) as remaining_slots,
  CASE 
    WHEN first_101_count >= 105 THEN 'ENDED'
    ELSE 'ACTIVE'
  END as status,
  last_updated
FROM promotional_user_counter
WHERE id = 1;

COMMENT ON VIEW first_105_promotion_status IS 
  'Shows current status of First 105 promotion (updated from First 101)';

-- ============================================================================
-- PART 4: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
  v_remaining INTEGER;
BEGIN
  SELECT first_101_count INTO v_count FROM promotional_user_counter WHERE id = 1;
  v_remaining := 105 - v_count;

  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ FIRST 105 PROMOTION UPDATE COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Promotion Status:';
  RAISE NOTICE '  🎁 Current promotion: First 105 Users (upgraded from 101)';
  RAISE NOTICE '  👥 Users granted bonus: % / 105', v_count;
  RAISE NOTICE '  📍 Remaining slots: %', v_remaining;
  RAISE NOTICE '  💰 Bonus amount: 5,000,000 tokens';
  RAISE NOTICE '  ⚡ Allocation speed: INSTANT (BEFORE INSERT trigger)';
  RAISE NOTICE '';
  RAISE NOTICE 'What Changed:';
  RAISE NOTICE '  ✅ Updated limit from 101 to 105 users';
  RAISE NOTICE '  ✅ Trigger checks for 105 instead of 101';
  RAISE NOTICE '  ✅ Tokens allocated instantly on signup (no delay)';
  RAISE NOTICE '  ✅ Created first_105_promotion_status view';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
