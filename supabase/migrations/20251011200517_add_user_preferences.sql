/*
  # Add User Preferences System

  1. New Tables
    - `user_preferences`
      - `user_id` (text, primary key) - Firebase Auth UID
      - `ai_tone` (text) - AI response tone (professional, casual, friendly, creative)
      - `ai_length` (text) - Response length preference (concise, balanced, detailed)
      - `ai_expertise` (text) - User expertise level (beginner, intermediate, expert)
      - `default_language` (text) - Preferred language
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Disable RLS (using Firebase Auth)

  3. Notes
    - Stores user AI interaction preferences
    - Used to personalize AI responses
*/

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id text PRIMARY KEY,
  ai_tone text DEFAULT 'friendly',
  ai_length text DEFAULT 'balanced',
  ai_expertise text DEFAULT 'intermediate',
  default_language text DEFAULT 'en',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Add project rename column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS original_name text;
