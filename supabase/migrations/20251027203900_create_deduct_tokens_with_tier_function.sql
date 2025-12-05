/*
  # Create deduct_tokens_with_tier function
  
  This function handles token deduction with tier management.
  
  1. Features
    - Deducts tokens from user balance
    - Tracks token usage in transactions table
    - Returns current balance and tier information
    - Handles insufficient balance errors
  
  2. Security
    - SECURITY DEFINER for proper access
    - Validates user exists
    - Checks sufficient balance
*/

CREATE OR REPLACE FUNCTION public.deduct_tokens_with_tier(
  p_user_id text,
  p_model text,
  p_provider text,
  p_base_cost_usd numeric,
  p_request_type text DEFAULT 'chat'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance bigint;
  v_profit_margin decimal := 0.35; -- 35% margin
  v_total_cost_usd decimal;
  v_tokens_to_deduct integer;
  v_transaction_id uuid;
  v_tier text;
BEGIN
  -- Get current balance
  SELECT tokens_balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id;

  IF v_current_balance IS NULL THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'User not found'
    );
  END IF;

  -- Calculate total cost with profit margin
  v_total_cost_usd := p_base_cost_usd * (1 + v_profit_margin);
  
  -- Calculate tokens to deduct (1 million tokens = $1)
  v_tokens_to_deduct := CEIL(v_total_cost_usd * 1000000);

  -- Check if user has enough balance
  IF v_current_balance < v_tokens_to_deduct THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Insufficient tokens',
      'balance', v_current_balance,
      'required', v_tokens_to_deduct
    );
  END IF;

  -- Deduct tokens
  UPDATE profiles
  SET 
    tokens_balance = tokens_balance - v_tokens_to_deduct,
    tokens_lifetime_used = tokens_lifetime_used + v_tokens_to_deduct
  WHERE id = p_user_id;

  -- Insert transaction record
  INSERT INTO token_transactions (
    user_id, 
    model_name, 
    provider, 
    provider_cost_usd, 
    profit_margin_usd, 
    total_cost_usd, 
    tokens_deducted, 
    request_type
  )
  VALUES (
    p_user_id, 
    p_model, 
    p_provider, 
    p_base_cost_usd,
    p_base_cost_usd * v_profit_margin, 
    v_total_cost_usd, 
    v_tokens_to_deduct, 
    p_request_type
  )
  RETURNING id INTO v_transaction_id;

  -- Determine tier based on balance
  IF v_current_balance - v_tokens_to_deduct >= 1000000 THEN
    v_tier := 'premium';
  ELSIF v_current_balance - v_tokens_to_deduct >= 100000 THEN
    v_tier := 'pro';
  ELSE
    v_tier := 'free';
  END IF;

  -- Return success with updated balances
  RETURN json_build_object(
    'success', true,
    'balance', v_current_balance - v_tokens_to_deduct,
    'paid_balance', v_current_balance - v_tokens_to_deduct,
    'free_balance', 0,
    'tier', v_tier,
    'tokens_deducted', v_tokens_to_deduct,
    'transaction_id', v_transaction_id,
    'downgraded', false
  );
END;
$$;
