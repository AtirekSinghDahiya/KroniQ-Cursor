/*
  # Add User Tier Tracking System

  ## Summary
  Adds user tier tracking to determine which AI models users can access.
  Free users can only use free models, paid users can use all models.

  ## Changes
  1. Add `user_tier` column to profiles table
  2. Add `has_purchased` boolean to profiles
  3. Add function to check if user has paid tier access
  4. Update profiles when purchases are made

  ## User Tiers
  - free: Default tier, 10K daily tokens, access to 14 free models only
  - paid: Purchased any token pack, access to all 27 models

  ## Security
  No RLS changes needed - existing policies apply
*/

-- Add user tier tracking columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'user_tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_tier text DEFAULT 'free' CHECK (user_tier IN ('free', 'paid'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'has_purchased'
  ) THEN
    ALTER TABLE profiles ADD COLUMN has_purchased boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_purchase_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_purchase_at timestamptz;
  END IF;
END $$;

-- Create function to upgrade user to paid tier
CREATE OR REPLACE FUNCTION upgrade_user_to_paid_tier(user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    user_tier = 'paid',
    has_purchased = true,
    first_purchase_at = COALESCE(first_purchase_at, now())
  WHERE id = user_id;
END;
$$;

-- Create function to check if model is accessible
CREATE OR REPLACE FUNCTION can_access_model(user_id text, model_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_tier_value text;
  is_paid_model boolean;
BEGIN
  -- Get user tier
  SELECT user_tier INTO user_tier_value
  FROM profiles
  WHERE id = user_id;

  -- Check if model requires paid tier (contains 'free' in description means it's free)
  -- Paid models: gpt-5-*, deepseek-v3.2, nemotron-super, qwen-vl-32b, claude-sonnet,
  -- gemini-flash-image, kimi-k2, llama-4-maverick, glm-4.6, dall-e-3, stable-diffusion-xl,
  -- firefly, sora, eleven-labs

  is_paid_model := model_id IN (
    'gpt-5-chat', 'gpt-5-codex', 'deepseek-v3.2', 'nemotron-super', 'qwen-vl-32b',
    'claude-sonnet', 'gemini-flash-image', 'kimi-k2', 'llama-4-maverick', 'glm-4.6',
    'dall-e-3', 'stable-diffusion-xl', 'firefly', 'sora', 'eleven-labs'
  );

  -- Free users can only access free models
  IF user_tier_value = 'free' AND is_paid_model THEN
    RETURN false;
  END IF;

  -- Paid users can access all models
  RETURN true;
END;
$$;

-- Add comment explaining the tier system
COMMENT ON COLUMN profiles.user_tier IS 'User tier: free (default, 10K daily tokens, 14 free models) or paid (purchased any pack, all 27 models)';
COMMENT ON COLUMN profiles.has_purchased IS 'True if user has ever purchased a token pack';
COMMENT ON COLUMN profiles.first_purchase_at IS 'Timestamp of first token pack purchase';
