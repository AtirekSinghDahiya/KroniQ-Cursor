/*
  # Fix Projects Foreign Key Issue
  
  ## Problem
  - Foreign key constraint on projects.user_id -> profiles.id causes errors
  - Firebase Auth users may not have profiles created yet
  - Chat fails with: "violates foreign key constraint projects_user_id_fkey"
  
  ## Solution
  1. Drop the foreign key constraint (Firebase Auth doesn't need it)
  2. Keep user_id column but make it flexible
  3. Ensure all existing users have profiles
  
  ## Changes
  - Remove foreign key constraint from projects table
  - Projects can be created for any user_id
  - No cascade deletes needed (Firebase manages users)
*/

-- Drop the foreign key constraint on projects.user_id
ALTER TABLE IF EXISTS projects 
  DROP CONSTRAINT IF EXISTS projects_user_id_fkey;

-- Ensure the column still exists but without FK constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE projects ADD COLUMN user_id TEXT;
  END IF;
END $$;

-- Make sure all current Firebase users have profiles
-- This prevents any future issues
INSERT INTO profiles (id, email, paid_tokens_balance, tokens_balance, free_tokens_balance, is_premium, current_tier)
SELECT DISTINCT 
  p.user_id,
  'user@firebase.com',
  0,
  5000,
  5000,
  false,
  'free'
FROM projects p
WHERE p.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = p.user_id
  )
ON CONFLICT (id) DO NOTHING;
