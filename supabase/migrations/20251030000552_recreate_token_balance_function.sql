/*
  # Recreate Token Balance Function

  1. Drops and recreates get_user_token_balance
  2. Uses correct column names (paid_tokens_balance, free_tokens_balance)
  3. Returns proper tier and balance info
*/

-- Drop the old function
DROP FUNCTION IF EXISTS get_user_token_balance(text);

-- Create new function with correct columns
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
AS $$
DECLARE
  v_is_paid boolean;
  v_paid_balance bigint;
  v_free_balance bigint;
  v_current_tier text;
BEGIN
  -- Get user data
  SELECT 
    COALESCE(is_paid, false),
    COALESCE(paid_tokens_balance, 0),
    COALESCE(free_tokens_balance, 0),
    COALESCE(current_tier, 'free')
  INTO v_is_paid, v_paid_balance, v_free_balance, v_current_tier
  FROM profiles
  WHERE id = p_user_id;

  -- Return balance info
  RETURN QUERY SELECT
    v_current_tier as tier,
    v_paid_balance as paid_tokens,
    v_free_balance as daily_tokens,
    (v_paid_balance + v_free_balance) as total_tokens,
    (v_is_paid AND v_paid_balance > 0) as can_use_paid_models;
END;
$$;