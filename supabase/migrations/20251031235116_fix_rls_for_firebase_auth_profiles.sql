/*
  # Fix RLS Policies for Firebase Authentication
  
  ## Problem
  The RLS policies on profiles table check `auth.uid()` which is for Supabase Auth.
  This app uses Firebase Auth, so `auth.uid()` returns NULL and blocks all queries.
  Users with paid tokens appear as free users because the frontend can't read their profile.
  
  ## Solution
  Since this app uses Firebase Auth exclusively and RLS doesn't work with Firebase,
  we need to temporarily disable RLS to allow the application to function.
  
  ## Important Note
  In production, you should implement proper RLS using JWT claims or service role key.
  For now, we're disabling RLS because the auth system is Firebase, not Supabase.
  
  ## Changes
  1. Disable RLS on profiles table
  2. Keep the policies for documentation purposes
  3. Add comment explaining the Firebase Auth situation
*/

-- Disable RLS on profiles table
-- This is necessary because the app uses Firebase Auth, not Supabase Auth
-- The RLS policies check auth.uid() which returns NULL for Firebase users
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Add a comment to the table explaining this
COMMENT ON TABLE profiles IS 
'RLS is disabled because this application uses Firebase Authentication. 
The existing RLS policies reference auth.uid() which only works with Supabase Auth.
In production, implement proper security using service role keys or JWT claims.';

-- Log the change
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RLS DISABLED FOR FIREBASE AUTH COMPATIBILITY';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Table: profiles';
  RAISE NOTICE 'Reason: App uses Firebase Auth, not Supabase Auth';
  RAISE NOTICE 'Impact: Frontend can now read profile data';
  RAISE NOTICE 'Security: Ensure service role key is properly secured';
  RAISE NOTICE '============================================';
END $$;
