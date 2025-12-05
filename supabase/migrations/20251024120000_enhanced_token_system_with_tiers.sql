/*
  # Enhanced Token System with Free and Paid Tiers

  ## Overview
  Implements separate tracking for free and paid tokens with auto-downgrade functionality.

  ## 1. New Columns in Profiles Table
    - `free_tokens_balance` (bigint) - Free tier tokens (10,000 daily refresh)
    - `paid_tokens_balance` (bigint) - Purchased tokens (priority usage)
    - `current_tier` (text) - Current access tier: 'free' or 'paid'
    - `tier_downgraded_at` (timestamptz) - When user was downgraded to free

  ## 2. Business Logic
    - Free users: 10,000 tokens, only free models
    - Paid users: Purchased tokens + all models until tokens run out
    - Token usage: Paid tokens used first, then free tokens
    - Auto-downgrade: When paid_tokens_balance = 0, tier = 'free'
    - Price multiplier: 2x on all AI requests

  ## 3. Security
    - Access control checks tier before allowing paid model usage
    - Real-time tier monitoring
    - Transaction logging with tier info
*/

-- 1. Add new columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'free_tokens_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN free_tokens_balance bigint DEFAULT 10000;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'paid_tokens_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN paid_tokens_balance bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'current_tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN current_tier text DEFAULT 'free' CHECK (current_tier IN ('free', 'paid'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'tier_downgraded_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN tier_downgraded_at timestamptz;
  END IF;
END $$;

-- 2. Add tier tracking to token_transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_transactions' AND column_name = 'user_tier'
  ) THEN
    ALTER TABLE token_transactions ADD COLUMN user_tier text DEFAULT 'free';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_transactions' AND column_name = 'used_paid_tokens'
  ) THEN
    ALTER TABLE token_transactions ADD COLUMN used_paid_tokens boolean DEFAULT false;
  END IF;
END $$;

-- 3. Create function to check user tier and permissions
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
  v_can_access boolean;
  v_free_models text[] := ARRAY[
    'grok-4-fast', 'gpt-5-nano', 'gpt-5-image-mini',
    'deepseek-v3.1-free', 'nemotron-nano-free', 'qwen-vl-30b-free',
    'claude-haiku-free', 'gemini-flash-lite-free', 'kimi-k2-free',
    'llama-4-maverick-free', 'codex-mini', 'lfm2-8b', 'granite-4.0', 'ernie-4.5'
  ];
BEGIN
  SELECT current_tier, paid_tokens_balance, free_tokens_balance
  INTO v_current_tier, v_paid_balance, v_free_balance
  FROM profiles
  WHERE id = p_user_id;

  IF v_current_tier IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found',
      'can_access', false
    );
  END IF;

  -- Check if model is in free models list
  IF p_model_id = ANY(v_free_models) THEN
    v_can_access := true;
  ELSE
    -- Paid model - check if user has paid tokens
    v_can_access := (v_paid_balance > 0);
  END IF;

  RETURN json_build_object(
    'success', true,
    'can_access', v_can_access,
    'tier', v_current_tier,
    'paid_balance', v_paid_balance,
    'free_balance', v_free_balance,
    'reason', CASE
      WHEN v_can_access THEN 'Access granted'
      ELSE 'Paid models require purchased tokens'
    END
  );
END;
$$;

-- 4. Enhanced deduct_tokens function with tier system and 2x multiplier
CREATE OR REPLACE FUNCTION deduct_tokens_with_tier(
  p_user_id text,
  p_model text,
  p_provider text,
  p_base_cost_usd decimal,
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
  v_total_cost_usd decimal;
  v_tokens_needed integer;
  v_used_paid_tokens boolean := false;
  v_transaction_id uuid;
  v_new_paid_balance bigint;
  v_new_free_balance bigint;
BEGIN
  -- Apply 2x multiplier to base cost
  v_total_cost_usd := p_base_cost_usd * 2;
  v_tokens_needed := CEIL(v_total_cost_usd * 10000);

  -- Get current user state
  SELECT current_tier, paid_tokens_balance, free_tokens_balance
  INTO v_current_tier, v_paid_balance, v_free_balance
  FROM profiles
  WHERE id = p_user_id;

  IF v_current_tier IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Check if user has enough tokens (paid first, then free)
  IF v_paid_balance >= v_tokens_needed THEN
    -- Deduct from paid tokens
    v_used_paid_tokens := true;
    UPDATE profiles
    SET
      paid_tokens_balance = paid_tokens_balance - v_tokens_needed,
      tokens_lifetime_used = COALESCE(tokens_lifetime_used, 0) + v_tokens_needed
    WHERE id = p_user_id
    RETURNING paid_tokens_balance, free_tokens_balance INTO v_new_paid_balance, v_new_free_balance;

  ELSIF (v_paid_balance + v_free_balance) >= v_tokens_needed THEN
    -- Use all paid tokens + some free tokens
    DECLARE
      v_remaining_needed integer := v_tokens_needed - v_paid_balance;
    BEGIN
      v_used_paid_tokens := (v_paid_balance > 0);
      UPDATE profiles
      SET
        paid_tokens_balance = 0,
        free_tokens_balance = free_tokens_balance - v_remaining_needed,
        tokens_lifetime_used = COALESCE(tokens_lifetime_used, 0) + v_tokens_needed
      WHERE id = p_user_id
      RETURNING paid_tokens_balance, free_tokens_balance INTO v_new_paid_balance, v_new_free_balance;
    END;
  ELSE
    -- Insufficient tokens
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient tokens',
      'paid_balance', v_paid_balance,
      'free_balance', v_free_balance,
      'needed', v_tokens_needed
    );
  END IF;

  -- Check if user should be downgraded to free tier
  IF v_new_paid_balance = 0 AND v_current_tier = 'paid' THEN
    UPDATE profiles
    SET
      current_tier = 'free',
      tier_downgraded_at = now()
    WHERE id = p_user_id;
    v_current_tier := 'free';
  END IF;

  -- Log transaction
  INSERT INTO token_transactions (
    user_id, model_name, provider, provider_cost_usd,
    profit_margin_usd, total_cost_usd, tokens_deducted,
    request_type, user_tier, used_paid_tokens
  )
  VALUES (
    p_user_id, p_model, p_provider, p_base_cost_usd,
    p_base_cost_usd, v_total_cost_usd, v_tokens_needed,
    p_request_type, v_current_tier, v_used_paid_tokens
  )
  RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', true,
    'paid_balance', v_new_paid_balance,
    'free_balance', v_new_free_balance,
    'tier', v_current_tier,
    'tokens_deducted', v_tokens_needed,
    'transaction_id', v_transaction_id,
    'downgraded', (v_new_paid_balance = 0 AND v_used_paid_tokens)
  );
END;
$$;

-- 5. Function to add paid tokens (purchase)
CREATE OR REPLACE FUNCTION add_paid_tokens(
  p_user_id text,
  p_tokens bigint,
  p_pack_id uuid DEFAULT NULL,
  p_amount_paid decimal DEFAULT 0,
  p_stripe_payment_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_paid_balance bigint;
  v_new_free_balance bigint;
BEGIN
  -- Add tokens and upgrade to paid tier
  UPDATE profiles
  SET
    paid_tokens_balance = paid_tokens_balance + p_tokens,
    tokens_lifetime_purchased = COALESCE(tokens_lifetime_purchased, 0) + p_tokens,
    current_tier = 'paid'
  WHERE id = p_user_id
  RETURNING paid_tokens_balance, free_tokens_balance INTO v_new_paid_balance, v_new_free_balance;

  -- Log purchase
  IF p_stripe_payment_id IS NOT NULL THEN
    INSERT INTO token_purchases (user_id, pack_id, tokens_purchased, amount_paid_usd, stripe_payment_intent_id)
    VALUES (p_user_id, p_pack_id, p_tokens, p_amount_paid, p_stripe_payment_id);
  END IF;

  RETURN json_build_object(
    'success', true,
    'paid_balance', v_new_paid_balance,
    'free_balance', v_new_free_balance,
    'tier', 'paid'
  );
END;
$$;

-- 6. Function to refresh daily free tokens
CREATE OR REPLACE FUNCTION refresh_daily_free_tokens()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count integer;
BEGIN
  UPDATE profiles
  SET
    free_tokens_balance = 10000,
    last_token_refresh = now()
  WHERE
    (last_token_refresh IS NULL OR last_token_refresh < (now() - interval '1 day'));

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;

-- 7. Migrate existing tokens to new system
UPDATE profiles
SET
  free_tokens_balance = CASE
    WHEN tokens_balance <= 10000 THEN tokens_balance
    ELSE 10000
  END,
  paid_tokens_balance = CASE
    WHEN tokens_balance > 10000 THEN tokens_balance - 10000
    ELSE 0
  END,
  current_tier = CASE
    WHEN tokens_balance > 10000 OR tokens_lifetime_purchased > 0 THEN 'paid'
    ELSE 'free'
  END
WHERE free_tokens_balance IS NULL OR paid_tokens_balance IS NULL;

-- 8. Create index for tier queries
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(current_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_paid_balance ON profiles(paid_tokens_balance) WHERE paid_tokens_balance > 0;
