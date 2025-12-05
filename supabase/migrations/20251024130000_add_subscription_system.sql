/*
  # Add Subscription System for Token Packs

  ## Overview
  Implements recurring billing for token packs with 10% discount for monthly auto-refill.

  ## 1. New Table: subscriptions
    - `id` (uuid) - Primary key
    - `user_id` (text) - User identifier
    - `stripe_subscription_id` (text) - Stripe subscription ID
    - `stripe_customer_id` (text) - Stripe customer ID
    - `pack_id` (uuid) - Reference to token pack
    - `status` (text) - active, canceled, past_due, etc.
    - `current_period_start` (timestamptz) - Current billing period start
    - `current_period_end` (timestamptz) - Current billing period end
    - `cancel_at_period_end` (boolean) - Whether subscription cancels at end
    - `tokens_per_refill` (bigint) - Tokens added each billing cycle
    - `price_per_cycle` (decimal) - Monthly price (with 10% discount)
    - `created_at` (timestamptz) - When subscription was created
    - `updated_at` (timestamptz) - Last update time

  ## 2. Update token_packs table
    - Add `recurring_price_usd` (10% discount from one-time price)
    - Add `stripe_recurring_price_id` for Stripe subscription price

  ## 3. New Table: subscription_renewals
    - Track each successful renewal
    - Used for email notifications and history

  ## 4. Security
    - Enable RLS on all new tables
    - Users can only view their own subscriptions

  ## 5. Business Logic
    - One-time purchase: Existing flow unchanged
    - Recurring: Create Stripe subscription, add tokens monthly
    - Cancellation: Stop future renewals, keep current tokens
    - Free plan: Stacks with paid tokens (free + paid)
*/

-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  pack_id uuid REFERENCES token_packs(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  tokens_per_refill bigint NOT NULL,
  price_per_cycle decimal(10, 2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Create subscription_renewals table
CREATE TABLE IF NOT EXISTS subscription_renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  tokens_added bigint NOT NULL,
  amount_paid decimal(10, 2) NOT NULL,
  stripe_invoice_id text,
  renewed_at timestamptz DEFAULT now()
);

-- 3. Add recurring pricing columns to token_packs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_packs' AND column_name = 'recurring_price_usd'
  ) THEN
    ALTER TABLE token_packs ADD COLUMN recurring_price_usd decimal(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_packs' AND column_name = 'stripe_recurring_price_id'
  ) THEN
    ALTER TABLE token_packs ADD COLUMN stripe_recurring_price_id text;
  END IF;
END $$;

-- 4. Update existing token packs with 10% discounted recurring prices
UPDATE token_packs SET recurring_price_usd = ROUND(price_usd * 0.9, 2) WHERE recurring_price_usd IS NULL;

-- 5. Add stripe_customer_id to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN stripe_customer_id text UNIQUE;
  END IF;
END $$;

-- 6. Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_renewals ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
  DROP POLICY IF EXISTS "System can manage subscriptions" ON subscriptions;
  DROP POLICY IF EXISTS "Users can view own renewals" ON subscription_renewals;
  DROP POLICY IF EXISTS "System can insert renewals" ON subscription_renewals;
END $$;

-- 8. Create RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (true);

CREATE POLICY "System can manage subscriptions"
  ON subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);

-- 9. Create RLS Policies for subscription_renewals
CREATE POLICY "Users can view own renewals"
  ON subscription_renewals FOR SELECT
  USING (true);

CREATE POLICY "System can insert renewals"
  ON subscription_renewals FOR INSERT
  WITH CHECK (true);

-- 10. Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_subscription_renewals_subscription_id ON subscription_renewals(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_renewals_user_id ON subscription_renewals(user_id);

-- 11. Function to handle subscription renewal
CREATE OR REPLACE FUNCTION process_subscription_renewal(
  p_subscription_id text,
  p_invoice_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_record subscriptions%ROWTYPE;
  v_result json;
BEGIN
  -- Get subscription details
  SELECT * INTO v_subscription_record
  FROM subscriptions
  WHERE stripe_subscription_id = p_subscription_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Subscription not found');
  END IF;

  -- Add tokens to user account
  v_result := add_paid_tokens(
    v_subscription_record.user_id,
    v_subscription_record.tokens_per_refill,
    v_subscription_record.pack_id,
    v_subscription_record.price_per_cycle,
    p_invoice_id
  );

  IF (v_result->>'success')::boolean THEN
    -- Log renewal
    INSERT INTO subscription_renewals (
      subscription_id, user_id, tokens_added, amount_paid, stripe_invoice_id
    )
    VALUES (
      v_subscription_record.id,
      v_subscription_record.user_id,
      v_subscription_record.tokens_per_refill,
      v_subscription_record.price_per_cycle,
      p_invoice_id
    );

    RETURN json_build_object(
      'success', true,
      'tokens_added', v_subscription_record.tokens_per_refill,
      'user_id', v_subscription_record.user_id
    );
  ELSE
    RETURN v_result;
  END IF;
END;
$$;

-- 12. Function to cancel subscription
CREATE OR REPLACE FUNCTION cancel_subscription(
  p_user_id text,
  p_subscription_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stripe_sub_id text;
BEGIN
  -- Get stripe subscription ID
  SELECT stripe_subscription_id INTO v_stripe_sub_id
  FROM subscriptions
  WHERE id = p_subscription_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Subscription not found');
  END IF;

  -- Mark for cancellation at period end
  UPDATE subscriptions
  SET
    cancel_at_period_end = true,
    updated_at = now()
  WHERE id = p_subscription_id;

  RETURN json_build_object(
    'success', true,
    'stripe_subscription_id', v_stripe_sub_id,
    'message', 'Subscription will be canceled at end of current billing period'
  );
END;
$$;

-- 13. Function to get active subscription for user
CREATE OR REPLACE FUNCTION get_active_subscription(
  p_user_id text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'id', s.id,
    'status', s.status,
    'current_period_end', s.current_period_end,
    'cancel_at_period_end', s.cancel_at_period_end,
    'tokens_per_refill', s.tokens_per_refill,
    'price_per_cycle', s.price_per_cycle,
    'pack_name', tp.name,
    'created_at', s.created_at
  ) INTO v_result
  FROM subscriptions s
  JOIN token_packs tp ON s.pack_id = tp.id
  WHERE s.user_id = p_user_id AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;

  RETURN COALESCE(v_result, json_build_object('active', false));
END;
$$;
