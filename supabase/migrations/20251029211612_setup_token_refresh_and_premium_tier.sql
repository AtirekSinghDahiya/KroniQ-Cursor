/*
  # Setup Token Refresh System and Premium Tier

  ## Summary
  1. Reset all free tier users to 5000 daily tokens
  2. Upgrade aistearunica@gmail.com to premium tier with unlimited tokens
  3. Create automatic midnight token refresh system for free tier users

  ## Changes
  1. Update all free tier users to have 5000 tokens
  2. Create premium tier for aistearunica@gmail.com with 1,000,000 tokens
  3. Create pg_cron job to refresh free tier tokens at midnight UTC
  4. Create function to handle daily token refresh

  ## Security
  - Premium tier has special access to all models
  - Free tier gets daily refresh of 5000 tokens
  - Refresh happens automatically at midnight UTC
*/

-- Step 1: Reset all users to free tier with 5000 tokens
UPDATE profiles
SET
  current_tier = 'free',
  daily_tokens_remaining = 5000,
  daily_token_limit = 5000,
  tokens_remaining = 0,
  is_paid = false,
  last_reset_date = CURRENT_DATE,
  updated_at = NOW()
WHERE current_tier = 'free' OR current_tier IS NULL;

-- Step 2: Upgrade aistearunica@gmail.com to premium tier
UPDATE profiles
SET
  current_tier = 'premium',
  daily_tokens_remaining = 1000000,
  daily_token_limit = 1000000,
  tokens_remaining = 1000000,
  is_paid = true,
  last_reset_date = CURRENT_DATE,
  updated_at = NOW()
WHERE email = 'aistearunica@gmail.com';

-- Step 3: Create or replace the daily token refresh function
CREATE OR REPLACE FUNCTION refresh_free_tier_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_refreshed_count integer;
BEGIN
  -- Refresh tokens for all free tier users whose last reset was before today
  UPDATE profiles
  SET
    daily_tokens_remaining = daily_token_limit,
    last_reset_date = CURRENT_DATE,
    last_token_refresh = NOW(),
    updated_at = NOW()
  WHERE
    current_tier = 'free'
    AND (last_reset_date IS NULL OR last_reset_date < CURRENT_DATE);

  GET DIAGNOSTICS v_refreshed_count = ROW_COUNT;

  -- Log the refresh operation
  RAISE NOTICE 'Daily token refresh completed. Refreshed % free tier users.', v_refreshed_count;
END;
$$;

-- Step 4: Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 5: Remove any existing token refresh jobs
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'daily-free-tier-token-refresh';

-- Step 6: Schedule daily token refresh at midnight UTC
SELECT cron.schedule(
  'daily-free-tier-token-refresh',
  '0 0 * * *',  -- Every day at midnight UTC (00:00)
  'SELECT refresh_free_tier_tokens();'
);

-- Step 7: Create a manual refresh function for testing
CREATE OR REPLACE FUNCTION manual_token_refresh()
RETURNS TABLE (
  user_id uuid,
  email text,
  old_tokens integer,
  new_tokens integer,
  tier text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH refresh_data AS (
    SELECT
      id,
      email,
      daily_tokens_remaining as old_balance,
      daily_token_limit as new_balance,
      current_tier
    FROM profiles
    WHERE current_tier = 'free'
      AND (last_reset_date IS NULL OR last_reset_date < CURRENT_DATE)
  )
  SELECT
    rd.id,
    rd.email,
    rd.old_balance,
    rd.new_balance,
    rd.current_tier
  FROM refresh_data rd;

  -- Perform the refresh
  PERFORM refresh_free_tier_tokens();
END;
$$;

-- Step 8: Add comment for documentation
COMMENT ON FUNCTION refresh_free_tier_tokens() IS 'Automatically refreshes daily tokens for all free tier users at midnight UTC';
COMMENT ON FUNCTION manual_token_refresh() IS 'Manual token refresh for testing - shows which users will be refreshed and then refreshes them';

-- Step 9: Create index for faster refresh queries
CREATE INDEX IF NOT EXISTS idx_profiles_tier_reset_date ON profiles(current_tier, last_reset_date);

-- Step 10: Verify the premium user was upgraded
DO $$
DECLARE
  v_premium_user RECORD;
BEGIN
  SELECT email, current_tier, daily_tokens_remaining, daily_token_limit
  INTO v_premium_user
  FROM profiles
  WHERE email = 'aistearunica@gmail.com';

  IF v_premium_user.current_tier = 'premium' THEN
    RAISE NOTICE 'Premium user % successfully upgraded with % tokens', 
      v_premium_user.email, 
      v_premium_user.daily_tokens_remaining;
  ELSE
    RAISE WARNING 'Premium user upgrade may have failed';
  END IF;
END $$;
