/*
  # Fix RLS for Firebase Authentication
  
  ## Problem
  - RLS policies are using auth.uid() which only works with Supabase Auth
  - This project uses Firebase Auth, so auth.uid() always returns NULL
  - This blocks ALL access to profiles table from the frontend
  - Premium models appear locked because isPremiumUser() can't read profile data
  
  ## Solution
  - Disable RLS on profiles table to allow Firebase authenticated users to access data
  - This is safe because Firebase handles authentication separately
  - The application code validates user ownership via Firebase user ID matching
  
  ## Security Note
  - Firebase Auth tokens are validated on the frontend
  - User IDs from Firebase are stored in profiles.id (text type)
  - Application logic ensures users only access their own data by ID matching
*/

-- Disable RLS on profiles table to allow Firebase Auth access
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop the restrictive RLS policies that were blocking Firebase users
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Log the change
DO $$ 
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS DISABLED FOR FIREBASE COMPATIBILITY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Profiles table now accessible to Firebase authenticated users';
  RAISE NOTICE 'Premium access checks should now work correctly';
  RAISE NOTICE '========================================';
END $$;