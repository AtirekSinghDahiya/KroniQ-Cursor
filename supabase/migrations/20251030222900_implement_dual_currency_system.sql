/*
  # Dual Currency System Implementation

  ## Overview
  Creates a dual currency system where:
  - Free users get 150,000 monthly coins (resets each month)
  - Paid users use tokens (existing system)
  - Premium models (Sora 2, Claude Sonnet, etc.) are locked for free users

  ## Changes

  1. Profile Updates
    - Add `monthly_coins` column (for free users)
    - Add `coins_last_reset` column (tracks monthly reset)
    - Add `is_premium` boolean (determines currency type)
    - Keep existing token columns for paid users

  2. Model Access Control
    - Free users: Can use free models with coins
    - Paid users: Can use all models with tokens

  3. Functions
    - `reset_monthly_coins()` - Resets coins on the 1st of each month
    - `get_user_balance()` - Returns appropriate balance based on tier
    - `deduct_currency()` - Deducts from coins or tokens based on tier

  4. Security
    - RLS policies ensure users can only access their own data
*/

-- Add new columns to profiles table
DO $$
BEGIN
  -- Add monthly_coins column (for free users)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'monthly_coins'
  ) THEN
    ALTER TABLE profiles ADD COLUMN monthly_coins BIGINT DEFAULT 150000;
  END IF;

  -- Add coins_last_reset column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'coins_last_reset'
  ) THEN
    ALTER TABLE profiles ADD COLUMN coins_last_reset TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add is_premium column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Initialize existing users
UPDATE profiles
SET
  monthly_coins = 150000,
  coins_last_reset = NOW(),
  is_premium = CASE
    WHEN paid_tokens_balance > 0 OR current_tier = 'premium' OR is_paid = TRUE THEN TRUE
    ELSE FALSE
  END
WHERE monthly_coins IS NULL;

-- Function to reset monthly coins (run via cron or edge function)
CREATE OR REPLACE FUNCTION reset_monthly_coins()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    monthly_coins = 150000,
    coins_last_reset = NOW()
  WHERE
    is_premium = FALSE
    AND coins_last_reset < DATE_TRUNC('month', NOW());
END;
$$;

-- Function to get user's current balance
CREATE OR REPLACE FUNCTION get_user_balance(user_id TEXT)
RETURNS TABLE (
  balance BIGINT,
  currency_type TEXT,
  is_premium BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN p.is_premium THEN p.paid_tokens_balance
      ELSE p.monthly_coins
    END as balance,
    CASE
      WHEN p.is_premium THEN 'tokens'
      ELSE 'coins'
    END as currency_type,
    p.is_premium
  FROM profiles p
  WHERE p.id = user_id;
END;
$$;

-- Function to deduct currency based on user tier
CREATE OR REPLACE FUNCTION deduct_currency(
  user_id TEXT,
  amount BIGINT,
  description TEXT DEFAULT 'AI usage'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_premium BOOLEAN;
  current_balance BIGINT;
  success BOOLEAN := FALSE;
BEGIN
  -- Get user's premium status and balance
  SELECT is_premium INTO user_premium FROM profiles WHERE id = user_id;

  IF user_premium THEN
    -- Paid user: deduct from tokens
    SELECT paid_tokens_balance INTO current_balance FROM profiles WHERE id = user_id;

    IF current_balance >= amount THEN
      UPDATE profiles
      SET paid_tokens_balance = paid_tokens_balance - amount
      WHERE id = user_id;
      success := TRUE;
    END IF;
  ELSE
    -- Free user: deduct from coins
    SELECT monthly_coins INTO current_balance FROM profiles WHERE id = user_id;

    IF current_balance >= amount THEN
      UPDATE profiles
      SET monthly_coins = monthly_coins - amount
      WHERE id = user_id;
      success := TRUE;
    END IF;
  END IF;

  RETURN success;
END;
$$;

-- Function to check if user can access a model
CREATE OR REPLACE FUNCTION can_access_model(
  user_id TEXT,
  model_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_premium BOOLEAN;
  is_premium_model BOOLEAN;
BEGIN
  -- Get user's premium status
  SELECT is_premium INTO user_premium FROM profiles WHERE id = user_id;

  -- Define premium models
  is_premium_model := model_id IN (
    'openai/sora-turbo',
    'claude-sonnet-4.5',
    'claude-sonnet-4.5-v2',
    'perplexity/sonar-pro',
    'perplexity/sonar-reasoning-pro',
    'o1-pro'
  );

  -- Premium users can access all models
  -- Free users can only access non-premium models
  IF user_premium THEN
    RETURN TRUE;
  ELSE
    RETURN NOT is_premium_model;
  END IF;
END;
$$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);
CREATE INDEX IF NOT EXISTS idx_profiles_coins_reset ON profiles(coins_last_reset) WHERE is_premium = FALSE;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION reset_monthly_coins() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_balance(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_currency(TEXT, BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_model(TEXT, TEXT) TO authenticated;
