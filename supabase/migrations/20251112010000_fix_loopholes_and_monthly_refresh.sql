/*
  # Fix Token System Loopholes & Monthly Refresh

  ## Critical Fixes
  1. **LOOPHOLE FIX**: Users with paid_tokens_balance = 0 no longer have premium access
     - Automatically downgrade to free tier when tokens depleted
     - Clear premium flags when balance hits 0

  2. **MONTHLY REFRESH**: Free users get 150K tokens on 1st of each month
     - REPLACES current balance (not additive)
     - Only for users with paid_tokens_balance = 0
     - Tracks last refresh date

  3. **NEW USER FIX**: Ensure new users get initial 1000 tokens
     - Set proper defaults on profile creation
     - Trigger ensures tokens are granted

  ## Changes
  - Update profiles table defaults
  - Create monthly refresh function
  - Create auto-downgrade trigger for paid users
  - Fix new user initialization
*/

-- ============================================================================
-- 1. FIX NEW USER TOKEN INITIALIZATION
-- ============================================================================

-- Ensure profiles table has correct defaults
ALTER TABLE profiles
  ALTER COLUMN tokens_balance SET DEFAULT 1000,
  ALTER COLUMN free_tokens_balance SET DEFAULT 1000,
  ALTER COLUMN paid_tokens_balance SET DEFAULT 0;

-- Add monthly refresh tracking column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_monthly_refresh'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_monthly_refresh TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ============================================================================
-- 2. CREATE FUNCTION TO AUTO-DOWNGRADE PAID USERS WITH 0 TOKENS
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_downgrade_depleted_users()
RETURNS TRIGGER AS $$
BEGIN
  -- If paid tokens hit 0, downgrade to free tier
  IF NEW.paid_tokens_balance = 0 AND OLD.paid_tokens_balance > 0 THEN
    RAISE NOTICE '⬇️ User % paid tokens depleted. Downgrading to free tier.', NEW.id;

    NEW.is_premium := FALSE;
    NEW.is_paid := FALSE;
    NEW.current_tier := 'free';

    -- Remove from paid_tier_users and add to free_tier_users
    DELETE FROM paid_tier_users WHERE id = NEW.id;

    INSERT INTO free_tier_users (
      id,
      email,
      display_name,
      tokens_remaining,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      NEW.display_name,
      NEW.free_tokens_balance,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      tokens_remaining = NEW.free_tokens_balance,
      updated_at = NOW();
  END IF;

  -- If user gains paid tokens, upgrade to premium
  IF NEW.paid_tokens_balance > 0 AND (OLD.paid_tokens_balance = 0 OR OLD.paid_tokens_balance IS NULL) THEN
    RAISE NOTICE '⬆️ User % gained paid tokens. Upgrading to premium.', NEW.id;

    NEW.is_premium := TRUE;
    NEW.is_paid := TRUE;
    NEW.current_tier := 'premium';

    -- Remove from free_tier_users and add to paid_tier_users
    DELETE FROM free_tier_users WHERE id = NEW.id;

    INSERT INTO paid_tier_users (
      id,
      email,
      display_name,
      tier_level,
      tokens_remaining,
      upgraded_date,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.email,
      NEW.display_name,
      'premium',
      NEW.paid_tokens_balance,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      tokens_remaining = NEW.paid_tokens_balance,
      tier_level = 'premium',
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_auto_downgrade_depleted_users ON profiles;
CREATE TRIGGER trigger_auto_downgrade_depleted_users
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.paid_tokens_balance IS DISTINCT FROM NEW.paid_tokens_balance)
  EXECUTE FUNCTION auto_downgrade_depleted_users();

COMMENT ON FUNCTION auto_downgrade_depleted_users IS
  'Automatically downgrades users to free tier when paid_tokens_balance = 0';

-- ============================================================================
-- 3. CREATE MONTHLY FREE TOKEN REFRESH FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_monthly_free_tokens()
RETURNS TABLE(
  users_refreshed INTEGER,
  total_tokens_granted BIGINT
) AS $$
DECLARE
  v_users_refreshed INTEGER := 0;
  v_total_tokens BIGINT := 0;
  v_monthly_amount BIGINT := 150000;
BEGIN
  -- Refresh tokens for free users (paid_tokens_balance = 0)
  -- Only if last refresh was before current month
  WITH updated_users AS (
    UPDATE profiles
    SET
      free_tokens_balance = v_monthly_amount,
      tokens_balance = v_monthly_amount,
      last_monthly_refresh = NOW(),
      updated_at = NOW()
    WHERE
      -- Only free users
      COALESCE(paid_tokens_balance, 0) = 0
      -- Last refresh was before this month OR never refreshed
      AND (
        last_monthly_refresh IS NULL
        OR DATE_TRUNC('month', last_monthly_refresh) < DATE_TRUNC('month', NOW())
      )
    RETURNING id, free_tokens_balance
  )
  SELECT
    COUNT(*)::INTEGER,
    SUM(free_tokens_balance)
  INTO v_users_refreshed, v_total_tokens
  FROM updated_users;

  RAISE NOTICE '🔄 Monthly refresh complete: % free users refreshed with % total tokens',
    v_users_refreshed, v_total_tokens;

  RETURN QUERY SELECT v_users_refreshed, COALESCE(v_total_tokens, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_monthly_free_tokens IS
  'Refreshes free tokens to 150K on 1st of each month for free users only. Run via cron.';

-- ============================================================================
-- 4. CREATE FUNCTION TO MANUALLY TRIGGER REFRESH (FOR TESTING)
-- ============================================================================

CREATE OR REPLACE FUNCTION force_refresh_user_tokens(p_user_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_user_record RECORD;
BEGIN
  -- Get user info
  SELECT
    id,
    paid_tokens_balance,
    free_tokens_balance,
    is_premium
  INTO v_user_record
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Only refresh if user is free (no paid tokens)
  IF COALESCE(v_user_record.paid_tokens_balance, 0) > 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot refresh - user has paid tokens',
      'paid_balance', v_user_record.paid_tokens_balance
    );
  END IF;

  -- Refresh to 150K
  UPDATE profiles
  SET
    free_tokens_balance = 150000,
    tokens_balance = 150000,
    last_monthly_refresh = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'new_balance', 150000,
    'message', 'Tokens refreshed to 150,000'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. FIX EXISTING USERS WITH 0 TOKENS (IMMEDIATE FIX)
-- ============================================================================

-- Downgrade all users with 0 paid tokens to free tier
UPDATE profiles
SET
  is_premium = FALSE,
  is_paid = FALSE,
  current_tier = 'free',
  updated_at = NOW()
WHERE
  COALESCE(paid_tokens_balance, 0) = 0
  AND (is_premium = TRUE OR is_paid = TRUE OR current_tier != 'free');

-- Give all free users with 0 tokens their 1000 initial tokens
UPDATE profiles
SET
  free_tokens_balance = 1000,
  tokens_balance = 1000,
  updated_at = NOW()
WHERE
  COALESCE(paid_tokens_balance, 0) = 0
  AND COALESCE(tokens_balance, 0) = 0;

-- Sync tier tables
DELETE FROM paid_tier_users
WHERE id IN (
  SELECT id FROM profiles
  WHERE COALESCE(paid_tokens_balance, 0) = 0
);

INSERT INTO free_tier_users (id, email, display_name, tokens_remaining, created_at, updated_at)
SELECT
  id,
  email,
  display_name,
  COALESCE(tokens_balance, 1000),
  created_at,
  NOW()
FROM profiles
WHERE
  COALESCE(paid_tokens_balance, 0) = 0
  AND id NOT IN (SELECT id FROM free_tier_users)
ON CONFLICT (id) DO UPDATE SET
  tokens_remaining = EXCLUDED.tokens_remaining,
  updated_at = NOW();

-- ============================================================================
-- 6. UPDATE NEW USER PROFILE CREATION TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION initialize_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure new users start with 1000 free tokens
  IF NEW.tokens_balance IS NULL OR NEW.tokens_balance = 0 THEN
    NEW.tokens_balance := 1000;
  END IF;

  IF NEW.free_tokens_balance IS NULL OR NEW.free_tokens_balance = 0 THEN
    NEW.free_tokens_balance := 1000;
  END IF;

  IF NEW.paid_tokens_balance IS NULL THEN
    NEW.paid_tokens_balance := 0;
  END IF;

  -- Set initial tier
  IF NEW.paid_tokens_balance > 0 THEN
    NEW.is_premium := TRUE;
    NEW.is_paid := TRUE;
    NEW.current_tier := 'premium';
  ELSE
    NEW.is_premium := FALSE;
    NEW.is_paid := FALSE;
    NEW.current_tier := 'free';
  END IF;

  -- Set last refresh to now
  NEW.last_monthly_refresh := NOW();

  RAISE NOTICE '👤 New user initialized: % with % tokens', NEW.id, NEW.tokens_balance;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user initialization
DROP TRIGGER IF EXISTS trigger_initialize_new_user ON profiles;
CREATE TRIGGER trigger_initialize_new_user
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_new_user_profile();

-- ============================================================================
-- 7. CREATE VIEW FOR PREMIUM ACCESS CHECK (ACCURATE)
-- ============================================================================

CREATE OR REPLACE VIEW user_premium_status AS
SELECT
  p.id,
  p.email,
  COALESCE(p.paid_tokens_balance, 0) as paid_tokens,
  COALESCE(p.free_tokens_balance, 0) as free_tokens,
  COALESCE(p.tokens_balance, 0) as total_tokens,
  -- Premium = has paid tokens
  CASE
    WHEN COALESCE(p.paid_tokens_balance, 0) > 0 THEN TRUE
    ELSE FALSE
  END as is_premium,
  -- Tier based on paid tokens
  CASE
    WHEN COALESCE(p.paid_tokens_balance, 0) > 0 THEN 'premium'
    ELSE 'free'
  END as actual_tier,
  p.last_monthly_refresh,
  p.created_at
FROM profiles p;

GRANT SELECT ON user_premium_status TO authenticated;
GRANT SELECT ON user_premium_status TO anon;

-- ============================================================================
-- 8. CREATE FUNCTION TO CHECK IF USER NEEDS MONTHLY REFRESH
-- ============================================================================

CREATE OR REPLACE FUNCTION check_user_needs_refresh(p_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_refresh TIMESTAMPTZ;
  v_paid_balance BIGINT;
BEGIN
  SELECT
    last_monthly_refresh,
    COALESCE(paid_tokens_balance, 0)
  INTO v_last_refresh, v_paid_balance
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Only free users (paid_balance = 0) need refresh
  IF v_paid_balance > 0 THEN
    RETURN FALSE;
  END IF;

  -- Check if last refresh was before current month
  IF v_last_refresh IS NULL OR
     DATE_TRUNC('month', v_last_refresh) < DATE_TRUNC('month', NOW()) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUMMARY & VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_free_users INTEGER;
  v_paid_users INTEGER;
  v_zero_balance_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_free_users
  FROM profiles
  WHERE COALESCE(paid_tokens_balance, 0) = 0;

  SELECT COUNT(*) INTO v_paid_users
  FROM profiles
  WHERE COALESCE(paid_tokens_balance, 0) > 0;

  SELECT COUNT(*) INTO v_zero_balance_users
  FROM profiles
  WHERE COALESCE(tokens_balance, 0) = 0;

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ LOOPHOLE FIX & MONTHLY REFRESH MIGRATION COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - Free users: %', v_free_users;
  RAISE NOTICE '  - Paid users: %', v_paid_users;
  RAISE NOTICE '  - Users with 0 balance: %', v_zero_balance_users;
  RAISE NOTICE '';
  RAISE NOTICE 'Fixes Applied:';
  RAISE NOTICE '  ✅ Auto-downgrade trigger for depleted paid users';
  RAISE NOTICE '  ✅ Monthly 150K refresh for free users';
  RAISE NOTICE '  ✅ New user initialization fixed (1000 tokens)';
  RAISE NOTICE '  ✅ Premium access loophole closed';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Set up cron job to call refresh_monthly_free_tokens()';
  RAISE NOTICE '  2. Test: Create new user → should get 1000 tokens';
  RAISE NOTICE '  3. Test: Paid user runs out → should become free';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;

/*
  TESTING QUERIES:

  -- Check a user's premium status
  SELECT * FROM user_premium_status WHERE id = 'user_id';

  -- Manually refresh tokens for testing
  SELECT force_refresh_user_tokens('user_id');

  -- Check if user needs refresh
  SELECT check_user_needs_refresh('user_id');

  -- Run monthly refresh manually
  SELECT * FROM refresh_monthly_free_tokens();

  -- View users by tier
  SELECT actual_tier, COUNT(*)
  FROM user_premium_status
  GROUP BY actual_tier;
*/
