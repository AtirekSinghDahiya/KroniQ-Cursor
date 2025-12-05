/*
  # Token-Based Billing System Migration

  ## Overview
  Complete transition from plan-based to token-based billing with profit margin tracking.

  ## 1. New Columns in Profiles Table
    - `tokens_balance` (bigint) - Current token balance (default 500 for new users)
    - `tokens_lifetime_purchased` (bigint) - Total tokens ever purchased
    - `tokens_lifetime_used` (bigint) - Total tokens consumed
    - `daily_free_tokens` (integer) - Daily free token allowance (default 500)
    - `last_token_refresh` (timestamptz) - Last time free tokens were added
    - `is_token_user` (boolean) - True if using token system (default true)

  ## 2. Token Transactions Table
    Track every token usage with provider cost and profit margin

  ## 3. Token Packs Table
    Available token packages for purchase

  ## 4. Token Purchases Table
    Track all token purchases

  ## 5. Security
    - Enable RLS on all tables
    - Users can only view their own transactions

  ## 6. Important Notes
    - 1 USD = 10,000 KroniQ Tokens (KQ Tokens)
    - Default profit margin: $0.005 per request
    - Free users: 500 tokens/day auto-refill
*/

-- 1. Add token columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'tokens_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN tokens_balance bigint DEFAULT 500;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'tokens_lifetime_purchased'
  ) THEN
    ALTER TABLE profiles ADD COLUMN tokens_lifetime_purchased bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'tokens_lifetime_used'
  ) THEN
    ALTER TABLE profiles ADD COLUMN tokens_lifetime_used bigint DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'daily_free_tokens'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_free_tokens integer DEFAULT 500;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_token_refresh'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_token_refresh timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_token_user'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_token_user boolean DEFAULT true;
  END IF;
END $$;

-- 2. Create token_transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  model_name text NOT NULL,
  provider text NOT NULL,
  provider_cost_usd decimal(10, 6) NOT NULL DEFAULT 0,
  profit_margin_usd decimal(10, 6) NOT NULL DEFAULT 0.005,
  total_cost_usd decimal(10, 6) NOT NULL,
  tokens_deducted integer NOT NULL,
  prompt_tokens integer DEFAULT 0,
  completion_tokens integer DEFAULT 0,
  request_type text DEFAULT 'chat',
  created_at timestamptz DEFAULT now()
);

-- 3. Create token_packs table
CREATE TABLE IF NOT EXISTS token_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tokens bigint NOT NULL,
  price_usd decimal(10, 2) NOT NULL,
  stripe_price_id text UNIQUE,
  popular boolean DEFAULT false,
  bonus_tokens bigint DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4. Create token_purchases table
CREATE TABLE IF NOT EXISTS token_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  pack_id uuid REFERENCES token_packs(id),
  tokens_purchased bigint NOT NULL,
  amount_paid_usd decimal(10, 2) NOT NULL,
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now()
);

-- 5. Enable RLS
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_purchases ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own transactions" ON token_transactions;
  DROP POLICY IF EXISTS "System can insert transactions" ON token_transactions;
  DROP POLICY IF EXISTS "Anyone can view active packs" ON token_packs;
  DROP POLICY IF EXISTS "Users can view own purchases" ON token_purchases;
  DROP POLICY IF EXISTS "System can insert purchases" ON token_purchases;
END $$;

-- 7. Create RLS Policies for token_transactions
CREATE POLICY "Users can view own transactions"
  ON token_transactions FOR SELECT
  USING (true);

CREATE POLICY "System can insert transactions"
  ON token_transactions FOR INSERT
  WITH CHECK (true);

-- 8. Create RLS Policies for token_packs
CREATE POLICY "Anyone can view active packs"
  ON token_packs FOR SELECT
  USING (active = true);

-- 9. Create RLS Policies for token_purchases
CREATE POLICY "Users can view own purchases"
  ON token_purchases FOR SELECT
  USING (true);

CREATE POLICY "System can insert purchases"
  ON token_purchases FOR INSERT
  WITH CHECK (true);

-- 10. Insert default token packs
INSERT INTO token_packs (name, tokens, price_usd, popular, bonus_tokens, active)
VALUES
  ('Starter Pack', 10000, 2.00, false, 0, true),
  ('Popular Pack', 50000, 8.00, true, 5000, true),
  ('Pro Pack', 150000, 20.00, false, 20000, true),
  ('Enterprise Pack', 500000, 60.00, false, 100000, true)
ON CONFLICT DO NOTHING;

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_token_purchases_user_id ON token_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_token_packs_active ON token_packs(active) WHERE active = true;

-- 12. Create function to check and deduct tokens
CREATE OR REPLACE FUNCTION deduct_tokens(
  p_user_id text,
  p_tokens integer,
  p_model text,
  p_provider text,
  p_cost_usd decimal,
  p_request_type text DEFAULT 'chat'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance bigint;
  v_profit_margin decimal := 0.005;
  v_total_cost decimal;
  v_transaction_id uuid;
BEGIN
  SELECT tokens_balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id;

  IF v_current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  IF v_current_balance < p_tokens THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient tokens', 'balance', v_current_balance);
  END IF;

  v_total_cost := p_cost_usd + v_profit_margin;

  UPDATE profiles
  SET 
    tokens_balance = tokens_balance - p_tokens,
    tokens_lifetime_used = tokens_lifetime_used + p_tokens
  WHERE id = p_user_id;

  INSERT INTO token_transactions (
    user_id, model_name, provider, provider_cost_usd, 
    profit_margin_usd, total_cost_usd, tokens_deducted, request_type
  )
  VALUES (
    p_user_id, p_model, p_provider, p_cost_usd,
    v_profit_margin, v_total_cost, p_tokens, p_request_type
  )
  RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', true, 
    'balance', v_current_balance - p_tokens,
    'transaction_id', v_transaction_id
  );
END;
$$;

-- 13. Create function to add tokens
CREATE OR REPLACE FUNCTION add_tokens(
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
  v_new_balance bigint;
BEGIN
  UPDATE profiles
  SET 
    tokens_balance = tokens_balance + p_tokens,
    tokens_lifetime_purchased = tokens_lifetime_purchased + p_tokens
  WHERE id = p_user_id
  RETURNING tokens_balance INTO v_new_balance;

  IF p_stripe_payment_id IS NOT NULL THEN
    INSERT INTO token_purchases (user_id, pack_id, tokens_purchased, amount_paid_usd, stripe_payment_intent_id)
    VALUES (p_user_id, p_pack_id, p_tokens, p_amount_paid, p_stripe_payment_id);
  END IF;

  RETURN json_build_object('success', true, 'balance', v_new_balance);
END;
$$;

-- 14. Create function for daily token refresh
CREATE OR REPLACE FUNCTION refresh_daily_tokens()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated_count integer;
BEGIN
  UPDATE profiles
  SET 
    tokens_balance = tokens_balance + daily_free_tokens,
    last_token_refresh = now()
  WHERE 
    is_token_user = true
    AND (last_token_refresh IS NULL OR last_token_refresh < (now() - interval '1 day'));
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$;
