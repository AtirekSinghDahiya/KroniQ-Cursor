/*
  # Add Cascading Deletes for Data Integrity
  
  1. Changes
    - Drop existing foreign key constraints on messages, assets, video_jobs, conversations
    - Recreate constraints with ON DELETE CASCADE
    - Ensures automatic cleanup of related data when projects are deleted
    
  2. Security
    - Maintains referential integrity
    - Prevents orphaned records
    - Simplifies delete operations
    
  3. Impact
    - Deleting a project will automatically delete:
      * All messages in that project
      * All assets in that project
      * All video jobs for that project
      * All conversations in that project
*/

-- Messages table: Add CASCADE
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_project_id_fkey;

ALTER TABLE messages
  ADD CONSTRAINT messages_project_id_fkey
  FOREIGN KEY (project_id)
  REFERENCES projects(id)
  ON DELETE CASCADE;

-- Assets table: Add CASCADE
ALTER TABLE assets
  DROP CONSTRAINT IF EXISTS assets_project_id_fkey;

ALTER TABLE assets
  ADD CONSTRAINT assets_project_id_fkey
  FOREIGN KEY (project_id)
  REFERENCES projects(id)
  ON DELETE CASCADE;

-- Video jobs table: Add CASCADE
ALTER TABLE video_jobs
  DROP CONSTRAINT IF EXISTS video_jobs_project_id_fkey;

ALTER TABLE video_jobs
  ADD CONSTRAINT video_jobs_project_id_fkey
  FOREIGN KEY (project_id)
  REFERENCES projects(id)
  ON DELETE CASCADE;

-- Conversations table: Add CASCADE
ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_project_id_fkey;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_project_id_fkey
  FOREIGN KEY (project_id)
  REFERENCES projects(id)
  ON DELETE CASCADE;

-- Also add CASCADE for messages -> conversations
ALTER TABLE messages
  DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;

ALTER TABLE messages
  ADD CONSTRAINT messages_conversation_id_fkey
  FOREIGN KEY (conversation_id)
  REFERENCES conversations(id)
  ON DELETE CASCADE;
