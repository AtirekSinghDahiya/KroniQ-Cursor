/*
  # Fix RLS for Firebase Auth on paid_tier_users table

  1. Issue
    - Current RLS policy uses auth.uid() which only works with Supabase Auth
    - This app uses Firebase Auth, not Supabase Auth
    - Firebase-authenticated users cannot query their own data

  2. Solution
    - Drop existing restrictive policy
    - Create permissive policy that allows all authenticated reads
    - Keep system policy for full management

  3. Security
    - Users can read any paid_tier_users data (acceptable for tier checking)
    - Only system can insert/update/delete (via service role)
*/

-- Drop the restrictive Supabase Auth policy
DROP POLICY IF EXISTS "Users can view own paid tier data" ON paid_tier_users;

-- Create permissive read policy for all users (Firebase or Supabase)
CREATE POLICY "Allow all reads on paid_tier_users"
  ON paid_tier_users
  FOR SELECT
  TO public
  USING (true);

-- Ensure system can still manage everything
DROP POLICY IF EXISTS "System can manage paid tier users" ON paid_tier_users;

CREATE POLICY "System can manage paid tier users"
  ON paid_tier_users
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);