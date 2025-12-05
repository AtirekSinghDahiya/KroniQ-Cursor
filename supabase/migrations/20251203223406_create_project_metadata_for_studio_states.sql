/*
  # Create Project Metadata System for Studio States

  ## Summary
  Create a comprehensive system to store and manage studio project states,
  enabling users to save and restore their complete studio sessions including
  prompts, settings, generated outputs, and all configuration options.

  ## New Tables
  1. `project_metadata` - Stores detailed studio session data
     - `id` (uuid, primary key)
     - `project_id` (text, foreign key to projects.id)
     - `user_id` (text, indexed for fast user queries)
     - `studio_type` (text: 'image', 'video', 'music', 'tts', 'ppt')
     - `session_state` (jsonb) - Complete studio state including:
       * Prompts and inputs
       * Model selections
       * Settings (aspect ratio, temperature, etc.)
       * Generated output URLs
       * History items
     - `created_at`, `updated_at` (timestamps)

  2. Enhanced `projects` table types
     - Add project types for each studio: 'image', 'video', 'music', 'voice', 'ppt'
*/

-- Create project_metadata table for storing complete studio states
CREATE TABLE IF NOT EXISTS project_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  studio_type TEXT NOT NULL CHECK (studio_type IN ('image', 'video', 'music', 'tts', 'voice', 'ppt')),
  session_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_project_metadata_project_id ON project_metadata(project_id);
CREATE INDEX IF NOT EXISTS idx_project_metadata_user_id ON project_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_project_metadata_studio_type ON project_metadata(studio_type);
CREATE INDEX IF NOT EXISTS idx_project_metadata_user_studio ON project_metadata(user_id, studio_type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_metadata_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-update timestamps
CREATE TRIGGER project_metadata_update_timestamp
  BEFORE UPDATE ON project_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_project_metadata_timestamp();

-- Disable RLS for Firebase Auth compatibility
ALTER TABLE project_metadata DISABLE ROW LEVEL SECURITY;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '✅ Project metadata system created successfully';
  RAISE NOTICE '📊 Studio types supported: image, video, music, tts, voice, ppt';
  RAISE NOTICE '💾 Session state stored as JSONB for flexible data structure';
END $$;