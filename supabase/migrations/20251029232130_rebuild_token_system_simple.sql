/*
  # Rebuild Token System - One-Time Packs (Simple)

  ## Summary
  Simplifies token system to one-time purchases only with tier-based display

  ## Changes
  1. Remove subscription tables
  2. Update token packs
  3. Create balance and access control functions
  4. Keep existing token_purchases table
*/

-- ============================================================================
-- 1. REMOVE SUBSCRIPTION TABLES
-- ============================================================================

DROP TABLE IF EXISTS subscription_renewals CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;

-- ============================================================================
-- 2. UPDATE TOKEN_PACKS
-- ============================================================================

-- Clear and recreate simple one-time packs
TRUNCATE TABLE token_packs CASCADE;

INSERT INTO token_packs (name, tokens, price_usd, popular, bonus_tokens, active) VALUES
  ('Starter', 1000000, 2.00, false, 0, true),
  ('Popular', 2500000, 5.00, true, 0, true),
  ('Power User', 5500000, 10.00, false, 500000, true),
  ('Pro', 10000000, 20.00, false, 2000000, true),
  ('Enterprise', 50000000, 100.00, false, 15000000, true);

-- ============================================================================
-- 3. TOKEN BALANCE FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_token_balance(p_user_id text)
RETURNS TABLE (
  user_id text,
  tier text,
  daily_tokens integer,
  paid_tokens integer,
  total_tokens bigint,
  can_use_paid_models boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
BEGIN
  SELECT 
    id,
    COALESCE(current_tier, 'free') as tier,
    COALESCE(daily_tokens_remaining, 0) as daily,
    COALESCE(tokens_remaining, 0) as paid
  INTO v_profile
  FROM profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT
    v_profile.id,
    v_profile.tier,
    v_profile.daily,
    v_profile.paid,
    (v_profile.daily + v_profile.paid)::bigint as total,
    (v_profile.paid > 0)::boolean as can_access_paid;
END;
$$;

-- ============================================================================
-- 4. TOKEN DEDUCTION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION deduct_user_tokens(
  p_user_id text,
  p_token_amount integer,
  p_model_tier text DEFAULT 'free'
)
RETURNS TABLE (
  success boolean,
  remaining_daily integer,
  remaining_paid integer,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daily integer;
  v_paid integer;
  v_tier text;
BEGIN
  -- Get current balances
  SELECT 
    COALESCE(daily_tokens_remaining, 0),
    COALESCE(tokens_remaining, 0),
    COALESCE(current_tier, 'free')
  INTO v_daily, v_paid, v_tier
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, 'User not found'::text;
    RETURN;
  END IF;
  
  -- Check if using paid model but no paid tokens
  IF p_model_tier IN ('premium', 'ultra-premium', 'paid', 'budget', 'mid') AND v_paid = 0 THEN
    RETURN QUERY SELECT false, v_daily, v_paid, 'Purchase tokens to access paid models'::text;
    RETURN;
  END IF;
  
  -- Check total balance
  IF (v_daily + v_paid) < p_token_amount THEN
    RETURN QUERY SELECT false, v_daily, v_paid, 'Insufficient tokens'::text;
    RETURN;
  END IF;
  
  -- Deduct from paid first if available
  IF v_paid >= p_token_amount THEN
    UPDATE profiles 
    SET tokens_remaining = tokens_remaining - p_token_amount,
        tokens_lifetime_used = COALESCE(tokens_lifetime_used, 0) + p_token_amount,
        updated_at = NOW()
    WHERE id = p_user_id;
    v_paid := v_paid - p_token_amount;
  
  -- Deduct from daily
  ELSIF v_daily >= p_token_amount THEN
    UPDATE profiles 
    SET daily_tokens_remaining = daily_tokens_remaining - p_token_amount,
        updated_at = NOW()
    WHERE id = p_user_id;
    v_daily := v_daily - p_token_amount;
  
  -- Split between both
  ELSE
    DECLARE
      v_from_paid integer := LEAST(v_paid, p_token_amount);
      v_from_daily integer := p_token_amount - v_from_paid;
    BEGIN
      UPDATE profiles 
      SET tokens_remaining = tokens_remaining - v_from_paid,
          daily_tokens_remaining = daily_tokens_remaining - v_from_daily,
          tokens_lifetime_used = COALESCE(tokens_lifetime_used, 0) + p_token_amount,
          updated_at = NOW()
      WHERE id = p_user_id;
      v_paid := v_paid - v_from_paid;
      v_daily := v_daily - v_from_daily;
    END;
  END IF;
  
  RETURN QUERY SELECT true, v_daily, v_paid, NULL::text;
END;
$$;

-- ============================================================================
-- 5. MODEL ACCESS CONTROL
-- ============================================================================

CREATE OR REPLACE FUNCTION can_user_access_model(
  p_user_id text,
  p_model_tier text
)
RETURNS TABLE (
  can_access boolean,
  reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daily integer;
  v_paid integer;
BEGIN
  SELECT 
    COALESCE(daily_tokens_remaining, 0),
    COALESCE(tokens_remaining, 0)
  INTO v_daily, v_paid
  FROM profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'User not found'::text;
    RETURN;
  END IF;
  
  -- Free models: need any tokens
  IF p_model_tier = 'free' THEN
    IF (v_daily + v_paid) > 0 THEN
      RETURN QUERY SELECT true, 'Access granted'::text;
    ELSE
      RETURN QUERY SELECT false, 'No tokens available'::text;
    END IF;
    RETURN;
  END IF;
  
  -- Paid models: need paid tokens
  IF v_paid > 0 THEN
    RETURN QUERY SELECT true, 'Access granted'::text;
  ELSE
    RETURN QUERY SELECT false, 'Purchase tokens to access this model'::text;
  END IF;
END;
$$;

-- ============================================================================
-- 6. PURCHASE RECORDING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION record_token_purchase(
  p_user_id text,
  p_pack_id uuid,
  p_stripe_payment_id text
)
RETURNS TABLE (
  success boolean,
  new_balance integer,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pack RECORD;
  v_total_tokens bigint;
  v_new_balance integer;
BEGIN
  -- Get pack details
  SELECT * INTO v_pack FROM token_packs WHERE id = p_pack_id AND active = true;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Invalid pack'::text;
    RETURN;
  END IF;
  
  v_total_tokens := v_pack.tokens + COALESCE(v_pack.bonus_tokens, 0);
  
  -- Add tokens to user
  UPDATE profiles
  SET 
    tokens_remaining = COALESCE(tokens_remaining, 0) + v_total_tokens::integer,
    tokens_lifetime_purchased = COALESCE(tokens_lifetime_purchased, 0) + v_total_tokens,
    is_paid = true,
    current_tier = CASE 
      WHEN current_tier = 'free' THEN 'premium'
      ELSE current_tier 
    END,
    last_purchase_date = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING tokens_remaining INTO v_new_balance;
  
  -- Record purchase
  INSERT INTO token_purchases (user_id, pack_id, tokens_purchased, amount_paid_usd, stripe_payment_intent_id)
  VALUES (p_user_id, p_pack_id, v_total_tokens, v_pack.price_usd, p_stripe_payment_id);
  
  RETURN QUERY SELECT true, v_new_balance, NULL::text;
END;
$$;

-- ============================================================================
-- 7. COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_user_token_balance(text) IS 'Get user token balance breakdown by tier';
COMMENT ON FUNCTION deduct_user_tokens(text, integer, text) IS 'Deduct tokens with tier-based access control';
COMMENT ON FUNCTION can_user_access_model(text, text) IS 'Check if user can access model tier';
COMMENT ON FUNCTION record_token_purchase(text, uuid, text) IS 'Record one-time token purchase';
