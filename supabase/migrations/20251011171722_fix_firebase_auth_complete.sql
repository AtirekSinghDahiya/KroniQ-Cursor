/*
  # Fix Firebase Auth ID Compatibility - Complete Solution
  
  1. Changes
    - Drop ALL existing RLS policies
    - Drop ALL foreign key constraints
    - Change profiles.id and all user_id columns from UUID to TEXT
    - Recreate foreign key constraints
    - Recreate RLS policies for Firebase Auth compatibility
    
  2. Security
    - All RLS policies recreated with proper TEXT-based checks
    - Uses current_setting('app.current_user_id') for user identification
*/

-- Step 1: Drop ALL RLS policies
DROP POLICY IF EXISTS "Users can view own assets" ON assets;
DROP POLICY IF EXISTS "Users can create own assets" ON assets;
DROP POLICY IF EXISTS "Users can update own assets" ON assets;
DROP POLICY IF EXISTS "Users can delete own assets" ON assets;

DROP POLICY IF EXISTS "Users can view conversations in own projects" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations in own projects" ON conversations;

DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages in own conversations" ON messages;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

DROP POLICY IF EXISTS "Users can view own video jobs" ON video_jobs;
DROP POLICY IF EXISTS "Users can create own video jobs" ON video_jobs;
DROP POLICY IF EXISTS "Users can update own video jobs" ON video_jobs;

-- Step 2: Drop ALL foreign key constraints
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_fkey;
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_user_id_fkey;
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_project_id_fkey;
ALTER TABLE video_jobs DROP CONSTRAINT IF EXISTS video_jobs_user_id_fkey;
ALTER TABLE video_jobs DROP CONSTRAINT IF EXISTS video_jobs_project_id_fkey;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_project_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;

-- Step 3: Change data types to TEXT
ALTER TABLE profiles ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE projects ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE assets ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE video_jobs ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Step 4: Recreate foreign key constraints
ALTER TABLE projects 
  ADD CONSTRAINT projects_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE assets 
  ADD CONSTRAINT assets_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE assets 
  ADD CONSTRAINT assets_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE video_jobs 
  ADD CONSTRAINT video_jobs_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE video_jobs 
  ADD CONSTRAINT video_jobs_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE conversations 
  ADD CONSTRAINT conversations_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE messages 
  ADD CONSTRAINT messages_conversation_id_fkey 
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- Step 5: Recreate RLS policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = current_setting('app.current_user_id', true))
  WITH CHECK (id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = current_setting('app.current_user_id', true));

-- Step 6: Recreate RLS policies for projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true));

-- Step 7: Recreate RLS policies for conversations
CREATE POLICY "Users can view conversations in own projects"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = conversations.project_id 
      AND projects.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can create conversations in own projects"
  ON conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = conversations.project_id 
      AND projects.user_id = current_setting('app.current_user_id', true)
    )
  );

-- Step 8: Recreate RLS policies for messages
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN projects p ON p.id = c.project_id
      WHERE c.id = messages.conversation_id 
      AND p.user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN projects p ON p.id = c.project_id
      WHERE c.id = messages.conversation_id 
      AND p.user_id = current_setting('app.current_user_id', true)
    )
  );

-- Step 9: Recreate RLS policies for assets
CREATE POLICY "Users can view own assets"
  ON assets FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can create own assets"
  ON assets FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update own assets"
  ON assets FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can delete own assets"
  ON assets FOR DELETE
  USING (user_id = current_setting('app.current_user_id', true));

-- Step 10: Recreate RLS policies for video_jobs
CREATE POLICY "Users can view own video jobs"
  ON video_jobs FOR SELECT
  USING (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can create own video jobs"
  ON video_jobs FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can update own video jobs"
  ON video_jobs FOR UPDATE
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));
