/*
  # Fix Token System - Add Missing Columns and Update Functions

  1. Changes
    - Add `paid_tokens_balance` column (for paid tokens)
    - Add `free_tokens_balance` column (for free tokens)
    - Update all functions to use correct columns
    - Migrate existing data to new columns

  2. Logic
    - `paid_tokens_balance` = tokens purchased
    - `free_tokens_balance` = free daily tokens
    - Paid users: `is_paid = true AND paid_tokens_balance > 0`
    - Free users: `is_paid = false`

  3. Security
    - No RLS changes needed
    - Functions updated to work with new schema
*/

-- Add new token columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'paid_tokens_balance') THEN
    ALTER TABLE profiles ADD COLUMN paid_tokens_balance bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'free_tokens_balance') THEN
    ALTER TABLE profiles ADD COLUMN free_tokens_balance bigint DEFAULT 0;
  END IF;
END $$;

-- Migrate existing data: Move tokens_remaining to paid_tokens_balance for paid users
UPDATE profiles
SET paid_tokens_balance = tokens_remaining
WHERE is_paid = true AND tokens_remaining > 0;

-- Set free tokens for free users (800k daily limit)
UPDATE profiles
SET free_tokens_balance = 800000
WHERE is_paid = false OR is_paid IS NULL;

-- Update check_model_access function to use correct columns
CREATE OR REPLACE FUNCTION check_model_access(
  p_user_id text,
  p_model_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_tier text;
  v_paid_balance bigint;
  v_free_balance bigint;
  v_is_paid boolean;
  v_can_access boolean;
  v_free_models text[] := ARRAY[
    'grok-4-fast', 'gpt-5-nano', 'gpt-5-image-mini',
    'deepseek-v3.1-free', 'nemotron-nano-free', 'qwen-vl-30b-free',
    'claude-haiku-free', 'gemini-flash-lite-free', 'kimi-k2-free',
    'llama-4-maverick-free', 'codex-mini', 'lfm2-8b', 'granite-4.0', 'ernie-4.5'
  ];
BEGIN
  -- Get user tier and balances
  SELECT 
    current_tier, 
    COALESCE(paid_tokens_balance, 0),
    COALESCE(free_tokens_balance, 0),
    COALESCE(is_paid, false)
  INTO v_current_tier, v_paid_balance, v_free_balance, v_is_paid
  FROM profiles
  WHERE id = p_user_id;

  IF v_current_tier IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found',
      'can_access', false,
      'tier', 'free',
      'paid_balance', 0,
      'free_balance', 0,
      'reason', 'User not found'
    );
  END IF;

  -- Check if model is free
  IF p_model_id = ANY(v_free_models) THEN
    v_can_access := true;
  ELSE
    -- Paid model - check if user has paid tokens OR is marked as paid
    v_can_access := (v_is_paid = true AND v_paid_balance > 0);
  END IF;

  RETURN json_build_object(
    'success', true,
    'can_access', v_can_access,
    'tier', CASE WHEN v_is_paid THEN 'paid' ELSE 'free' END,
    'paid_balance', v_paid_balance,
    'free_balance', v_free_balance,
    'reason', CASE
      WHEN v_can_access THEN 'Access granted'
      WHEN NOT v_is_paid THEN 'Upgrade to paid plan for this model'
      WHEN v_paid_balance <= 0 THEN 'Purchase more tokens'
      ELSE 'Access denied'
    END
  );
END;
$$;

-- Update deduct_tokens_with_tier to use correct columns
CREATE OR REPLACE FUNCTION deduct_tokens_with_tier(
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
  v_current_tier text;
  v_paid_balance bigint;
  v_free_balance bigint;
  v_is_paid boolean;
  v_tokens_to_deduct integer;
  v_actual_cost numeric;
BEGIN
  -- Get current balances
  SELECT 
    current_tier,
    COALESCE(paid_tokens_balance, 0),
    COALESCE(free_tokens_balance, 0),
    COALESCE(is_paid, false)
  INTO v_current_tier, v_paid_balance, v_free_balance, v_is_paid
  FROM profiles
  WHERE id = p_user_id;

  IF v_current_tier IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Calculate tokens with 2x multiplier (100% profit margin)
  v_actual_cost := p_base_cost_usd * 2;
  v_tokens_to_deduct := CEIL(v_actual_cost * 1000000);

  -- Deduct from paid balance if user is paid
  IF v_is_paid AND v_paid_balance >= v_tokens_to_deduct THEN
    UPDATE profiles
    SET 
      paid_tokens_balance = paid_tokens_balance - v_tokens_to_deduct,
      tokens_lifetime_used = COALESCE(tokens_lifetime_used, 0) + v_tokens_to_deduct,
      updated_at = NOW()
    WHERE id = p_user_id;

    v_paid_balance := v_paid_balance - v_tokens_to_deduct;

    RETURN json_build_object(
      'success', true,
      'paid_balance', v_paid_balance,
      'free_balance', v_free_balance,
      'tier', 'paid',
      'tokens_deducted', v_tokens_to_deduct,
      'downgraded', false
    );
  ELSIF NOT v_is_paid AND v_free_balance >= v_tokens_to_deduct THEN
    -- Deduct from free balance
    UPDATE profiles
    SET 
      free_tokens_balance = free_tokens_balance - v_tokens_to_deduct,
      updated_at = NOW()
    WHERE id = p_user_id;

    v_free_balance := v_free_balance - v_tokens_to_deduct;

    RETURN json_build_object(
      'success', true,
      'paid_balance', 0,
      'free_balance', v_free_balance,
      'tier', 'free',
      'tokens_deducted', v_tokens_to_deduct,
      'downgraded', false
    );
  ELSE
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient tokens',
      'paid_balance', v_paid_balance,
      'free_balance', v_free_balance,
      'tier', CASE WHEN v_is_paid THEN 'paid' ELSE 'free' END,
      'required', v_tokens_to_deduct
    );
  END IF;
END;
$$;