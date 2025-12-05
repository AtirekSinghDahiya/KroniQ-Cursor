/*
  # Fix Paid Users Profile Synchronization
  
  ## Problem
  Users have tokens in paid_tier_users table but their profiles show:
  - is_premium = false
  - is_paid = false
  - paid_tokens_balance = 0
  
  This causes tier checks to fail even though users have purchased tokens.
  
  ## Solution
  1. Sync profiles table with paid_tier_users data
  2. Set correct flags for users with tokens
  3. Create trigger to auto-sync in future
  
  ## Changes
  - Update all profiles where user exists in paid_tier_users
  - Set is_premium, is_paid, paid_tokens_balance correctly
  - Create trigger for automatic sync on paid_tier_users changes
*/

-- Update profiles for users in paid_tier_users table
UPDATE profiles p
SET 
  is_premium = TRUE,
  is_paid = TRUE,
  current_tier = 'premium',
  paid_tokens_balance = ptu.tokens_remaining,
  updated_at = NOW()
FROM paid_tier_users ptu
WHERE p.id = ptu.id
  AND ptu.tokens_remaining > 0;

-- Log the update
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM profiles p
  INNER JOIN paid_tier_users ptu ON p.id = ptu.id
  WHERE ptu.tokens_remaining > 0;
  
  RAISE NOTICE 'Updated % user profiles to paid tier', updated_count;
END $$;

-- Create function to auto-sync profile when paid_tier_users changes
CREATE OR REPLACE FUNCTION sync_profile_from_paid_tier()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When tokens are added or updated in paid_tier_users
  IF NEW.tokens_remaining > 0 THEN
    UPDATE profiles
    SET 
      is_premium = TRUE,
      is_paid = TRUE,
      current_tier = 'premium',
      paid_tokens_balance = NEW.tokens_remaining,
      updated_at = NOW()
    WHERE id = NEW.id;
    
    RAISE NOTICE 'Synced profile for user % to paid tier with % tokens', NEW.id, NEW.tokens_remaining;
  ELSIF NEW.tokens_remaining <= 0 THEN
    -- When tokens depleted
    UPDATE profiles
    SET 
      is_premium = FALSE,
      current_tier = 'free',
      paid_tokens_balance = 0,
      updated_at = NOW()
    WHERE id = NEW.id;
    
    RAISE NOTICE 'Downgraded profile for user % to free tier', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on paid_tier_users
DROP TRIGGER IF EXISTS sync_profile_on_paid_tier_update ON paid_tier_users;

CREATE TRIGGER sync_profile_on_paid_tier_update
  AFTER INSERT OR UPDATE OF tokens_remaining
  ON paid_tier_users
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_from_paid_tier();

-- Also create function to sync when tokens are deducted
CREATE OR REPLACE FUNCTION sync_profile_token_deduction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sync paid_tokens_balance in profiles when paid_tier_users tokens change
  IF OLD.tokens_remaining != NEW.tokens_remaining THEN
    UPDATE profiles
    SET 
      paid_tokens_balance = NEW.tokens_remaining,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for token deduction sync
DROP TRIGGER IF EXISTS sync_profile_on_token_deduction ON paid_tier_users;

CREATE TRIGGER sync_profile_on_token_deduction
  AFTER UPDATE OF tokens_remaining
  ON paid_tier_users
  FOR EACH ROW
  WHEN (OLD.tokens_remaining IS DISTINCT FROM NEW.tokens_remaining)
  EXECUTE FUNCTION sync_profile_token_deduction();

-- Verify the sync worked
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT p.id, p.email, p.is_premium, p.paid_tokens_balance, ptu.tokens_remaining
    FROM profiles p
    INNER JOIN paid_tier_users ptu ON p.id = ptu.id
  LOOP
    RAISE NOTICE 'User: % | Email: % | is_premium: % | paid_balance: % | actual_tokens: %', 
      user_record.id, 
      user_record.email, 
      user_record.is_premium, 
      user_record.paid_tokens_balance,
      user_record.tokens_remaining;
  END LOOP;
END $$;
