/*
  # Update Token Allocation to Message-Based System

  ## Summary
  Updates the entire token system to be based on message counts instead of raw tokens.
  Free tier gets 300 messages (~10/day), paid packs give 50% value (pay $2, get $1 worth).

  ## Key Changes

  ### 1. Free Tier
  - 300 messages per month (~10 messages/day)
  - Cost per message: $0.0005 average
  - Our cost: $0.15 per free user per month
  - Token allocation: 150,000 tokens (300 messages × 500 tokens/msg avg)
  - Daily refresh: 5,000 tokens (~10 messages/day)

  ### 2. Paid Token Packs (50% value - pay $X, get $X/2 worth)
  
  **Starter ($2)**
  - You get: $1.00 worth of tokens
  - Messages: 2,000 messages ($1 ÷ $0.0005)
  - Tokens: 1,000,000 (2,000 messages × 500 tokens/msg)
  
  **Popular ($5)**
  - You get: $2.50 worth of tokens
  - Messages: 5,000 messages ($2.50 ÷ $0.0005)
  - Tokens: 2,500,000 (5,000 messages × 500 tokens/msg)
  
  **Power User ($10)**
  - You get: $5.00 worth of tokens
  - Messages: 10,000 messages ($5 ÷ $0.0005)
  - Tokens: 5,000,000 (10,000 messages × 500 tokens/msg)
  
  **Pro ($20)**
  - You get: $10.00 worth of tokens
  - Messages: 20,000 messages ($10 ÷ $0.0005)
  - Tokens: 10,000,000 (20,000 messages × 500 tokens/msg)

  ## Math Explanation
  - Average message cost to us: $0.0005
  - Average tokens per message: 500 tokens
  - Conversion: 1 message = 500 tokens = $0.0005
  - Therefore: 1,000,000 tokens = 2,000 messages = $1.00 cost to us
  - With 2x markup: User pays $2, gets $1 worth = 1M tokens = 2,000 messages

  ## Updates
  - Update profiles table defaults for free tier
  - Update all existing free users to new token balance
  - Clear and recreate token_packs table with new pricing
  - Paid users keep their existing purchased tokens

  ## Security
  No security changes - existing RLS policies apply
*/

-- Update free tier defaults
ALTER TABLE profiles 
  ALTER COLUMN tokens_balance SET DEFAULT 150000;

ALTER TABLE profiles 
  ALTER COLUMN daily_free_tokens SET DEFAULT 5000;

-- Update all existing free users to 150,000 tokens
UPDATE profiles
SET 
  tokens_balance = 150000,
  daily_free_tokens = 5000,
  updated_at = now()
WHERE is_paid_user = false 
  AND (tokens_lifetime_purchased = 0 OR tokens_lifetime_purchased IS NULL);

-- Update column comments
COMMENT ON COLUMN profiles.tokens_balance IS 'Token balance: Free users get 150,000 tokens/month (300 messages, our cost $0.15), refreshes 5,000 daily';
COMMENT ON COLUMN profiles.daily_free_tokens IS 'Daily free token refresh amount: 5,000 tokens (~10 messages/day)';

-- Remove existing token packs
DELETE FROM token_packs WHERE TRUE;

-- Insert new token packs based on message counts
-- Formula: Pay $X, get $X/2 worth of tokens
-- $1 worth = 2,000 messages = 1,000,000 tokens
INSERT INTO token_packs (name, tokens, bonus_tokens, price_usd, popular, active)
VALUES
  ('Starter', 1000000, 0, 2.00, false, true),
  ('Popular', 2500000, 0, 5.00, true, true),
  ('Power User', 5000000, 0, 10.00, false, true),
  ('Pro', 10000000, 0, 20.00, false, true);
