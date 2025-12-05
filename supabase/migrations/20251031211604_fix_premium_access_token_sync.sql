/*
  # Fix Premium Access - Token Column Synchronization

  ## Problem
  Premium models appear locked despite users having 10,000,000 tokens because:
  - Tokens stored in `tokens_balance` but premium check looks at `paid_tokens_balance`
  - `is_premium` flag not synced with actual token ownership
  - `current_tier` not updated when users purchase tokens

  ## Solution
  1. Sync existing token balances to `paid_tokens_balance` for paid users
  2. Update premium flags based on actual token ownership
  3. Create automatic trigger to keep columns in sync
  4. Create diagnostic and fix functions

  ## Changes
  1. Data Migration
     - Sync tokens_balance → paid_tokens_balance for users with tokens
     - Update is_premium and current_tier flags

  2. Automatic Sync Trigger
     - Keeps paid_tokens_balance in sync with tokens_balance
     - Auto-updates is_premium when tokens are added/removed

  3. Helper Functions
     - `diagnose_premium_access()`: Check user's premium status
     - `fix_premium_access()`: Manually fix a user's premium access
     - `sync_all_token_balances()`: Bulk sync for all users

  ## Security
  - Maintains RLS policies
  - Uses SECURITY DEFINER for admin functions
  - No changes to authentication logic
*/

-- =====================================================
-- 1. DATA MIGRATION - Sync Existing Token Balances
-- =====================================================

-- Sync tokens_balance to paid_tokens_balance for users who have tokens
UPDATE profiles
SET
  paid_tokens_balance = GREATEST(
    COALESCE(paid_tokens_balance, 0),
    COALESCE(tokens_balance, 0)
  ),
  is_premium = CASE
    WHEN COALESCE(tokens_balance, 0) > 0 OR COALESCE(paid_tokens_balance, 0) > 0 THEN true
    ELSE is_premium
  END,
  current_tier = CASE
    WHEN COALESCE(tokens_balance, 0) > 0 OR COALESCE(paid_tokens_balance, 0) > 0 THEN 'premium'
    ELSE current_tier
  END,
  is_paid = CASE
    WHEN COALESCE(tokens_balance, 0) > 0 OR COALESCE(paid_tokens_balance, 0) > 0 THEN true
    ELSE is_paid
  END,
  updated_at = NOW()
WHERE
  (COALESCE(tokens_balance, 0) > 0 OR COALESCE(paid_tokens_balance, 0) > 0)
  AND (
    paid_tokens_balance IS NULL
    OR paid_tokens_balance = 0
    OR is_premium IS NOT TRUE
    OR current_tier != 'premium'
  );

-- =====================================================
-- 2. DIAGNOSTIC FUNCTION - Check Premium Status
-- =====================================================

CREATE OR REPLACE FUNCTION diagnose_premium_access(p_user_id TEXT)
RETURNS TABLE (
  user_id TEXT,
  email TEXT,
  tokens_balance BIGINT,
  paid_tokens_balance BIGINT,
  free_tokens_balance BIGINT,
  daily_tokens_remaining INTEGER,
  is_premium BOOLEAN,
  current_tier TEXT,
  is_paid BOOLEAN,
  should_have_premium_access BOOLEAN,
  diagnosis TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
  v_should_be_premium BOOLEAN;
  v_diagnosis TEXT;
BEGIN
  -- Get profile data
  SELECT
    p.id,
    p.email,
    COALESCE(p.tokens_balance, 0) as tokens_bal,
    COALESCE(p.paid_tokens_balance, 0) as paid_tokens_bal,
    COALESCE(p.free_tokens_balance, 0) as free_tokens_bal,
    COALESCE(p.daily_tokens_remaining, 0) as daily_tokens,
    COALESCE(p.is_premium, FALSE) as premium_flag,
    COALESCE(p.current_tier, 'free') as tier,
    COALESCE(p.is_paid, FALSE) as paid_flag
  INTO v_profile
  FROM profiles p
  WHERE p.id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      p_user_id,
      'USER NOT FOUND'::TEXT,
      0::BIGINT, 0::BIGINT, 0::BIGINT, 0::INTEGER,
      FALSE, 'none'::TEXT, FALSE, FALSE,
      'User does not exist in database'::TEXT;
    RETURN;
  END IF;

  -- Determine if user should have premium access
  v_should_be_premium := (
    v_profile.tokens_bal > 0 OR
    v_profile.paid_tokens_bal > 0
  );

  -- Create diagnosis message
  IF v_should_be_premium AND NOT v_profile.premium_flag THEN
    v_diagnosis := 'ISSUE: User has tokens but is_premium flag is FALSE';
  ELSIF v_should_be_premium AND v_profile.tier != 'premium' THEN
    v_diagnosis := 'ISSUE: User has tokens but current_tier is not premium';
  ELSIF v_profile.paid_tokens_bal = 0 AND v_profile.tokens_bal > 0 THEN
    v_diagnosis := 'ISSUE: Tokens in tokens_balance but not in paid_tokens_balance';
  ELSIF v_should_be_premium AND v_profile.premium_flag AND v_profile.tier = 'premium' THEN
    v_diagnosis := 'OK: Premium access correctly configured';
  ELSIF NOT v_should_be_premium THEN
    v_diagnosis := 'OK: Free tier user with no tokens';
  ELSE
    v_diagnosis := 'WARNING: Unexpected state - manual review needed';
  END IF;

  RETURN QUERY SELECT
    v_profile.id::TEXT,
    v_profile.email,
    v_profile.tokens_bal,
    v_profile.paid_tokens_bal,
    v_profile.free_tokens_bal,
    v_profile.daily_tokens,
    v_profile.premium_flag,
    v_profile.tier,
    v_profile.paid_flag,
    v_should_be_premium,
    v_diagnosis;
END;
$$;

-- =====================================================
-- 3. FIX FUNCTION - Manually Fix Premium Access
-- =====================================================

CREATE OR REPLACE FUNCTION fix_premium_access(p_user_id TEXT)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  old_paid_tokens BIGINT,
  new_paid_tokens BIGINT,
  old_is_premium BOOLEAN,
  new_is_premium BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_paid_tokens BIGINT;
  v_new_paid_tokens BIGINT;
  v_old_is_premium BOOLEAN;
  v_tokens_balance BIGINT;
BEGIN
  -- Get current state
  SELECT
    COALESCE(paid_tokens_balance, 0),
    COALESCE(is_premium, FALSE),
    COALESCE(tokens_balance, 0)
  INTO v_old_paid_tokens, v_old_is_premium, v_tokens_balance
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT
      FALSE,
      'User not found'::TEXT,
      0::BIGINT, 0::BIGINT,
      FALSE, FALSE;
    RETURN;
  END IF;

  -- Calculate new paid_tokens_balance (max of existing values)
  v_new_paid_tokens := GREATEST(v_old_paid_tokens, v_tokens_balance);

  -- Update profile
  UPDATE profiles
  SET
    paid_tokens_balance = v_new_paid_tokens,
    is_premium = CASE WHEN v_new_paid_tokens > 0 THEN TRUE ELSE FALSE END,
    current_tier = CASE WHEN v_new_paid_tokens > 0 THEN 'premium' ELSE 'free' END,
    is_paid = CASE WHEN v_new_paid_tokens > 0 THEN TRUE ELSE FALSE END,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN QUERY SELECT
    TRUE,
    format('Fixed premium access: synced %s tokens to paid_tokens_balance', v_new_paid_tokens)::TEXT,
    v_old_paid_tokens,
    v_new_paid_tokens,
    v_old_is_premium,
    CASE WHEN v_new_paid_tokens > 0 THEN TRUE ELSE FALSE END;
END;
$$;

-- =====================================================
-- 4. BULK SYNC FUNCTION - Fix All Users
-- =====================================================

CREATE OR REPLACE FUNCTION sync_all_token_balances()
RETURNS TABLE (
  total_users INTEGER,
  users_fixed INTEGER,
  users_already_correct INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total INTEGER;
  v_fixed INTEGER;
  v_correct INTEGER;
BEGIN
  -- Count total users with tokens
  SELECT COUNT(*)::INTEGER INTO v_total
  FROM profiles
  WHERE COALESCE(tokens_balance, 0) > 0 OR COALESCE(paid_tokens_balance, 0) > 0;

  -- Count users that need fixing
  SELECT COUNT(*)::INTEGER INTO v_fixed
  FROM profiles
  WHERE (
    COALESCE(tokens_balance, 0) > 0 OR COALESCE(paid_tokens_balance, 0) > 0
  ) AND (
    paid_tokens_balance IS NULL
    OR paid_tokens_balance < COALESCE(tokens_balance, 0)
    OR is_premium IS NOT TRUE
    OR current_tier != 'premium'
  );

  -- Fix all users
  UPDATE profiles
  SET
    paid_tokens_balance = GREATEST(
      COALESCE(paid_tokens_balance, 0),
      COALESCE(tokens_balance, 0)
    ),
    is_premium = TRUE,
    current_tier = 'premium',
    is_paid = TRUE,
    updated_at = NOW()
  WHERE (
    COALESCE(tokens_balance, 0) > 0 OR COALESCE(paid_tokens_balance, 0) > 0
  ) AND (
    paid_tokens_balance IS NULL
    OR paid_tokens_balance < COALESCE(tokens_balance, 0)
    OR is_premium IS NOT TRUE
    OR current_tier != 'premium'
  );

  v_correct := v_total - v_fixed;

  RETURN QUERY SELECT v_total, v_fixed, v_correct;
END;
$$;

-- =====================================================
-- 5. AUTOMATIC SYNC TRIGGER
-- =====================================================

-- Trigger function to keep token columns in sync
CREATE OR REPLACE FUNCTION sync_premium_status_on_token_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- When tokens_balance or paid_tokens_balance changes, sync premium status
  IF (NEW.tokens_balance IS DISTINCT FROM OLD.tokens_balance) OR
     (NEW.paid_tokens_balance IS DISTINCT FROM OLD.paid_tokens_balance) THEN

    -- Sync paid_tokens_balance with tokens_balance (take the max)
    NEW.paid_tokens_balance := GREATEST(
      COALESCE(NEW.paid_tokens_balance, 0),
      COALESCE(NEW.tokens_balance, 0)
    );

    -- Update premium flags based on total tokens
    IF COALESCE(NEW.paid_tokens_balance, 0) > 0 THEN
      NEW.is_premium := TRUE;
      NEW.current_tier := 'premium';
      NEW.is_paid := TRUE;
    ELSE
      NEW.is_premium := FALSE;
      NEW.current_tier := 'free';
      NEW.is_paid := FALSE;
    END IF;

    NEW.updated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_sync_premium_status ON profiles;

-- Create trigger
CREATE TRIGGER trigger_sync_premium_status
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_premium_status_on_token_change();

-- =====================================================
-- 6. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION diagnose_premium_access(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION fix_premium_access(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION sync_all_token_balances() TO authenticated;

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_premium_access
  ON profiles(is_premium, paid_tokens_balance)
  WHERE is_premium = TRUE OR paid_tokens_balance > 0;

-- =====================================================
-- 8. VERIFY AND LOG RESULTS
-- =====================================================

DO $$
DECLARE
  v_sync_result RECORD;
BEGIN
  -- Run bulk sync
  SELECT * INTO v_sync_result FROM sync_all_token_balances();

  RAISE NOTICE '============================================';
  RAISE NOTICE 'PREMIUM ACCESS FIX COMPLETED';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total users with tokens: %', v_sync_result.total_users;
  RAISE NOTICE 'Users fixed: %', v_sync_result.users_fixed;
  RAISE NOTICE 'Users already correct: %', v_sync_result.users_already_correct;
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Automatic sync trigger installed: trigger_sync_premium_status';
  RAISE NOTICE 'Diagnostic function available: diagnose_premium_access(user_id)';
  RAISE NOTICE 'Manual fix function available: fix_premium_access(user_id)';
  RAISE NOTICE '============================================';
END $$;
