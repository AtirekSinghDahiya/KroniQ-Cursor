/*
  # Fix Token Balance Calculation and Add Missing Tables

  ## Problem
  1. get_user_token_balance function has double-counting bug
     - Using tokens_balance (which includes both free and paid) as daily_tokens
     - Then adding paid_tokens_balance on top, causing inflated total
  2. Missing promotional_users table that trigger references
  
  ## Solution
  1. Fix get_user_token_balance to use correct columns:
     - free_tokens_balance for daily_tokens
     - paid_tokens_balance for paid_tokens
     - tokens_balance for total_tokens (already computed correctly in DB)
  2. Create promotional_users table for tracking bonuses
  
  ## Changes
  - Recreate get_user_token_balance function with correct logic
  - Create promotional_users table
*/

-- ============================================================================
-- PART 1: CREATE MISSING PROMOTIONAL_USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS promotional_users (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tokens_awarded BIGINT DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_promotional_users_user_id ON promotional_users(user_id);
CREATE INDEX IF NOT EXISTS idx_promotional_users_campaign_id ON promotional_users(campaign_id);

COMMENT ON TABLE promotional_users IS 'Tracks users who received promotional bonuses like First 101';

-- ============================================================================
-- PART 2: FIX GET_USER_TOKEN_BALANCE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_token_balance(p_user_id TEXT)
RETURNS TABLE (
  tier TEXT,
  paid_tokens BIGINT,
  daily_tokens BIGINT,
  total_tokens BIGINT,
  can_use_paid_models BOOLEAN
) AS $$
DECLARE
  v_is_paid BOOLEAN;
  v_is_premium BOOLEAN;
  v_paid_balance BIGINT;
  v_free_balance BIGINT;
  v_total_balance BIGINT;
  v_current_tier TEXT;
BEGIN
  -- Get user data from profiles
  SELECT
    COALESCE(is_paid, false),
    COALESCE(is_premium, false),
    COALESCE(paid_tokens_balance, 0),
    COALESCE(free_tokens_balance, 0),
    COALESCE(tokens_balance, 0),
    CASE
      WHEN COALESCE(is_premium, false) OR COALESCE(is_paid, false) THEN 'premium'
      ELSE 'free'
    END
  INTO v_is_paid, v_is_premium, v_paid_balance, v_free_balance, v_total_balance, v_current_tier
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    -- Return default values for non-existent user
    RETURN QUERY SELECT
      'free'::TEXT as tier,
      0::BIGINT as paid_tokens,
      0::BIGINT as daily_tokens,
      0::BIGINT as total_tokens,
      false as can_use_paid_models;
    RETURN;
  END IF;

  -- Return balance info with correct values
  -- IMPORTANT: tokens_balance already contains the total (free + paid)
  -- So we use it directly, not by adding free + paid again
  RETURN QUERY SELECT
    v_current_tier as tier,
    v_paid_balance as paid_tokens,
    v_free_balance as daily_tokens,
    v_total_balance as total_tokens,  -- Use tokens_balance directly (no double-counting)
    ((v_is_paid OR v_is_premium) AND v_paid_balance > 0) as can_use_paid_models;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_user_token_balance IS 
  'Returns user token balance. FIXED: Uses tokens_balance directly instead of adding free+paid again.';

-- ============================================================================
-- PART 3: VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_test_result RECORD;
BEGIN
  -- Test with a known user
  SELECT * INTO v_test_result
  FROM get_user_token_balance(
    (SELECT id FROM profiles ORDER BY created_at DESC LIMIT 1)
  );

  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ TOKEN BALANCE CALCULATION FIX COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'What Changed:';
  RAISE NOTICE '  ✅ Fixed double-counting bug in get_user_token_balance';
  RAISE NOTICE '  ✅ Created promotional_users table for tracking bonuses';
  RAISE NOTICE '  ✅ Now uses tokens_balance directly (already includes free + paid)';
  RAISE NOTICE '';
  RAISE NOTICE 'Test Result for Latest User:';
  RAISE NOTICE '  Tier: %', v_test_result.tier;
  RAISE NOTICE '  Paid Tokens: %', v_test_result.paid_tokens;
  RAISE NOTICE '  Free Tokens: %', v_test_result.daily_tokens;
  RAISE NOTICE '  Total Tokens: %', v_test_result.total_tokens;
  RAISE NOTICE '  Can Use Premium: %', v_test_result.can_use_paid_models;
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
