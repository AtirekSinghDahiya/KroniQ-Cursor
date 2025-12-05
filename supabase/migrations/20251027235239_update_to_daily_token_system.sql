/*
  # Update to Daily Token System
  
  ## Summary
  Changes the token system from monthly allocation to daily allocation
  to make it clearer for users.
  
  ## Changes
  
  ### Free Tier (NEW)
  - **5,000 tokens per day** (~10 messages/day)
  - Refreshes daily
  - Monthly equivalent: ~150,000 tokens (30 days × 5,000)
  - Our cost: $0.15 per user per month
  
  ### Updated Comments
  - Update all column comments to reflect "per day" instead of "per month"
  - Keep daily_free_tokens at 5,000 (this is what users get per day)
  
  ## No Data Changes
  - No changes to existing balances
  - No changes to paid packs
  - Only updates documentation/comments
  
  ## Security
  No security changes - existing RLS policies apply
*/

-- Update column comments to reflect daily allocation
COMMENT ON COLUMN profiles.tokens_balance IS 'Token balance: Free users get 5,000 tokens/day (~10 messages/day), paid users have unlimited lifetime tokens';

COMMENT ON COLUMN profiles.daily_free_tokens IS 'Daily free token refresh amount: 5,000 tokens (~10 messages/day), refreshes every 24 hours';

COMMENT ON COLUMN profiles.last_token_refresh IS 'Last time free tokens were refreshed - used for daily 5,000 token allocation';

-- No changes to actual values, just clarifying the system is daily-based
-- Users already get 5,000 tokens per day via the daily_free_tokens refresh
