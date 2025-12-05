/*
  # Fix Token Deduction Double-Subtraction Bug

  ## Problem
  The deduct_tokens_simple function was subtracting tokens from BOTH paid_tokens_balance
  AND tokens_balance for premium users (line 67), causing double deduction.

  ## Fix
  - Premium users: ONLY deduct from paid_tokens_balance
  - Free users: ONLY deduct from tokens_balance
  - Remove the duplicate deduction from tokens_balance for premium users

  ## Changes
  - Fixed UPDATE statement for premium users to only touch paid_tokens_balance
  - Kept tokens_balance update only for free users
*/

CREATE OR REPLACE FUNCTION deduct_tokens_simple(
  p_user_id TEXT,
  p_tokens BIGINT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_paid_balance BIGINT;
  v_current_free_balance BIGINT;
  v_new_balance BIGINT;
  v_is_premium BOOLEAN;
BEGIN
  -- Get current balances
  SELECT
    COALESCE(paid_tokens_balance, 0),
    COALESCE(tokens_balance, 0),
    COALESCE(is_premium, false) OR COALESCE(is_paid, false)
  INTO
    v_current_paid_balance,
    v_current_free_balance,
    v_is_premium
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found',
      'new_balance', 0
    );
  END IF;

  -- Premium users: deduct ONLY from paid_tokens_balance
  IF v_is_premium AND v_current_paid_balance > 0 THEN
    IF v_current_paid_balance < p_tokens THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Insufficient paid token balance',
        'new_balance', v_current_paid_balance
      );
    END IF;

    -- Deduct ONLY from paid tokens (FIXED: removed tokens_balance deduction)
    UPDATE profiles
    SET
      paid_tokens_balance = paid_tokens_balance - p_tokens,
      updated_at = NOW()
    WHERE id = p_user_id
    RETURNING paid_tokens_balance INTO v_new_balance;

    RAISE NOTICE 'Deducted % tokens from premium user paid balance. New balance: %', p_tokens, v_new_balance;

    RETURN json_build_object(
      'success', true,
      'new_balance', v_new_balance,
      'deducted_from', 'paid_tokens'
    );

  -- Free users: deduct from tokens_balance (free tokens)
  ELSE
    IF v_current_free_balance < p_tokens THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Insufficient token balance',
        'new_balance', v_current_free_balance
      );
    END IF;

    -- Deduct from free tokens only
    UPDATE profiles
    SET
      tokens_balance = tokens_balance - p_tokens,
      updated_at = NOW()
    WHERE id = p_user_id
    RETURNING tokens_balance INTO v_new_balance;

    RAISE NOTICE 'Deducted % tokens from free user. New balance: %', p_tokens, v_new_balance;

    RETURN json_build_object(
      'success', true,
      'new_balance', v_new_balance,
      'deducted_from', 'free_tokens'
    );
  END IF;
END;
$$;

COMMENT ON FUNCTION deduct_tokens_simple IS 'Deducts tokens from user balance - FIXED: no double deduction for premium users';
