/*
  # Add Missing Profile Columns for Token System

  ## Summary
  Add columns that the application expects for the token/tier system

  ## Changes
  - Add current_tier column (free/paid)
  - Add daily_tokens_remaining column
  - Add daily_token_limit column  
  - Add is_paid column (for legacy support)
  - Add last_reset_date column
  - Set defaults for all users
*/

-- Add missing columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_tier text DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_tokens_remaining integer DEFAULT 800000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_token_limit integer DEFAULT 800000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_reset_date date DEFAULT CURRENT_DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tokens_remaining integer DEFAULT 0;

-- Update existing users with proper defaults
UPDATE profiles 
SET 
  current_tier = CASE WHEN is_paid_user THEN 'paid' ELSE 'free' END,
  daily_tokens_remaining = COALESCE(daily_free_tokens, 800000),
  daily_token_limit = COALESCE(daily_free_tokens, 800000),
  is_paid = COALESCE(is_paid_user, false),
  tokens_remaining = COALESCE(tokens_balance, 0)
WHERE current_tier IS NULL OR daily_tokens_remaining IS NULL;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(current_tier);
