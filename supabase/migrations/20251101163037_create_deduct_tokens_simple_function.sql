/*
  # Create Simple Token Deduction Function
  
  ## Purpose
  Creates a straightforward function to deduct tokens based on actual OpenRouter cost * 2x.
  
  ## Function
  - `deduct_tokens_simple(p_user_id, p_tokens)` - Deducts exact token amount from either:
    - paid_tokens_balance (if user has paid tokens)
    - tokens_balance (if free user)
  
  ## Returns
  - success: boolean
  - new_balance: bigint
  - error: text
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

  -- Premium users: deduct from paid_tokens_balance
  IF v_is_premium AND v_current_paid_balance > 0 THEN
    IF v_current_paid_balance < p_tokens THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Insufficient paid token balance',
        'new_balance', v_current_paid_balance
      );
    END IF;

    -- Deduct from paid tokens
    UPDATE profiles
    SET 
      paid_tokens_balance = paid_tokens_balance - p_tokens,
      tokens_balance = GREATEST(0, tokens_balance - p_tokens),
      updated_at = NOW()
    WHERE id = p_user_id
    RETURNING paid_tokens_balance INTO v_new_balance;

    RAISE NOTICE 'Deducted % tokens from premium user. New balance: %', p_tokens, v_new_balance;

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

    -- Deduct from free tokens
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

COMMENT ON FUNCTION deduct_tokens_simple IS 'Deducts tokens from user balance based on actual OpenRouter cost * 2x';
