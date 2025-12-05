/*
  # Add Free Tier Token Initialization Trigger

  ## Overview
  This migration adds a trigger to automatically set free tier tokens when a new user signs up.

  ## Changes
  1. Create function to initialize free tier tokens
  2. Add trigger on profile creation
  3. Ensure all new free users get 5k daily and 150k monthly tokens

  ## Security
  - Function runs with SECURITY DEFINER to ensure proper access
  - Only runs on INSERT to avoid overwriting paid users
*/

-- Function to initialize free tier tokens on signup
CREATE OR REPLACE FUNCTION initialize_free_tier_tokens()
RETURNS TRIGGER AS $$
BEGIN
  -- Only initialize if this is a new free tier user (no paid tokens)
  IF NEW.paid_tokens_balance IS NULL OR NEW.paid_tokens_balance = 0 THEN
    NEW.daily_tokens_remaining := 5000;
    NEW.free_tokens_balance := 150000;
    NEW.paid_tokens_balance := 0;
    NEW.last_reset_date := CURRENT_DATE;
    NEW.coins_last_reset := now();
    NEW.is_paid := false;
    NEW.current_tier := 'free';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS init_free_tier_on_signup ON profiles;

-- Create trigger to run before insert
CREATE TRIGGER init_free_tier_on_signup
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_free_tier_tokens();

-- Update existing profiles that are stuck with wrong token amounts
UPDATE profiles
SET 
  daily_tokens_remaining = 5000,
  free_tokens_balance = 150000,
  paid_tokens_balance = COALESCE(paid_tokens_balance, 0),
  last_reset_date = CURRENT_DATE,
  coins_last_reset = now(),
  is_paid = CASE WHEN paid_tokens_balance > 0 THEN true ELSE false END,
  current_tier = CASE WHEN paid_tokens_balance > 0 THEN 'starter' ELSE 'free' END
WHERE 
  (paid_tokens_balance IS NULL OR paid_tokens_balance = 0)
  AND (daily_tokens_remaining IS NULL OR daily_tokens_remaining != 5000 OR free_tokens_balance != 150000);
