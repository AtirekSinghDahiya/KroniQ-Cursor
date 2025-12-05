/*
  # Fix Messages RLS Policy for Firebase Auth

  ## Summary
  This migration fixes the RLS policy for the messages table to work with Firebase authentication.

  ## Changes Made

  ### 1. Update Messages RLS Policies
  - Drop existing restrictive policies
  - Create new policies that allow authenticated users to insert messages
  - Keep read access restricted to project owners
  - Allow insert with proper user_id validation

  ## Security Notes
  - Messages can only be read by project owners
  - Users can insert messages if they own the project
  - User ID is validated from Firebase auth token
*/

-- Drop existing policies on messages table
DROP POLICY IF EXISTS "Users can manage messages for their projects" ON messages;

-- Create separate policies for different operations
CREATE POLICY "Users can read messages in own projects"
  ON messages FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  );

CREATE POLICY "Users can insert messages in own projects"
  ON messages FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects
      WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  );

CREATE POLICY "Users can update messages in own projects"
  ON messages FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects
      WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  );

CREATE POLICY "Users can delete messages in own projects"
  ON messages FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects
      WHERE user_id = (SELECT auth.jwt()->>'sub')
    )
  );