/*
  # Fix Token Conversion Rate to Correct 1:1M Ratio

  1. Changes Made
    - Update deduct_tokens_with_tier function to use 1,000,000 conversion rate (was 10,000)
    - Update free daily tokens to 6,667 (200,000 per month for ~300 messages)
    - Update token pack amounts to correct values based on $1 = 1M tokens
    - Fix refresh_daily_free_tokens function

  2. Conversion Rate
    - OLD: $1 = 10,000 tokens (WRONG - caused massive underpricing)
    - NEW: $1 = 1,000,000 tokens (CORRECT)
    - This means 100x more tokens per dollar

  3. Free User Allocation
    - Monthly: 200,000 tokens (~300 messages on free models)
    - Daily: 6,667 tokens (~10 messages per day)
    - Cost to business: ~$0.20 per free user per month

  4. Token Pack Updates
    - Micro: $2 = 2,000,000 tokens (was 900K)
    - Starter: $5 = 5,000,000 tokens (was 2.25M)
    - Pro: $10 = 10,000,000 tokens (was 4.5M)
    - Power: $20 = 20,000,000 tokens + 2M bonus (was 10M)

  5. Example Costs (with 2x multiplier applied)
    - Grok 4 Fast: $0.0004 = 400 tokens per message
    - Claude Sonnet: $0.60 = 600,000 tokens per message
    - Claude Opus 4.1: $1.10 = 1,100,000 tokens per message
*/

-- 1. Update the deduct_tokens_with_tier function with correct conversion rate
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

  -- FIXED: Changed from 10000 to 1000000 for correct $1 = 1M tokens conversion
  v_tokens_needed := CEIL(v_total_cost_usd * 1000000);

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

-- 2. Update refresh_daily_free_tokens function with correct daily amount
CREATE OR REPLACE FUNCTION refresh_daily_free_tokens()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count integer;
BEGIN
  -- Daily allocation: 6,667 tokens (~10 messages/day, 200K/month for 300 messages)
  UPDATE profiles
  SET
    free_tokens_balance = 6667,
    last_token_refresh = now()
  WHERE
    (last_token_refresh IS NULL OR last_token_refresh < (now() - interval '1 day'));

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;

-- 3. Update existing profiles to have correct free token balance
UPDATE profiles
SET free_tokens_balance = 6667
WHERE free_tokens_balance = 10000 AND paid_tokens_balance = 0;

-- 4. Update token packs to correct amounts based on $1 = 1M tokens
UPDATE token_packs
SET
  tokens = 2000000,
  bonus_tokens = 0,
  updated_at = now()
WHERE name = 'Micro' OR price_usd = 2.00;

UPDATE token_packs
SET
  tokens = 5000000,
  bonus_tokens = 0,
  popular = true,
  updated_at = now()
WHERE name = 'Starter' OR (price_usd = 5.00 AND popular = true);

UPDATE token_packs
SET
  tokens = 10000000,
  bonus_tokens = 0,
  updated_at = now()
WHERE name = 'Pro' OR price_usd = 10.00;

UPDATE token_packs
SET
  tokens = 20000000,
  bonus_tokens = 2000000,
  updated_at = now()
WHERE name = 'Power' OR price_usd = 20.00;

-- 5. Insert correct packs if they don't exist
INSERT INTO token_packs (name, tokens, bonus_tokens, price_usd, recurring_price_usd, popular, active, description)
VALUES
  ('Micro', 2000000, 0, 2.00, 1.80, false, true, 'Perfect for trying out premium models'),
  ('Starter', 5000000, 0, 5.00, 4.50, true, true, 'Most popular - great for regular use'),
  ('Pro', 10000000, 0, 10.00, 9.00, false, true, 'For power users who need more'),
  ('Power', 20000000, 2000000, 20.00, 18.00, false, true, 'Maximum value with 10% bonus')
ON CONFLICT (name) DO UPDATE SET
  tokens = EXCLUDED.tokens,
  bonus_tokens = EXCLUDED.bonus_tokens,
  price_usd = EXCLUDED.price_usd,
  recurring_price_usd = EXCLUDED.recurring_price_usd,
  popular = EXCLUDED.popular,
  description = EXCLUDED.description,
  updated_at = now();

-- 6. Add helpful comment explaining the correct system
COMMENT ON FUNCTION deduct_tokens_with_tier IS 'Deducts tokens with 2x multiplier. Conversion: $1 = 1,000,000 tokens. Example: $0.0004 base cost × 2 = $0.0008 = 800 tokens.';
COMMENT ON FUNCTION refresh_daily_free_tokens IS 'Refreshes free users to 6,667 tokens daily (200,000 monthly = ~300 messages on free models)';
