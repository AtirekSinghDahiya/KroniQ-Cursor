/*
  # Update Free Tier to 800K Tokens Monthly

  1. Changes
    - Update free tier allocation to 800,000 tokens per month (our cost: $0.80)
    - Daily allocation: ~26,667 tokens (800,000 / 30 days)
    - Allows approximately 33 messages per day on free models (at 800 tokens/msg)
    - Or approximately 1,000 messages per month total
    
  2. Updates
    - Set tokens_balance default to 800,000 for new users
    - Set daily_free_tokens to 26,667 (daily refresh amount)
    - Update all existing free users (those who haven't purchased) to 800,000 tokens
    
  3. Notes
    - Free users start with 800K tokens
    - Daily refresh gives them 26,667 tokens if below that amount
    - Paid users keep their purchased token balance
*/

-- Update the default token balance for new free users to 800,000
ALTER TABLE profiles 
  ALTER COLUMN tokens_balance SET DEFAULT 800000;

-- Update the daily free token refresh amount to 26,667
ALTER TABLE profiles 
  ALTER COLUMN daily_free_tokens SET DEFAULT 26667;

-- Update all existing free users to 800,000 tokens
-- Free users are those who haven't purchased any tokens
UPDATE profiles
SET 
  tokens_balance = 800000,
  daily_free_tokens = 26667,
  updated_at = now()
WHERE is_paid_user = false 
  AND (tokens_lifetime_purchased = 0 OR tokens_lifetime_purchased IS NULL);

-- Add helpful comments
COMMENT ON COLUMN profiles.tokens_balance IS 'Token balance: Free users get 800,000 tokens/month (our cost $0.80), refreshes 26,667 daily';
COMMENT ON COLUMN profiles.daily_free_tokens IS 'Daily free token refresh amount: 26,667 tokens (800,000 / 30 days)';
