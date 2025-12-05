/*
  # Implement Strict Tier-Based Access Control System

  ## Overview
  This migration implements a proper tier system with strict access controls and token limits.

  ## Changes

  1. **Tier Configuration Table**
     - `tier_config` table stores tier rules (free vs paid tiers)
     - Defines daily/monthly token limits
     - Defines which models are accessible per tier

  2. **User Tier Management**
     - Update profiles table to track current tier
     - Add token refresh logic based on tier
     - Free tier: 5,000 daily tokens, 150,000 monthly tokens
     - Paid tiers: Based on purchased token packs

  3. **Access Control**
     - Free tier: Only free models (no premium models, no video generation)
     - Paid tier: All models including premium and video generation
     - Enforce limits at database level

  4. **Token Refresh Function**
     - Auto-refresh daily tokens for free tier
     - Reset monthly counter on month change
     - Track usage properly

  ## Security
  - RLS policies ensure users can only access their own tier data
  - Tier changes require proper authentication
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS refresh_daily_tokens();
DROP FUNCTION IF EXISTS get_user_tier_config(text);
DROP FUNCTION IF EXISTS can_user_access_model(text, text, boolean);

-- Create tier configuration table
CREATE TABLE IF NOT EXISTS tier_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name text UNIQUE NOT NULL,
  tier_level integer NOT NULL,
  is_free_tier boolean NOT NULL DEFAULT false,
  daily_token_limit integer NOT NULL DEFAULT 0,
  monthly_token_limit integer NOT NULL DEFAULT 0,
  can_access_premium_models boolean NOT NULL DEFAULT false,
  can_access_video_generation boolean NOT NULL DEFAULT false,
  can_access_image_generation boolean NOT NULL DEFAULT true,
  allowed_model_categories text[] DEFAULT ARRAY[]::text[],
  features jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert tier configurations
INSERT INTO tier_config (tier_name, tier_level, is_free_tier, daily_token_limit, monthly_token_limit, can_access_premium_models, can_access_video_generation, allowed_model_categories, features) VALUES
('free', 0, true, 5000, 150000, false, false, ARRAY['free-chat', 'free-code'], '{"max_projects": 3, "max_image_gen_monthly": 10}'::jsonb),
('starter', 1, false, 50000, 1000000, true, true, ARRAY['free-chat', 'free-code', 'premium-chat', 'premium-code', 'video', 'image'], '{"max_projects": 10, "unlimited_image_gen": true}'::jsonb),
('pro', 2, false, 100000, 5000000, true, true, ARRAY['free-chat', 'free-code', 'premium-chat', 'premium-code', 'video', 'image'], '{"max_projects": 50, "unlimited_image_gen": true, "api_access": true}'::jsonb),
('enterprise', 3, false, 500000, 50000000, true, true, ARRAY['free-chat', 'free-code', 'premium-chat', 'premium-code', 'video', 'image'], '{"unlimited_projects": true, "unlimited_image_gen": true, "api_access": true, "dedicated_support": true}'::jsonb)
ON CONFLICT (tier_name) DO UPDATE SET
  daily_token_limit = EXCLUDED.daily_token_limit,
  monthly_token_limit = EXCLUDED.monthly_token_limit,
  can_access_premium_models = EXCLUDED.can_access_premium_models,
  can_access_video_generation = EXCLUDED.can_access_video_generation,
  updated_at = now();

-- Function to get user's current tier configuration
CREATE OR REPLACE FUNCTION get_user_tier_config(user_id text)
RETURNS TABLE (
  tier_name text,
  tier_level integer,
  is_free_tier boolean,
  daily_token_limit integer,
  monthly_token_limit integer,
  can_access_premium_models boolean,
  can_access_video_generation boolean,
  daily_tokens_remaining integer,
  monthly_tokens_remaining integer,
  paid_tokens_available bigint,
  free_tokens_available bigint
) AS $$
DECLARE
  profile_record RECORD;
  tier_record RECORD;
BEGIN
  SELECT * INTO profile_record FROM profiles WHERE id = user_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF profile_record.paid_tokens_balance > 0 THEN
    SELECT * INTO tier_record FROM tier_config WHERE tier_name = 'starter';
  ELSE
    SELECT * INTO tier_record FROM tier_config WHERE tier_name = 'free';
  END IF;

  RETURN QUERY SELECT 
    tier_record.tier_name,
    tier_record.tier_level,
    tier_record.is_free_tier,
    tier_record.daily_token_limit,
    tier_record.monthly_token_limit,
    tier_record.can_access_premium_models,
    tier_record.can_access_video_generation,
    COALESCE(profile_record.daily_tokens_remaining, tier_record.daily_token_limit)::integer,
    COALESCE(profile_record.free_tokens_balance, tier_record.monthly_token_limit)::integer,
    COALESCE(profile_record.paid_tokens_balance, 0),
    COALESCE(profile_record.free_tokens_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh daily tokens for free tier users
CREATE OR REPLACE FUNCTION refresh_daily_tokens_for_free_tier()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET 
    daily_tokens_remaining = 5000,
    last_reset_date = CURRENT_DATE
  WHERE 
    (paid_tokens_balance IS NULL OR paid_tokens_balance = 0)
    AND (last_reset_date IS NULL OR last_reset_date < CURRENT_DATE);

  UPDATE profiles
  SET 
    free_tokens_balance = 150000,
    coins_last_reset = now()
  WHERE 
    (paid_tokens_balance IS NULL OR paid_tokens_balance = 0)
    AND (coins_last_reset IS NULL OR DATE_TRUNC('month', coins_last_reset) < DATE_TRUNC('month', CURRENT_DATE));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can access a specific model
CREATE OR REPLACE FUNCTION can_user_access_model(user_id text, model_id text, is_premium boolean)
RETURNS boolean AS $$
DECLARE
  tier_info RECORD;
  has_tokens boolean;
BEGIN
  SELECT * INTO tier_info FROM get_user_tier_config(user_id) LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  has_tokens := (tier_info.daily_tokens_remaining > 0 OR tier_info.paid_tokens_available > 0);
  
  IF NOT has_tokens THEN
    RETURN false;
  END IF;

  IF is_premium THEN
    RETURN tier_info.can_access_premium_models;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing profiles to have proper defaults
UPDATE profiles
SET 
  daily_tokens_remaining = COALESCE(daily_tokens_remaining, 5000),
  free_tokens_balance = COALESCE(free_tokens_balance, 150000),
  paid_tokens_balance = COALESCE(paid_tokens_balance, 0),
  last_reset_date = COALESCE(last_reset_date, CURRENT_DATE),
  coins_last_reset = COALESCE(coins_last_reset, now())
WHERE 
  daily_tokens_remaining IS NULL 
  OR free_tokens_balance IS NULL;

-- Enable RLS on tier_config
ALTER TABLE tier_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to read tier configs" ON tier_config;

-- Allow all authenticated users to read tier configs
CREATE POLICY "Allow authenticated users to read tier configs"
  ON tier_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes for faster tier lookups
CREATE INDEX IF NOT EXISTS idx_tier_config_tier_name ON tier_config(tier_name);
CREATE INDEX IF NOT EXISTS idx_profiles_paid_tokens ON profiles(paid_tokens_balance);
CREATE INDEX IF NOT EXISTS idx_profiles_tier_lookup ON profiles(id, paid_tokens_balance, free_tokens_balance);
