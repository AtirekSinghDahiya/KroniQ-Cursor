/*
  # Fix RLS for Firebase Auth on free_tier_users table

  1. Issue
    - Uses auth.uid() which only works with Supabase Auth
    - Firebase-authenticated users cannot query

  2. Solution
    - Allow all reads on free_tier_users (for tier checking)

  3. Security
    - Read-only access for tier verification
    - System manages writes
*/

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view own free tier data" ON free_tier_users;

-- Create permissive read policy
CREATE POLICY "Allow all reads on free_tier_users"
  ON free_tier_users
  FOR SELECT
  TO public
  USING (true);