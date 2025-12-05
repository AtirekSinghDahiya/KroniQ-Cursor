/*
  # Complete Premium Access Fix

  ## Summary
  This migration comprehensively fixes the premium model access issue by:
  1. Auto-syncing premium flags when users have paid tokens
  2. Ensuring paid_tier_users table is populated correctly
  3. Creating reliable trigger system for automatic synchronization
  4. Adding emergency fix function for existing users
  5. Cleaning up conflicting data states

  ## Problem Being Fixed
  - Users have paid_tokens_balance > 0 but premium models remain locked
  - Premium flags (is_premium, is_paid) not set despite token purchase
  - paid_tier_users table not populated for paying users
  - Multiple authentication/checking systems cause inconsistent states
  - Cache conflicts between different premium check services

  ## Solution Approach
  - Single source of truth: paid_tokens_balance drives all premium status
  - Automatic flag synchronization via trigger
  - Retroactive fix for all existing users with tokens
  - Consistent tier table population

  ## Security
  - Firebase Auth handles authentication
  - Trigger functions run as SECURITY DEFINER
  - No RLS conflicts (tier tables have RLS disabled)
*/

-- ============================================================================
-- STEP 1: CREATE COMPREHENSIVE SYNC FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_premium_status()
RETURNS trigger AS $$
DECLARE
  v_has_paid_tokens boolean;
  v_should_be_premium boolean;
BEGIN
  -- Determine if user has paid tokens
  v_has_paid_tokens := COALESCE(NEW.paid_tokens_balance, 0) > 0;

  -- User should be premium if they have paid tokens
  v_should_be_premium := v_has_paid_tokens;

  -- Update premium flags to match paid token status
  IF v_should_be_premium THEN
    -- User has paid tokens - ensure premium flags are set
    IF NEW.is_premium IS DISTINCT FROM true OR
       NEW.is_paid IS DISTINCT FROM true OR
       NEW.current_tier = 'free' OR
       NEW.current_tier IS NULL THEN

      NEW.is_premium := true;
      NEW.is_paid := true;

      -- Set tier based on token amount
      IF COALESCE(NEW.paid_tokens_balance, 0) >= 10000000 THEN
        NEW.current_tier := 'ultra-premium';
      ELSIF COALESCE(NEW.paid_tokens_balance, 0) >= 5000000 THEN
        NEW.current_tier := 'premium';
      ELSE
        NEW.current_tier := 'budget';
      END IF;

      NEW.updated_at := NOW();
    END IF;

    -- Sync to paid_tier_users table
    INSERT INTO paid_tier_users (
      id, email, display_name, tier_level,
      tokens_remaining, total_tokens_purchased,
      upgraded_date, created_at, updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      NEW.display_name,
      NEW.current_tier,
      COALESCE(NEW.paid_tokens_balance, 0),
      COALESCE(NEW.tokens_lifetime_purchased, 0),
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      tier_level = EXCLUDED.tier_level,
      tokens_remaining = EXCLUDED.tokens_remaining,
      total_tokens_purchased = EXCLUDED.total_tokens_purchased,
      updated_at = NOW();

    -- Remove from free tier if exists
    DELETE FROM free_tier_users WHERE id = NEW.id;

  ELSE
    -- User has no paid tokens - should be free tier
    IF NEW.is_premium IS DISTINCT FROM false OR
       NEW.is_paid IS DISTINCT FROM false OR
       NEW.current_tier != 'free' THEN

      NEW.is_premium := false;
      NEW.is_paid := false;
      NEW.current_tier := 'free';
      NEW.updated_at := NOW();
    END IF;

    -- Sync to free_tier_users table
    INSERT INTO free_tier_users (
      id, email, display_name,
      daily_tokens_remaining, daily_token_limit,
      last_reset_date, created_at, updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      NEW.display_name,
      COALESCE(NEW.daily_tokens_remaining, 5000),
      5000,
      CURRENT_DATE,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      updated_at = NOW();

    -- Remove from paid tier if exists
    DELETE FROM paid_tier_users WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 2: DROP OLD TRIGGERS AND CREATE NEW COMPREHENSIVE TRIGGER
-- ============================================================================

-- Drop all old triggers that might conflict
DROP TRIGGER IF EXISTS trigger_sync_user_on_insert ON profiles;
DROP TRIGGER IF EXISTS trigger_sync_user_on_update ON profiles;
DROP TRIGGER IF EXISTS trigger_classify_user_on_insert ON profiles;
DROP TRIGGER IF EXISTS trigger_classify_user_on_update ON profiles;
DROP TRIGGER IF EXISTS sync_profile_from_paid_tier_trigger ON paid_tier_users;
DROP TRIGGER IF EXISTS sync_profile_token_deduction_trigger ON paid_tier_users;

-- Create new comprehensive trigger
CREATE TRIGGER trigger_sync_premium_status
  BEFORE INSERT OR UPDATE OF paid_tokens_balance, tokens_balance, is_premium, is_paid, current_tier
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_premium_status();

-- ============================================================================
-- STEP 3: FIX ALL EXISTING USERS WITH PAID TOKENS
-- ============================================================================

-- This is the critical emergency fix for users who already have tokens
-- but premium flags are not set

DO $$
DECLARE
  v_user RECORD;
  v_fixed_count integer := 0;
BEGIN
  RAISE NOTICE '🔧 [EMERGENCY FIX] Starting premium status repair for existing users...';

  -- Find all users with paid tokens but without premium status
  FOR v_user IN
    SELECT
      id,
      email,
      display_name,
      paid_tokens_balance,
      is_premium,
      is_paid,
      current_tier
    FROM profiles
    WHERE paid_tokens_balance > 0
      AND (
        is_premium IS NOT TRUE OR
        is_paid IS NOT TRUE OR
        current_tier = 'free' OR
        current_tier IS NULL
      )
  LOOP
    RAISE NOTICE '   Fixing user: % (% tokens)', v_user.email, v_user.paid_tokens_balance;

    -- Determine appropriate tier
    DECLARE
      v_tier text;
    BEGIN
      IF v_user.paid_tokens_balance >= 10000000 THEN
        v_tier := 'ultra-premium';
      ELSIF v_user.paid_tokens_balance >= 5000000 THEN
        v_tier := 'premium';
      ELSE
        v_tier := 'budget';
      END IF;

      -- Update profile flags
      UPDATE profiles
      SET
        is_premium = true,
        is_paid = true,
        current_tier = v_tier,
        updated_at = NOW()
      WHERE id = v_user.id;

      -- Sync to paid_tier_users
      INSERT INTO paid_tier_users (
        id, email, display_name, tier_level,
        tokens_remaining, upgraded_date, created_at, updated_at
      )
      VALUES (
        v_user.id,
        v_user.email,
        v_user.display_name,
        v_tier,
        v_user.paid_tokens_balance,
        NOW(),
        NOW(),
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        tier_level = EXCLUDED.tier_level,
        tokens_remaining = EXCLUDED.tokens_remaining,
        updated_at = NOW();

      -- Remove from free tier
      DELETE FROM free_tier_users WHERE id = v_user.id;

      v_fixed_count := v_fixed_count + 1;
    END;
  END LOOP;

  RAISE NOTICE '✅ [EMERGENCY FIX] Fixed % users with premium access', v_fixed_count;
END $$;

-- ============================================================================
-- STEP 4: CREATE MANUAL FIX FUNCTION FOR SUPPORT
-- ============================================================================

CREATE OR REPLACE FUNCTION fix_user_premium_status(p_user_id text)
RETURNS text AS $$
DECLARE
  v_profile RECORD;
  v_result text;
  v_tier text;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN 'ERROR: User not found';
  END IF;

  -- Check if user should be premium
  IF COALESCE(v_profile.paid_tokens_balance, 0) > 0 THEN
    -- Determine tier
    IF v_profile.paid_tokens_balance >= 10000000 THEN
      v_tier := 'ultra-premium';
    ELSIF v_profile.paid_tokens_balance >= 5000000 THEN
      v_tier := 'premium';
    ELSE
      v_tier := 'budget';
    END IF;

    -- Update profile
    UPDATE profiles
    SET
      is_premium = true,
      is_paid = true,
      current_tier = v_tier,
      updated_at = NOW()
    WHERE id = p_user_id;

    -- Sync to paid_tier_users
    INSERT INTO paid_tier_users (
      id, email, display_name, tier_level,
      tokens_remaining, upgraded_date, created_at, updated_at
    )
    VALUES (
      v_profile.id,
      v_profile.email,
      v_profile.display_name,
      v_tier,
      v_profile.paid_tokens_balance,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      tier_level = EXCLUDED.tier_level,
      tokens_remaining = EXCLUDED.tokens_remaining,
      updated_at = NOW();

    DELETE FROM free_tier_users WHERE id = p_user_id;

    v_result := FORMAT('SUCCESS: User set to %s tier with %s tokens', v_tier, v_profile.paid_tokens_balance);
  ELSE
    -- User should be free tier
    UPDATE profiles
    SET
      is_premium = false,
      is_paid = false,
      current_tier = 'free',
      updated_at = NOW()
    WHERE id = p_user_id;

    v_result := 'SUCCESS: User set to free tier (no paid tokens)';
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: VERIFICATION AND STATISTICS
-- ============================================================================

DO $$
DECLARE
  v_total_profiles bigint;
  v_paid_users bigint;
  v_paid_tier_records bigint;
  v_mismatched bigint;
BEGIN
  SELECT COUNT(*) INTO v_total_profiles FROM profiles;
  SELECT COUNT(*) INTO v_paid_users FROM profiles WHERE paid_tokens_balance > 0;
  SELECT COUNT(*) INTO v_paid_tier_records FROM paid_tier_users;

  SELECT COUNT(*) INTO v_mismatched
  FROM profiles
  WHERE paid_tokens_balance > 0
    AND (is_premium IS NOT TRUE OR is_paid IS NOT TRUE);

  RAISE NOTICE '================================================================';
  RAISE NOTICE 'PREMIUM ACCESS FIX COMPLETED';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Statistics:';
  RAISE NOTICE '  Total Profiles: %', v_total_profiles;
  RAISE NOTICE '  Users with Paid Tokens: %', v_paid_users;
  RAISE NOTICE '  Paid Tier Records: %', v_paid_tier_records;
  RAISE NOTICE '  Mismatched Records (should be 0): %', v_mismatched;
  RAISE NOTICE '';
  RAISE NOTICE 'What was fixed:';
  RAISE NOTICE '  ✓ Premium status flags auto-sync from paid_tokens_balance';
  RAISE NOTICE '  ✓ All existing users with tokens have premium access';
  RAISE NOTICE '  ✓ paid_tier_users table populated correctly';
  RAISE NOTICE '  ✓ Trigger ensures future purchases work automatically';
  RAISE NOTICE '  ✓ Manual fix function available: fix_user_premium_status(user_id)';
  RAISE NOTICE '';
  RAISE NOTICE '================================================================';

  IF v_mismatched > 0 THEN
    RAISE WARNING 'WARNING: Still have % mismatched records!', v_mismatched;
  ELSE
    RAISE NOTICE '✅ All premium access issues resolved!';
  END IF;

  RAISE NOTICE '================================================================';
END $$;
