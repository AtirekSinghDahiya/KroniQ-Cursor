/*
  # Complete TEXT Migration for Firebase Auth
  
  1. Changes
    - Drop ALL RLS policies
    - Convert all ID columns to TEXT
    - Add project_id to messages
    - Disable RLS (already done in previous migration)
    
  2. Tables
    - projects, conversations, messages, assets, video_jobs
*/

-- Step 1: Drop ALL RLS policies
DROP POLICY IF EXISTS "Users can view conversations in own projects" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations in own projects" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages in own conversations" ON messages;
DROP POLICY IF EXISTS "Users can view messages in own projects" ON messages;
DROP POLICY IF EXISTS "Users can create messages in own projects" ON messages;

-- Step 2: Drop foreign key constraints
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_project_id_fkey;
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_project_id_fkey;
ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_project_id_fkey;
ALTER TABLE video_jobs DROP CONSTRAINT IF EXISTS video_jobs_project_id_fkey;

-- Step 3: Convert all IDs to TEXT
ALTER TABLE projects ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE conversations ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE conversations ALTER COLUMN project_id TYPE TEXT USING project_id::TEXT;
ALTER TABLE messages ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE messages ALTER COLUMN conversation_id TYPE TEXT USING conversation_id::TEXT;
ALTER TABLE assets ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE assets ALTER COLUMN project_id TYPE TEXT USING project_id::TEXT;
ALTER TABLE video_jobs ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE video_jobs ALTER COLUMN project_id TYPE TEXT USING project_id::TEXT;

-- Step 4: Add project_id to messages if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN project_id TEXT;
  END IF;
END $$;

-- Step 5: Recreate foreign keys
ALTER TABLE conversations 
  ADD CONSTRAINT conversations_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE messages 
  ADD CONSTRAINT messages_conversation_id_fkey 
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE messages 
  ADD CONSTRAINT messages_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE assets 
  ADD CONSTRAINT assets_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE video_jobs 
  ADD CONSTRAINT video_jobs_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Step 6: Create indexes
CREATE INDEX IF NOT EXISTS messages_project_id_idx ON messages(project_id);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS conversations_project_id_idx ON conversations(project_id);
