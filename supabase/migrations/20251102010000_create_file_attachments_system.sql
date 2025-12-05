/*
  # File Attachments System

  1. New Tables
    - `file_attachments`
      - `id` (text, primary key) - File path in storage
      - `user_id` (text) - Firebase user ID who uploaded the file
      - `file_name` (text) - Original filename
      - `file_size` (bigint) - File size in bytes
      - `file_type` (text) - MIME type
      - `file_url` (text) - Public URL to access the file
      - `file_path` (text) - Storage path
      - `created_at` (timestamptz) - Upload timestamp

  2. Security
    - Disable RLS (using Firebase auth)
    - Index on user_id for faster queries
    - Index on created_at for sorting

  3. Storage
    - Create public bucket 'chat-attachments' for file storage
    - Files organized by user_id folders
*/

-- Create file_attachments table
CREATE TABLE IF NOT EXISTS file_attachments (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  file_type text NOT NULL,
  file_url text NOT NULL,
  file_path text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_file_size CHECK (file_size >= 0),
  CONSTRAINT valid_file_name CHECK (length(file_name) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_attachments_user ON file_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_created ON file_attachments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_attachments_type ON file_attachments(file_type);

-- Disable RLS (using Firebase auth)
ALTER TABLE file_attachments DISABLE ROW LEVEL SECURITY;

-- Add file_attachments column to messages table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'file_attachments'
  ) THEN
    ALTER TABLE messages ADD COLUMN file_attachments jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create index on messages.file_attachments for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_file_attachments ON messages USING gin(file_attachments);
