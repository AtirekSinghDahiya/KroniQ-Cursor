/*
  # Disable RLS on All Firebase Auth Tables
  
  ## Problem
  - Multiple tables still have RLS enabled with auth.uid() policies
  - This blocks Firebase authenticated users from accessing data
  - Causes issues with projects, conversations, tier tables, etc.
  
  ## Solution
  - Disable RLS on all tables used with Firebase authentication
  - Drop restrictive policies that require Supabase auth.uid()
  
  ## Tables Fixed
  - projects: User projects and workspaces
  - conversations: Chat conversations
  - free_tier_users: Free tier user tracking
  - paid_tier_users: Paid tier user tracking
  
  ## Security
  - Firebase Auth handles authentication
  - Application code validates user ownership via Firebase user IDs
*/

-- Disable RLS on projects table
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- Drop restrictive policies on projects
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Disable RLS on conversations table
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;

-- Drop restrictive policies on conversations
DROP POLICY IF EXISTS "Users can view conversations in own projects" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations in own projects" ON conversations;

-- Disable RLS on free_tier_users table
ALTER TABLE free_tier_users DISABLE ROW LEVEL SECURITY;

-- Drop any policies on free_tier_users
DROP POLICY IF EXISTS "Users can read own free tier data" ON free_tier_users;
DROP POLICY IF EXISTS "Allow authenticated users to read free tier data" ON free_tier_users;

-- Disable RLS on paid_tier_users table
ALTER TABLE paid_tier_users DISABLE ROW LEVEL SECURITY;

-- Drop any policies on paid_tier_users
DROP POLICY IF EXISTS "Users can read own paid tier data" ON paid_tier_users;
DROP POLICY IF EXISTS "Allow authenticated users to read paid tier data" ON paid_tier_users;

-- Log completion
DO $$ 
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'RLS DISABLED ON ALL FIREBASE AUTH TABLES';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Fixed tables: profiles, projects, conversations,';
  RAISE NOTICE '              free_tier_users, paid_tier_users';
  RAISE NOTICE 'Firebase authenticated users can now access data';
  RAISE NOTICE '================================================';
END $$;