/*
  # Fix Zero Token Balance on Signup

  ## Problem
  New users are showing 0 tokens instead of getting the free tier allocation (5000 daily tokens).

  ## Root Causes
  1. No profile rows are being created automatically when users sign up
  2. Even when profiles exist, they may have NULL or 0 token values

  ## Solution
  1. Create a trigger function that automatically creates a profile when a user signs up
  2. Set proper default values for all token-related columns
  3. Update any existing profiles with missing/zero tokens to have the correct free tier allocation

  ## Changes
  - Create `handle_new_user()` trigger function
  - Create trigger on auth.users table
  - Update default column values
  - Backfill existing users with proper token allocations
*/

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert a new profile for the user with free tier defaults
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    current_tier,
    daily_tokens_remaining,
    daily_token_limit,
    tokens_remaining,
    is_paid,
    last_reset_date,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    'free',
    5000,
    5000,
    0,
    false,
    CURRENT_DATE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    daily_tokens_remaining = CASE 
      WHEN profiles.daily_tokens_remaining IS NULL OR profiles.daily_tokens_remaining = 0 
      THEN 5000 
      ELSE profiles.daily_tokens_remaining 
    END,
    daily_token_limit = CASE 
      WHEN profiles.daily_token_limit IS NULL OR profiles.daily_token_limit = 0 
      THEN 5000 
      ELSE profiles.daily_token_limit 
    END,
    current_tier = COALESCE(profiles.current_tier, 'free'),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Update existing profiles that have 0 or NULL tokens
UPDATE public.profiles
SET
  daily_tokens_remaining = 5000,
  daily_token_limit = 5000,
  current_tier = COALESCE(current_tier, 'free'),
  last_reset_date = COALESCE(last_reset_date, CURRENT_DATE),
  is_paid = COALESCE(is_paid, false),
  updated_at = NOW()
WHERE
  daily_tokens_remaining IS NULL
  OR daily_tokens_remaining = 0
  OR daily_token_limit IS NULL
  OR daily_token_limit = 0;

-- Ensure column defaults are correct
ALTER TABLE profiles ALTER COLUMN current_tier SET DEFAULT 'free';
ALTER TABLE profiles ALTER COLUMN daily_tokens_remaining SET DEFAULT 5000;
ALTER TABLE profiles ALTER COLUMN daily_token_limit SET DEFAULT 5000;
ALTER TABLE profiles ALTER COLUMN tokens_remaining SET DEFAULT 0;
ALTER TABLE profiles ALTER COLUMN is_paid SET DEFAULT false;
ALTER TABLE profiles ALTER COLUMN last_reset_date SET DEFAULT CURRENT_DATE;
