/*
  # Create Bug Reports System

  1. New Tables
    - `bug_reports`
      - `id` (uuid, primary key)
      - `user_id` (text, nullable - can be from Firebase or anonymous)
      - `user_email` (text, nullable)
      - `description` (text, required)
      - `screenshot_url` (text, nullable)
      - `page_url` (text)
      - `browser_info` (text)
      - `status` (text, default 'new')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `bug_reports` table
    - Allow anyone to insert bug reports (authenticated or not)
    - Only allow users to read their own reports
*/

CREATE TABLE IF NOT EXISTS bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  user_email text,
  description text NOT NULL,
  screenshot_url text,
  page_url text,
  browser_info text,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert bug reports
CREATE POLICY "Anyone can submit bug reports"
  ON bug_reports
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow users to read their own bug reports
CREATE POLICY "Users can read own bug reports"
  ON bug_reports
  FOR SELECT
  TO public
  USING (
    user_id IS NULL OR 
    user_id = '' OR 
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON bug_reports(created_at DESC);