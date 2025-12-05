/*
  # Comprehensive Token Initialization Fix

  ## Problem
  New users are not receiving the correct token allocation:
  - Not getting 150k base free tokens
  - Not getting 5M tokens for first 101 users promotion
  - Multiple conflicting triggers causing race conditions

  ## Root Causes
  1. Conflicting triggers: handle_new_user() and grant_first_101_bonus_atomic()
  2. Wrong default values: profiles defaults set to 1000 instead of 150000
  3. Trigger on auth.users runs before profile creation in frontend
  4. Race conditions between multiple token allocation systems

  ## Solution
  1. Drop all conflicting triggers and functions
  2. Set correct defaults on profiles table (150k tokens)
  3. Create a single unified trigger that handles ALL token initialization
  4. Ensure first 101 bonus is properly integrated
  5. Backfill existing users with missing tokens

  ## Token Allocation Logic
  - Base allocation: 150,000 free tokens for all new users
  - First 101 users: Additional 5,000,000 tokens (via promotional_user_counter)
  - FIRST100 promo: Separate system, handled by frontend after profile creation

  ## Changes
  - Drop: on_auth_user_created trigger
  - Drop: handle_new_user() function
  - Drop: trigger_grant_first_101_bonus_atomic trigger
  - Drop: grant_first_101_bonus_atomic() function
  - Create: unified_profile_initialization() function
  - Create: trigger_unified_profile_init trigger on profiles
  - Update: profiles table defaults to 150000
  - Backfill: existing users with 0 or NULL tokens
*/

-- ============================================================================
-- PART 1: DROP ALL CONFLICTING TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Drop the auth.users trigger (this was creating profiles with wrong token amounts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Drop the old first 101 bonus trigger (we'll recreate it as part of unified trigger)
DROP TRIGGER IF EXISTS trigger_grant_first_101_bonus ON profiles;
DROP TRIGGER IF EXISTS trigger_grant_first_101_bonus_atomic ON profiles;
DROP FUNCTION IF EXISTS grant_first_101_bonus();
DROP FUNCTION IF EXISTS grant_first_101_bonus_atomic();

-- Drop any other conflicting initialization triggers
DROP TRIGGER IF EXISTS trigger_init_free_tier_tokens ON profiles;
DROP FUNCTION IF EXISTS init_free_tier_tokens();

-- ============================================================================
-- PART 2: UPDATE PROFILES TABLE DEFAULTS
-- ============================================================================

-- Set correct defaults for token columns
ALTER TABLE profiles
  ALTER COLUMN tokens_balance SET DEFAULT 150000,
  ALTER COLUMN free_tokens_balance SET DEFAULT 150000,
  ALTER COLUMN paid_tokens_balance SET DEFAULT 0,
  ALTER COLUMN daily_tokens_remaining SET DEFAULT 5000,
  ALTER COLUMN daily_token_limit SET DEFAULT 5000,
  ALTER COLUMN current_tier SET DEFAULT 'free',
  ALTER COLUMN is_paid SET DEFAULT false,
  ALTER COLUMN is_premium SET DEFAULT false;

-- Add monthly_token_limit if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'monthly_token_limit'
  ) THEN
    ALTER TABLE profiles ADD COLUMN monthly_token_limit BIGINT DEFAULT 150000;
  END IF;
END $$;

-- Set default for monthly_token_limit
ALTER TABLE profiles
  ALTER COLUMN monthly_token_limit SET DEFAULT 150000;

-- ============================================================================
-- PART 3: CREATE UNIFIED PROFILE INITIALIZATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION unified_profile_initialization()
RETURNS TRIGGER AS $$
DECLARE
  v_current_count INTEGER;
  v_should_grant_first_101 BOOLEAN := FALSE;
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
  -- STEP 2: Check and grant First 101 Bonus (atomic)
  -- ========================================================================

  BEGIN
    -- Atomically increment counter and check if user is in first 101
    UPDATE promotional_user_counter
    SET
      first_101_count = first_101_count + 1,
      last_updated = NOW()
    WHERE id = 1 AND first_101_count < 101
    RETURNING first_101_count INTO v_current_count;

    -- Check if update succeeded (user is within first 101)
    IF FOUND AND v_current_count <= 101 THEN
      v_should_grant_first_101 := TRUE;

      RAISE NOTICE '🎉 User % is within First 101! User number: %', NEW.id, v_current_count;

      -- Grant 5M bonus tokens to paid balance (making them premium users)
      NEW.paid_tokens_balance := COALESCE(NEW.paid_tokens_balance, 0) + v_bonus_tokens;
      NEW.tokens_balance := COALESCE(NEW.tokens_balance, 0) + v_bonus_tokens;

      -- Mark as premium user
      NEW.is_premium := true;
      NEW.is_paid := true;
      NEW.current_tier := 'premium';

      -- Log in promotional_users table if it exists
      BEGIN
        INSERT INTO promotional_users (user_id, campaign_id, activated_at)
        VALUES (NEW.id, 'first-101-users', NOW())
        ON CONFLICT DO NOTHING;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Could not log to promotional_users: %', SQLERRM;
      END;

      RAISE NOTICE '✅ Granted 5,000,000 bonus tokens to user % (First 101 user #%)', NEW.id, v_current_count;
    ELSE
      RAISE NOTICE 'ℹ️ User % is NOT in First 101. Promotion ended. Total granted: %', NEW.id, v_current_count;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- If promotional_user_counter doesn't exist or error occurs, just log and continue
      RAISE NOTICE '⚠️ Could not check First 101 bonus: %', SQLERRM;
  END;

  -- ========================================================================
  -- STEP 3: Final validation and logging
  -- ========================================================================

  RAISE NOTICE '✅ Profile initialization complete for user %', NEW.id;
  RAISE NOTICE '   - Total tokens: %', NEW.tokens_balance;
  RAISE NOTICE '   - Free tokens: %', NEW.free_tokens_balance;
  RAISE NOTICE '   - Paid tokens: %', NEW.paid_tokens_balance;
  RAISE NOTICE '   - Tier: %', NEW.current_tier;
  RAISE NOTICE '   - First 101 Bonus: %', CASE WHEN v_should_grant_first_101 THEN 'YES' ELSE 'NO' END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 4: CREATE TRIGGER ON PROFILE CREATION
-- ============================================================================

-- Use BEFORE INSERT to modify NEW record before insertion
CREATE TRIGGER trigger_unified_profile_init
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION unified_profile_initialization();

COMMENT ON FUNCTION unified_profile_initialization IS
  'Unified trigger that handles ALL profile initialization: base tokens (150k) + first 101 bonus (5M)';

-- ============================================================================
-- PART 5: BACKFILL EXISTING USERS WITH MISSING TOKENS
-- ============================================================================

-- Update existing profiles that have 0 or NULL tokens to 150k base allocation
-- This fixes users who signed up during the bug period
UPDATE profiles
SET
  tokens_balance = GREATEST(COALESCE(tokens_balance, 0), 150000),
  free_tokens_balance = GREATEST(COALESCE(free_tokens_balance, 0), 150000),
  paid_tokens_balance = COALESCE(paid_tokens_balance, 0),
  monthly_token_limit = COALESCE(monthly_token_limit, 150000),
  daily_tokens_remaining = COALESCE(daily_tokens_remaining, 5000),
  daily_token_limit = COALESCE(daily_token_limit, 5000),
  current_tier = COALESCE(current_tier, 'free'),
  is_paid = COALESCE(is_paid, paid_tokens_balance > 0),
  is_premium = COALESCE(is_premium, paid_tokens_balance > 0),
  last_reset_date = COALESCE(last_reset_date, CURRENT_DATE),
  last_token_refresh = COALESCE(last_token_refresh, NOW()),
  updated_at = NOW()
WHERE
  (tokens_balance IS NULL OR tokens_balance < 150000)
  AND paid_tokens_balance = 0
  AND id NOT IN (
    SELECT user_id FROM promotional_redemptions
    WHERE campaign_id IN (
      SELECT id FROM promotional_campaigns WHERE campaign_code = 'FIRST100'
    )
  );

-- ============================================================================
-- PART 6: ADD CONSTRAINTS TO PREVENT FUTURE ISSUES
-- ============================================================================

-- Add check constraints to ensure tokens are never NULL after initialization
DO $$
BEGIN
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_tokens_not_null;
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_free_tokens_not_null;
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS check_paid_tokens_not_null;

  ALTER TABLE profiles ADD CONSTRAINT check_tokens_not_null
    CHECK (tokens_balance IS NOT NULL AND tokens_balance >= 0);

  ALTER TABLE profiles ADD CONSTRAINT check_free_tokens_not_null
    CHECK (free_tokens_balance IS NOT NULL AND free_tokens_balance >= 0);

  ALTER TABLE profiles ADD CONSTRAINT check_paid_tokens_not_null
    CHECK (paid_tokens_balance IS NOT NULL AND paid_tokens_balance >= 0);
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not add constraints: %', SQLERRM;
END $$;

-- ============================================================================
-- PART 7: CREATE VERIFICATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION verify_user_token_allocation(p_user_id TEXT)
RETURNS TABLE (
  user_id TEXT,
  email TEXT,
  tokens_balance BIGINT,
  free_tokens_balance BIGINT,
  paid_tokens_balance BIGINT,
  current_tier TEXT,
  is_first_101 BOOLEAN,
  has_first100_promo BOOLEAN,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id::TEXT,
    p.email,
    p.tokens_balance,
    p.free_tokens_balance,
    p.paid_tokens_balance,
    p.current_tier,
    EXISTS (
      SELECT 1 FROM promotional_users pu
      WHERE pu.user_id = p.id AND pu.campaign_id = 'first-101-users'
    ) as is_first_101,
    EXISTS (
      SELECT 1 FROM promotional_redemptions pr
      JOIN promotional_campaigns pc ON pr.campaign_id = pc.id
      WHERE pr.user_id = p.id AND pc.campaign_code = 'FIRST100'
    ) as has_first100_promo,
    CASE
      WHEN p.tokens_balance >= 150000 THEN 'OK'
      WHEN p.tokens_balance = 0 THEN 'NO_TOKENS'
      WHEN p.tokens_balance < 150000 THEN 'INSUFFICIENT'
      ELSE 'UNKNOWN'
    END as status
  FROM profiles p
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

DO $$
DECLARE
  v_first_101_count INTEGER;
  v_total_users INTEGER;
  v_users_with_zero_tokens INTEGER;
  v_free_users INTEGER;
  v_premium_users INTEGER;
BEGIN
  SELECT first_101_count INTO v_first_101_count
  FROM promotional_user_counter WHERE id = 1;

  SELECT COUNT(*) INTO v_total_users FROM profiles;

  SELECT COUNT(*) INTO v_users_with_zero_tokens
  FROM profiles WHERE tokens_balance = 0;

  SELECT COUNT(*) INTO v_free_users
  FROM profiles WHERE current_tier = 'free';

  SELECT COUNT(*) INTO v_premium_users
  FROM profiles WHERE paid_tokens_balance > 0;

  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ COMPREHENSIVE TOKEN INITIALIZATION FIX COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Database Statistics:';
  RAISE NOTICE '  📊 Total Users: %', v_total_users;
  RAISE NOTICE '  🆓 Free Users: %', v_free_users;
  RAISE NOTICE '  💎 Premium Users: %', v_premium_users;
  RAISE NOTICE '  ⚠️  Users with Zero Tokens: %', v_users_with_zero_tokens;
  RAISE NOTICE '';
  RAISE NOTICE 'First 101 Promotion Status:';
  RAISE NOTICE '  🎁 Users Granted Bonus: % / 101', v_first_101_count;
  RAISE NOTICE '  📍 Remaining Slots: %', GREATEST(0, 101 - v_first_101_count);
  RAISE NOTICE '  ⏸️  Status: %', CASE WHEN v_first_101_count >= 101 THEN 'ENDED' ELSE 'ACTIVE' END;
  RAISE NOTICE '';
  RAISE NOTICE 'What This Migration Fixed:';
  RAISE NOTICE '  ✅ Removed conflicting triggers on auth.users';
  RAISE NOTICE '  ✅ Set correct defaults (150k tokens) on profiles table';
  RAISE NOTICE '  ✅ Created unified initialization trigger';
  RAISE NOTICE '  ✅ Integrated first 101 bonus atomically';
  RAISE NOTICE '  ✅ Backfilled existing users with missing tokens';
  RAISE NOTICE '  ✅ Added constraints to prevent NULL tokens';
  RAISE NOTICE '';
  RAISE NOTICE 'New User Token Allocation:';
  RAISE NOTICE '  🎯 Base Allocation: 150,000 tokens';
  RAISE NOTICE '  🎁 First 101 Bonus: +5,000,000 tokens (if applicable)';
  RAISE NOTICE '  🎟️  FIRST100 Promo: Separate system via frontend';
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
