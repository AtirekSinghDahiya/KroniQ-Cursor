/*
  # Promotional Campaigns System

  1. New Tables
    - `promotional_campaigns`
      - `id` (uuid, primary key)
      - `campaign_code` (text, unique) - The promo code users will use
      - `token_amount` (bigint) - Number of tokens to award
      - `max_redemptions` (integer) - Maximum number of redemptions allowed
      - `current_redemptions` (integer) - Current number of redemptions
      - `is_active` (boolean) - Whether campaign is active
      - `expires_at` (timestamptz, nullable) - Optional expiration date
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `promotional_redemptions`
      - `id` (uuid, primary key)
      - `user_id` (text) - Firebase user ID
      - `campaign_id` (uuid) - References promotional_campaigns
      - `tokens_awarded` (bigint) - Number of tokens awarded
      - `redeemed_at` (timestamptz)
      - `ip_address` (text, nullable) - For fraud detection
      - `user_agent` (text, nullable) - For bot detection

  2. Security
    - Disable RLS (using Firebase auth)
    - Unique constraint on (user_id, campaign_id) to prevent double redemption
    - Atomic redemption function to prevent race conditions

  3. Functions
    - `redeem_promo_atomic` - Atomically checks and redeems a promo code
    - `get_campaign_status` - Gets current status of a campaign

  4. Initial Data
    - Insert FIRST100 campaign with 5M tokens for first 100 users
*/

-- Create promotional_campaigns table
CREATE TABLE IF NOT EXISTS promotional_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_code text UNIQUE NOT NULL,
  token_amount bigint NOT NULL DEFAULT 0,
  max_redemptions integer NOT NULL DEFAULT 0,
  current_redemptions integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_token_amount CHECK (token_amount >= 0),
  CONSTRAINT valid_max_redemptions CHECK (max_redemptions > 0),
  CONSTRAINT valid_current_redemptions CHECK (current_redemptions >= 0 AND current_redemptions <= max_redemptions)
);

-- Create promotional_redemptions table
CREATE TABLE IF NOT EXISTS promotional_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  campaign_id uuid NOT NULL REFERENCES promotional_campaigns(id) ON DELETE CASCADE,
  tokens_awarded bigint NOT NULL DEFAULT 0,
  redeemed_at timestamptz DEFAULT now(),
  ip_address text,
  user_agent text,
  CONSTRAINT unique_user_campaign UNIQUE (user_id, campaign_id),
  CONSTRAINT valid_tokens_awarded CHECK (tokens_awarded >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_promotional_campaigns_code ON promotional_campaigns(campaign_code);
CREATE INDEX IF NOT EXISTS idx_promotional_campaigns_active ON promotional_campaigns(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_promotional_redemptions_user ON promotional_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotional_redemptions_campaign ON promotional_redemptions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_promotional_redemptions_timestamp ON promotional_redemptions(redeemed_at DESC);

-- Disable RLS (using Firebase auth)
ALTER TABLE promotional_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_redemptions DISABLE ROW LEVEL SECURITY;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_promotional_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_promotional_campaigns_updated_at_trigger ON promotional_campaigns;
CREATE TRIGGER update_promotional_campaigns_updated_at_trigger
  BEFORE UPDATE ON promotional_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_promotional_campaigns_updated_at();

-- Function to get campaign status
CREATE OR REPLACE FUNCTION get_campaign_status(p_campaign_code text)
RETURNS TABLE (
  campaign_id uuid,
  is_valid boolean,
  remaining_slots integer,
  is_expired boolean,
  token_amount bigint,
  message text
) AS $$
DECLARE
  v_campaign promotional_campaigns%ROWTYPE;
  v_remaining integer;
BEGIN
  -- Get campaign details
  SELECT * INTO v_campaign
  FROM promotional_campaigns
  WHERE campaign_code = p_campaign_code;

  -- Campaign not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT
      NULL::uuid,
      false,
      0,
      false,
      0::bigint,
      'Campaign not found'::text;
    RETURN;
  END IF;

  -- Check if expired
  IF v_campaign.expires_at IS NOT NULL AND v_campaign.expires_at < now() THEN
    RETURN QUERY SELECT
      v_campaign.id,
      false,
      0,
      true,
      v_campaign.token_amount,
      'Campaign has expired'::text;
    RETURN;
  END IF;

  -- Check if inactive
  IF NOT v_campaign.is_active THEN
    RETURN QUERY SELECT
      v_campaign.id,
      false,
      0,
      false,
      v_campaign.token_amount,
      'Campaign is not active'::text;
    RETURN;
  END IF;

  -- Calculate remaining slots
  v_remaining := v_campaign.max_redemptions - v_campaign.current_redemptions;

  -- Check if full
  IF v_remaining <= 0 THEN
    RETURN QUERY SELECT
      v_campaign.id,
      false,
      0,
      false,
      v_campaign.token_amount,
      'All redemption slots have been claimed'::text;
    RETURN;
  END IF;

  -- Campaign is valid
  RETURN QUERY SELECT
    v_campaign.id,
    true,
    v_remaining,
    false,
    v_campaign.token_amount,
    format('Campaign valid - %s slots remaining', v_remaining)::text;
END;
$$ LANGUAGE plpgsql;

-- Atomic redemption function
CREATE OR REPLACE FUNCTION redeem_promo_atomic(
  p_user_id text,
  p_campaign_code text,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS TABLE (
  success boolean,
  tokens_awarded bigint,
  message text,
  redemption_id uuid
) AS $$
DECLARE
  v_campaign promotional_campaigns%ROWTYPE;
  v_redemption_id uuid;
  v_tokens_awarded bigint;
  v_user_exists boolean;
BEGIN
  -- Lock the campaign row for update
  SELECT * INTO v_campaign
  FROM promotional_campaigns
  WHERE campaign_code = p_campaign_code
  FOR UPDATE;

  -- Campaign not found
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::bigint, 'Campaign not found'::text, NULL::uuid;
    RETURN;
  END IF;

  -- Check if campaign is expired
  IF v_campaign.expires_at IS NOT NULL AND v_campaign.expires_at < now() THEN
    RETURN QUERY SELECT false, 0::bigint, 'Campaign has expired'::text, NULL::uuid;
    RETURN;
  END IF;

  -- Check if campaign is active
  IF NOT v_campaign.is_active THEN
    RETURN QUERY SELECT false, 0::bigint, 'Campaign is not active'::text, NULL::uuid;
    RETURN;
  END IF;

  -- Check if campaign is full
  IF v_campaign.current_redemptions >= v_campaign.max_redemptions THEN
    RETURN QUERY SELECT false, 0::bigint, 'All redemption slots have been claimed'::text, NULL::uuid;
    RETURN;
  END IF;

  -- Check if user already redeemed this campaign
  IF EXISTS (
    SELECT 1 FROM promotional_redemptions
    WHERE user_id = p_user_id AND campaign_id = v_campaign.id
  ) THEN
    RETURN QUERY SELECT false, 0::bigint, 'You have already redeemed this campaign'::text, NULL::uuid;
    RETURN;
  END IF;

  -- Check if user profile exists
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = p_user_id
  ) INTO v_user_exists;

  IF NOT v_user_exists THEN
    RETURN QUERY SELECT false, 0::bigint, 'User profile not found'::text, NULL::uuid;
    RETURN;
  END IF;

  -- All checks passed, proceed with redemption
  v_tokens_awarded := v_campaign.token_amount;

  -- Insert redemption record
  INSERT INTO promotional_redemptions (
    user_id,
    campaign_id,
    tokens_awarded,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    v_campaign.id,
    v_tokens_awarded,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_redemption_id;

  -- Increment campaign redemption count
  UPDATE promotional_campaigns
  SET current_redemptions = current_redemptions + 1
  WHERE id = v_campaign.id;

  -- Add tokens to user's paid_tokens_balance (additional to free tokens)
  UPDATE profiles
  SET paid_tokens_balance = COALESCE(paid_tokens_balance, 0) + v_tokens_awarded
  WHERE id = p_user_id;

  -- Return success
  RETURN QUERY SELECT
    true,
    v_tokens_awarded,
    'Promotional tokens successfully awarded!'::text,
    v_redemption_id;
END;
$$ LANGUAGE plpgsql;

-- Insert the FIRST100 campaign
INSERT INTO promotional_campaigns (
  campaign_code,
  token_amount,
  max_redemptions,
  current_redemptions,
  is_active
) VALUES (
  'FIRST100',
  5000000,
  100,
  0,
  true
)
ON CONFLICT (campaign_code) DO NOTHING;
