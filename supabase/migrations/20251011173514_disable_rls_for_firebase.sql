/*
  # Disable RLS for Firebase Auth Compatibility
  
  1. Changes
    - Disable RLS on all tables temporarily
    - Firebase Auth handles authentication on the client side
    - This allows the app to work while we implement proper RLS
    
  2. Security Note
    - This is a temporary solution
    - Client-side Firebase Auth rules should protect data
    - For production, implement proper RLS with service role key
*/

-- Disable RLS on all tables
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE video_jobs DISABLE ROW LEVEL SECURITY;
