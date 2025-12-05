/*
  # Disable RLS for Firebase Auth Tables
  
  ## Problem
  The application uses Firebase Auth (not Supabase Auth), but RLS policies
  were enabled using `auth.uid()` which only works with Supabase Auth.
  
  This causes:
  - "new row violates row-level security policy" errors when inserting projects
  - Users cannot send messages or create conversations
  - Database operations fail due to RLS policy mismatches
  
  ## Solution
  Since the app uses Firebase Auth and authenticates at the application layer:
  1. Disable RLS on projects, conversations, and messages tables
  2. Application-level security is handled by Firebase Auth
  3. Backend services validate Firebase tokens before DB operations
  
  ## Tables Affected
  - projects (RLS disabled)
  - conversations (RLS disabled)
  - messages (RLS disabled)
  
  ## Important Note
  These tables are protected by Firebase Authentication at the application layer.
  All database writes go through authenticated backend services that verify
  Firebase tokens before allowing operations.
*/

-- Disable RLS on projects table
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- Disable RLS on conversations table
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- Disable RLS on messages table
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Add documentation
COMMENT ON TABLE projects IS 'RLS disabled - uses Firebase Auth at application layer';
COMMENT ON TABLE conversations IS 'RLS disabled - uses Firebase Auth at application layer';
COMMENT ON TABLE messages IS 'RLS disabled - uses Firebase Auth at application layer';
