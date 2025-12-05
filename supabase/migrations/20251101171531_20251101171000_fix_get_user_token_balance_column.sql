/*
  # Fix get_user_token_balance Column Name Bug

  ## Problem
  The get_user_token_balance function was querying `free_tokens_balance` column
  which doesn't exist. The actual column name is `tokens_balance`.

  ## Fix
  - Change `free_tokens_balance` to `tokens_balance`
  - This will fix the token balance display showing 0 or wrong values

  ## Changes
  - Updated SELECT query to use correct column name
*/

CREATE OR REPLACE FUNCTION get_user_token_balance(p_user_id text)
RETURNS TABLE (
  tier text,
  paid_tokens bigint,
  daily_tokens bigint,
  total_tokens bigint,
  can_use_paid_models boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_paid boolean;
  v_is_premium boolean;
  v_paid_balance bigint;
  v_free_balance bigint;
  v_current_tier text;
BEGIN
  -- Get user data (FIXED: using tokens_balance instead of free_tokens_balance)
  SELECT
    COALESCE(is_paid, false),
    COALESCE(is_premium, false),
    COALESCE(paid_tokens_balance, 0),
    COALESCE(tokens_balance, 0),
    CASE
      WHEN COALESCE(is_premium, false) OR COALESCE(is_paid, false) THEN 'premium'
      ELSE 'free'
    END
  INTO v_is_paid, v_is_premium, v_paid_balance, v_free_balance, v_current_tier
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    -- Return default values for non-existent user
    RETURN QUERY SELECT
      'free'::text as tier,
      0::bigint as paid_tokens,
      0::bigint as daily_tokens,
      0::bigint as total_tokens,
      false as can_use_paid_models;
    RETURN;
  END IF;

  -- Return balance info
  RETURN QUERY SELECT
    v_current_tier as tier,
    v_paid_balance as paid_tokens,
    v_free_balance as daily_tokens,
    (v_paid_balance + v_free_balance) as total_tokens,
    ((v_is_paid OR v_is_premium) AND v_paid_balance > 0) as can_use_paid_models;
END;
$$;

COMMENT ON FUNCTION get_user_token_balance IS 'Get user token balance - FIXED: uses correct column tokens_balance';