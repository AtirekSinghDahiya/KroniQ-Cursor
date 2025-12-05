/*
  # Update Free Pack to 1000 Tokens Daily

  ## Summary
  Updates the default free token allocation from 500 to 1000 tokens per day.
  This applies to all new users and resets existing free users to 1000.

  ## Changes
  1. Update default daily_free_tokens from 500 to 1000
  2. Update tokens_balance default from 500 to 1000
  3. Reset all free users (who haven't purchased tokens) to 1000 tokens

  ## Security
  No security changes - existing RLS policies remain in place
*/

-- Update defaults for new users
ALTER TABLE profiles
  ALTER COLUMN tokens_balance SET DEFAULT 1000,
  ALTER COLUMN daily_free_tokens SET DEFAULT 1000;

-- Update existing free users to 1000 tokens
UPDATE profiles
SET
  tokens_balance = 1000,
  daily_free_tokens = 1000,
  last_token_refresh = now()
WHERE tokens_lifetime_purchased = 0;

-- Create or replace the refresh_daily_tokens function with updated logic
CREATE OR REPLACE FUNCTION refresh_daily_tokens()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reset_count integer;
BEGIN
  -- Reset tokens for all free users (those who haven't purchased any tokens)
  -- Only reset if 24 hours have passed since last refresh
  UPDATE profiles
  SET
    tokens_balance = daily_free_tokens,
    last_token_refresh = now()
  WHERE
    tokens_lifetime_purchased = 0
    AND is_token_user = true
    AND (
      last_token_refresh IS NULL
      OR last_token_refresh < (now() - interval '24 hours')
    );

  GET DIAGNOSTICS reset_count = ROW_COUNT;

  RETURN reset_count;
END;
$$;
