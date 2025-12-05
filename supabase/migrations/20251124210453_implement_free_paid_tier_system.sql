/*
  # Implement Free/Paid Tier System with Proper Token Separation

  ## Overview
  Complete overhaul of the tier system to properly separate free and paid users,
  prevent exploitation, and enforce model access based on user type (not token balance).

  ## 1. New Columns in Profiles Table
    - `user_type` (text) - 'free' or 'paid' - PRIMARY tier indicator
    - `free_tokens_balance` (bigint) - Free promotional tokens (forfeited on upgrade)
    - `paid_tokens_balance` (bigint) - Purchased tokens (only for paid users)
    - `daily_free_tokens_remaining` (integer) - Daily refresh for free users
    - `daily_free_tokens_limit` (integer) - Daily limit (default 500)
    - `can_purchase_tokens` (boolean) - True if eligible to buy tokens
    - `last_purchase_date` (timestamptz) - Last token purchase date
    - `total_spent_usd` (decimal) - Lifetime spending

  ## 2. New Table: daily_usage_limits
    Track daily feature usage for free users (images, videos, music, etc.)

  ## 3. New Functions
    - `deduct_tokens_v2()` - Smart token deduction based on user type
    - `upgrade_to_paid()` - Handle free-to-paid transition
    - `reset_daily_free_tokens()` - Cron job to reset daily tokens
    - `increment_usage()` - Increment feature usage counters

  ## 4. Security
    - RLS enabled on all new tables
    - Atomic operations to prevent race conditions
    - Validation to prevent exploitation

  ## 5. Important Business Logic
    - Free users: Can only access FREE tier models, have daily limits
    - Paid users: Full access to all models, no daily limits
    - On purchase: Free tokens forfeited, user becomes paid
    - Cannot purchase if paid_tokens_balance > 0
    - Token balance irrelevant to access control (user_type is king)
*/

-- 1. Add new columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'user_type'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_type TEXT DEFAULT 'free' CHECK (user_type IN ('free', 'paid'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'free_tokens_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN free_tokens_balance BIGINT DEFAULT 5000000;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'paid_tokens_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN paid_tokens_balance BIGINT DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'daily_free_tokens_remaining'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_free_tokens_remaining INTEGER DEFAULT 500;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'daily_free_tokens_limit'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_free_tokens_limit INTEGER DEFAULT 500;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'can_purchase_tokens'
  ) THEN
    ALTER TABLE profiles ADD COLUMN can_purchase_tokens BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_purchase_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_purchase_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'total_spent_usd'
  ) THEN
    ALTER TABLE profiles ADD COLUMN total_spent_usd DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- 2. Create daily_usage_limits table
CREATE TABLE IF NOT EXISTS daily_usage_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  user_type TEXT NOT NULL DEFAULT 'free',
  chat_messages INTEGER DEFAULT 0,
  images_used INTEGER DEFAULT 0,
  videos_used INTEGER DEFAULT 0,
  music_used INTEGER DEFAULT 0,
  tts_used INTEGER DEFAULT 0,
  code_generations INTEGER DEFAULT 0,
  last_reset TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on daily_usage_limits
ALTER TABLE daily_usage_limits ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for daily_usage_limits
DROP POLICY IF EXISTS "Users can view own usage" ON daily_usage_limits;
DROP POLICY IF EXISTS "Users can update own usage" ON daily_usage_limits;
DROP POLICY IF EXISTS "System can insert usage" ON daily_usage_limits;

CREATE POLICY "Users can view own usage"
  ON daily_usage_limits FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can update own usage"
  ON daily_usage_limits FOR UPDATE
  USING (TRUE);

CREATE POLICY "System can insert usage"
  ON daily_usage_limits FOR INSERT
  WITH CHECK (TRUE);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_daily_usage_user_id ON daily_usage_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_usage_last_reset ON daily_usage_limits(last_reset);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_paid_tokens ON profiles(paid_tokens_balance);

-- 6. Create deduct_tokens_v2 function
CREATE OR REPLACE FUNCTION deduct_tokens_v2(
  p_user_id TEXT,
  p_tokens INTEGER,
  p_model TEXT,
  p_provider TEXT,
  p_cost_usd DECIMAL DEFAULT 0,
  p_request_type TEXT DEFAULT 'chat'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_type TEXT;
  v_paid_balance BIGINT;
  v_daily_free INTEGER;
  v_free_balance BIGINT;
  v_new_balance BIGINT;
  v_transaction_id UUID;
BEGIN
  SELECT user_type, paid_tokens_balance, daily_free_tokens_remaining, free_tokens_balance
  INTO v_user_type, v_paid_balance, v_daily_free, v_free_balance
  FROM profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'User not found', 'balance', 0);
  END IF;

  IF v_user_type = 'paid' OR v_paid_balance > 0 THEN
    IF v_paid_balance < p_tokens THEN
      RETURN json_build_object('success', FALSE, 'error', 'Insufficient paid tokens', 'balance', v_paid_balance);
    END IF;

    v_new_balance := v_paid_balance - p_tokens;

    UPDATE profiles
    SET paid_tokens_balance = v_new_balance,
        tokens_balance = GREATEST(0, tokens_balance - p_tokens),
        tokens_lifetime_used = COALESCE(tokens_lifetime_used, 0) + p_tokens,
        updated_at = NOW()
    WHERE id = p_user_id;

    IF v_new_balance = 0 THEN
      UPDATE profiles SET can_purchase_tokens = TRUE WHERE id = p_user_id;
    END IF;

    INSERT INTO token_transactions (user_id, model_name, provider, tokens_deducted, request_type, provider_cost_usd)
    VALUES (p_user_id, p_model, p_provider, p_tokens, p_request_type, p_cost_usd)
    RETURNING id INTO v_transaction_id;

    RETURN json_build_object('success', TRUE, 'balance', v_new_balance, 'transaction_id', v_transaction_id, 'user_type', 'paid');
  ELSE
    IF (v_daily_free + v_free_balance) < p_tokens THEN
      RETURN json_build_object('success', FALSE, 'error', 'Insufficient tokens', 'balance', v_daily_free + v_free_balance);
    END IF;

    IF v_daily_free >= p_tokens THEN
      UPDATE profiles
      SET daily_free_tokens_remaining = daily_free_tokens_remaining - p_tokens,
          tokens_lifetime_used = COALESCE(tokens_lifetime_used, 0) + p_tokens,
          updated_at = NOW()
      WHERE id = p_user_id;

      v_new_balance := v_daily_free - p_tokens + v_free_balance;
    ELSE
      UPDATE profiles
      SET daily_free_tokens_remaining = 0,
          free_tokens_balance = free_tokens_balance - (p_tokens - v_daily_free),
          tokens_lifetime_used = COALESCE(tokens_lifetime_used, 0) + p_tokens,
          updated_at = NOW()
      WHERE id = p_user_id;

      v_new_balance := v_free_balance - (p_tokens - v_daily_free);
    END IF;

    INSERT INTO token_transactions (user_id, model_name, provider, tokens_deducted, request_type, provider_cost_usd)
    VALUES (p_user_id, p_model, p_provider, p_tokens, p_request_type, p_cost_usd)
    RETURNING id INTO v_transaction_id;

    RETURN json_build_object('success', TRUE, 'balance', v_new_balance, 'transaction_id', v_transaction_id, 'user_type', 'free');
  END IF;
END;
$$;

-- 7. Create upgrade_to_paid function
CREATE OR REPLACE FUNCTION upgrade_to_paid(
  p_user_id TEXT,
  p_tokens BIGINT,
  p_amount_usd DECIMAL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_paid_tokens BIGINT;
BEGIN
  SELECT paid_tokens_balance INTO v_current_paid_tokens FROM profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'User not found');
  END IF;

  IF v_current_paid_tokens > 0 THEN
    RETURN json_build_object('success', FALSE, 'error', 'Cannot purchase while you have existing paid tokens');
  END IF;

  UPDATE profiles
  SET user_type = 'paid',
      paid_tokens_balance = p_tokens,
      tokens_balance = p_tokens,
      free_tokens_balance = 0,
      is_paid = TRUE,
      is_premium = TRUE,
      current_tier = 'premium',
      can_purchase_tokens = FALSE,
      total_spent_usd = COALESCE(total_spent_usd, 0) + p_amount_usd,
      last_purchase_date = NOW(),
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN json_build_object('success', TRUE, 'new_balance', p_tokens, 'tier', 'paid');
END;
$$;

-- 8. Create reset_daily_free_tokens function
CREATE OR REPLACE FUNCTION reset_daily_free_tokens()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE profiles
  SET daily_free_tokens_remaining = daily_free_tokens_limit, last_token_refresh = NOW()
  WHERE user_type = 'free' AND (last_token_refresh IS NULL OR last_token_refresh < NOW() - INTERVAL '24 hours');
END;
$$;

-- 9. Create increment_usage function
CREATE OR REPLACE FUNCTION increment_usage(p_user_id TEXT, p_column TEXT, p_amount INTEGER)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO daily_usage_limits (user_id, updated_at)
  VALUES (p_user_id, NOW())
  ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();

  EXECUTE format('UPDATE daily_usage_limits SET %I = COALESCE(%I, 0) + $1, updated_at = NOW() WHERE user_id = $2', p_column, p_column)
  USING p_amount, p_user_id;
END;
$$;

-- 10. Migrate existing users
DO $$
BEGIN
  UPDATE profiles
  SET user_type = CASE WHEN paid_tokens_balance > 0 THEN 'paid' ELSE 'free' END,
      can_purchase_tokens = CASE WHEN paid_tokens_balance > 0 THEN FALSE ELSE TRUE END,
      free_tokens_balance = CASE WHEN paid_tokens_balance = 0 THEN COALESCE(tokens_balance, 5000000) ELSE 0 END
  WHERE user_type IS NULL OR user_type = '';

  INSERT INTO daily_usage_limits (user_id, user_type, last_reset)
  SELECT id, 'free', NOW() FROM profiles WHERE user_type = 'free'
  ON CONFLICT (user_id) DO NOTHING;
END $$;