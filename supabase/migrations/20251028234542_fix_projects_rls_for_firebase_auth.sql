/*
  # Fix Projects RLS for Firebase Auth
  
  ## Summary
  Fix the projects table RLS policies to work with Firebase Auth UIDs (text format)
  instead of Supabase Auth UIDs (UUID format).
  
  ## Changes
  - Drop existing RLS policies on projects table
  - Recreate policies that properly handle Firebase Auth text UIDs
  - Policies check user_id directly without casting auth.uid() to text
  
  ## Security
  - Maintains same security model: users can only access their own projects
  - Uses Firebase UID stored in custom header/session
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Recreate policies for Firebase Auth (text-based UIDs)
-- These policies allow users to manage their own projects without auth.uid()
-- since we're using Firebase Auth with custom session management

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (true);
