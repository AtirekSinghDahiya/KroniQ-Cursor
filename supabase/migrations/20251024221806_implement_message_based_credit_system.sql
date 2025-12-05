/*
  # Message-Based Credit System Implementation
  
  ## Overview
  Converts the token-based system to a message-based credit system where users pay per message.
  
  ## 1. Free Tier Structure
    - 10 messages per day (renewable daily at midnight UTC)
    - Maximum 300 messages per month
    - Messages do NOT rollover to next day or month
    - Hard reset at midnight UTC daily
    - Monthly counter resets on 1st of each month
  
  ## 2. Paid Pack Structure
    **$2 Pack (Starter):** 909 messages
    **$5 Pack (Popular):** 2,272 messages
    **$10 Pack (Power User):** 4,545 messages
    **$20 Pack (Pro):** 9,090 messages
    
    - No daily limits, use anytime
    - Messages never expire until used
    - Can use all messages in 1 day if desired
  
  ## 3. Business Logic
    - Cost calculation: $0.022 per 20 messages (provider cost)
    - User pays: $0.044 per 20 messages (2x markup = 100% profit margin)
    - Free users: 10 messages/day, 300 messages/month
    - Paid users: Unlimited usage speed, messages valid until depleted
  
  ## 4. New Columns in Profiles Table
    - `messages_remaining` (integer) - Current message balance
    - `is_paid_user` (boolean) - Whether user has purchased any pack
    - `last_purchase_date` (timestamptz) - Last pack purchase timestamp
    - `daily_messages_used` (integer) - Messages used today (free users)
    - `daily_reset_date` (date) - Last daily reset date
    - `monthly_messages_used` (integer) - Messages used this month (free users)
    - `monthly_reset_date` (date) - Last monthly reset date
  
  ## 5. Security
    - Automatic reset logic for free users
    - Message tracking in transactions
    - Prevents overdraft
*/

-- 1. Add message tracking columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'messages_remaining'
  ) THEN
    ALTER TABLE profiles ADD COLUMN messages_remaining integer DEFAULT 10;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_paid_user'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_paid_user boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_purchase_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_purchase_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'daily_messages_used'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_messages_used integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'daily_reset_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_reset_date date DEFAULT CURRENT_DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'monthly_messages_used'
  ) THEN
    ALTER TABLE profiles ADD COLUMN monthly_messages_used integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'monthly_reset_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN monthly_reset_date date DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- 2. Create message_transactions table for tracking
CREATE TABLE IF NOT EXISTS message_transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  messages_deducted integer NOT NULL DEFAULT 1,
  user_type text NOT NULL CHECK (user_type IN ('free', 'paid')),
  balance_after integer NOT NULL,
  request_type text DEFAULT 'chat',
  model_name text,
  created_at timestamptz DEFAULT now()
);

-- 3. Create function to check and reset daily/monthly limits for free users
CREATE OR REPLACE FUNCTION check_and_reset_free_limits(p_user_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_paid boolean;
  v_daily_reset_date date;
  v_monthly_reset_date date;
  v_current_date date := CURRENT_DATE;
  v_messages_remaining integer;
  v_daily_used integer;
  v_monthly_used integer;
BEGIN
  -- Get current user state
  SELECT is_paid_user, daily_reset_date, monthly_reset_date, 
         messages_remaining, daily_messages_used, monthly_messages_used
  INTO v_is_paid, v_daily_reset_date, v_monthly_reset_date,
       v_messages_remaining, v_daily_used, v_monthly_used
  FROM profiles
  WHERE id = p_user_id;

  -- If paid user, no limits to check
  IF v_is_paid THEN
    RETURN json_build_object(
      'success', true,
      'is_paid', true,
      'messages_remaining', v_messages_remaining,
      'reset_occurred', false
    );
  END IF;

  -- Check if daily reset is needed
  IF v_daily_reset_date < v_current_date THEN
    UPDATE profiles
    SET
      daily_messages_used = 0,
      daily_reset_date = v_current_date,
      messages_remaining = 10
    WHERE id = p_user_id;
    
    v_daily_used := 0;
    v_messages_remaining := 10;
  END IF;

  -- Check if monthly reset is needed
  IF EXTRACT(MONTH FROM v_monthly_reset_date) < EXTRACT(MONTH FROM v_current_date)
     OR EXTRACT(YEAR FROM v_monthly_reset_date) < EXTRACT(YEAR FROM v_current_date) THEN
    UPDATE profiles
    SET
      monthly_messages_used = 0,
      monthly_reset_date = v_current_date
    WHERE id = p_user_id;
    
    v_monthly_used := 0;
  END IF;

  RETURN json_build_object(
    'success', true,
    'is_paid', false,
    'messages_remaining', v_messages_remaining,
    'daily_used', v_daily_used,
    'monthly_used', v_monthly_used,
    'daily_limit', 10,
    'monthly_limit', 300,
    'reset_occurred', true
  );
END;
$$;

-- 4. Create function to deduct messages
CREATE OR REPLACE FUNCTION deduct_message_credit(
  p_user_id text,
  p_model text DEFAULT 'unknown',
  p_request_type text DEFAULT 'chat'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_paid boolean;
  v_messages_remaining integer;
  v_daily_used integer;
  v_monthly_used integer;
  v_new_balance integer;
  v_transaction_id uuid;
BEGIN
  -- First, check and reset limits if needed
  PERFORM check_and_reset_free_limits(p_user_id);

  -- Get current user state
  SELECT is_paid_user, messages_remaining, daily_messages_used, monthly_messages_used
  INTO v_is_paid, v_messages_remaining, v_daily_used, v_monthly_used
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Check if user has available messages
  IF NOT v_is_paid THEN
    -- Free user: check daily and monthly limits
    IF v_daily_used >= 10 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Daily limit reached',
        'daily_limit', 10,
        'daily_used', v_daily_used
      );
    END IF;

    IF v_monthly_used >= 300 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Monthly limit reached',
        'monthly_limit', 300,
        'monthly_used', v_monthly_used
      );
    END IF;

    IF v_messages_remaining <= 0 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'No messages remaining today'
      );
    END IF;
  ELSE
    -- Paid user: just check balance
    IF v_messages_remaining <= 0 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'No messages remaining',
        'suggestion', 'Please purchase more messages'
      );
    END IF;
  END IF;

  -- Deduct message
  IF NOT v_is_paid THEN
    -- Free user: deduct from all counters
    UPDATE profiles
    SET
      messages_remaining = messages_remaining - 1,
      daily_messages_used = daily_messages_used + 1,
      monthly_messages_used = monthly_messages_used + 1
    WHERE id = p_user_id
    RETURNING messages_remaining INTO v_new_balance;
  ELSE
    -- Paid user: just deduct from balance
    UPDATE profiles
    SET messages_remaining = messages_remaining - 1
    WHERE id = p_user_id
    RETURNING messages_remaining INTO v_new_balance;
  END IF;

  -- Log transaction
  INSERT INTO message_transactions (
    user_id, messages_deducted, user_type, balance_after, request_type, model_name
  )
  VALUES (
    p_user_id, 1, CASE WHEN v_is_paid THEN 'paid' ELSE 'free' END, 
    v_new_balance, p_request_type, p_model
  )
  RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', true,
    'messages_remaining', v_new_balance,
    'is_paid', v_is_paid,
    'daily_used', CASE WHEN v_is_paid THEN NULL ELSE v_daily_used + 1 END,
    'monthly_used', CASE WHEN v_is_paid THEN NULL ELSE v_monthly_used + 1 END,
    'transaction_id', v_transaction_id
  );
END;
$$;

-- 5. Create function to add messages (purchase)
CREATE OR REPLACE FUNCTION add_message_credits(
  p_user_id text,
  p_messages integer,
  p_pack_price decimal,
  p_stripe_payment_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  -- Add messages and mark as paid user
  UPDATE profiles
  SET
    messages_remaining = messages_remaining + p_messages,
    is_paid_user = true,
    last_purchase_date = now()
  WHERE id = p_user_id
  RETURNING messages_remaining INTO v_new_balance;

  -- Log purchase in transactions table if needed
  IF p_stripe_payment_id IS NOT NULL THEN
    INSERT INTO transactions (
      user_id, plan_name, amount, status, transaction_type, metadata
    )
    VALUES (
      p_user_id, 
      'Message Pack - ' || p_messages || ' messages',
      p_pack_price,
      'completed',
      'purchase',
      json_build_object(
        'messages_purchased', p_messages,
        'stripe_payment_id', p_stripe_payment_id
      )
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'messages_remaining', v_new_balance,
    'is_paid', true
  );
END;
$$;

-- 6. Update token_packs with correct message counts
UPDATE token_packs SET
  name = 'Starter Pack',
  tokens = 909,
  price_usd = 2.00,
  popular = false,
  bonus_tokens = 0
WHERE name = 'Micro Pack' AND active = true;

UPDATE token_packs SET
  name = 'Popular Pack',
  tokens = 2272,
  price_usd = 5.00,
  popular = true,
  bonus_tokens = 0
WHERE name = 'Mini Pack' AND active = true;

UPDATE token_packs SET
  name = 'Power User Pack',
  tokens = 4545,
  price_usd = 10.00,
  popular = false,
  bonus_tokens = 0
WHERE name = 'Standard Pack' AND active = true;

UPDATE token_packs SET
  name = 'Pro Pack',
  tokens = 9090,
  price_usd = 20.00,
  popular = false,
  bonus_tokens = 0
WHERE name = 'Power Pack' AND active = true;

-- Disable the 36 dollar pack
UPDATE token_packs SET active = false WHERE price_usd = 36.00;

-- 7. Initialize existing users with default free messages
UPDATE profiles
SET
  messages_remaining = CASE WHEN is_paid_user THEN messages_remaining ELSE 10 END,
  daily_messages_used = 0,
  monthly_messages_used = 0,
  daily_reset_date = CURRENT_DATE,
  monthly_reset_date = CURRENT_DATE
WHERE messages_remaining IS NULL;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_paid ON profiles(is_paid_user);
CREATE INDEX IF NOT EXISTS idx_profiles_messages_remaining ON profiles(messages_remaining);
CREATE INDEX IF NOT EXISTS idx_message_transactions_user ON message_transactions(user_id, created_at DESC);
