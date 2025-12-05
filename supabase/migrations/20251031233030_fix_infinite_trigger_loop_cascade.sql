/*
  # Fix Infinite Trigger Loop - Cascade Drop
  
  ## Problem
  The sync triggers between profiles, paid_tier_users, and free_tier_users are causing an infinite loop
  
  ## Solution
  Drop all triggers and functions with CASCADE, then manually update the user
*/

-- Drop all existing sync triggers and functions with CASCADE
DROP FUNCTION IF EXISTS auto_sync_user_tier() CASCADE;
DROP FUNCTION IF EXISTS sync_paid_tier_to_profiles() CASCADE;
DROP FUNCTION IF EXISTS sync_free_tier_to_profiles() CASCADE;
DROP FUNCTION IF EXISTS sync_user_to_tier_tables(text) CASCADE;

-- Now update the user manually
UPDATE profiles 
SET 
  paid_tokens_balance = 10000000,
  tokens_balance = 10000000,
  is_premium = true,
  is_paid = true,
  current_tier = 'premium',
  updated_at = NOW()
WHERE email = 'aistearunica@gmail.com';

-- Insert into paid_tier_users
INSERT INTO paid_tier_users (id, email, tier_level, tokens_remaining, upgraded_date, created_at, updated_at)
SELECT id, email, 'premium', 10000000, NOW(), NOW(), NOW()
FROM profiles 
WHERE email = 'aistearunica@gmail.com'
ON CONFLICT (id) DO UPDATE SET 
  tokens_remaining = 10000000,
  tier_level = 'premium',
  updated_at = NOW();

-- Remove from free tier
DELETE FROM free_tier_users WHERE id IN (SELECT id FROM profiles WHERE email = 'aistearunica@gmail.com');
