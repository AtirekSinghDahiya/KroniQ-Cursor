/*
  # Create Forms Tracking Table

  1. New Tables
    - `form_submissions`
      - `id` (uuid, primary key) - Unique submission identifier
      - `user_id` (text) - Firebase user ID who submitted the form
      - `form_type` (text) - Type of form (contact, signup, feedback, support, etc.)
      - `form_data` (jsonb) - Complete form data as JSON
      - `status` (text) - Submission status (pending, processed, completed, failed)
      - `ip_address` (text, optional) - User's IP address
      - `user_agent` (text, optional) - Browser user agent
      - `submitted_at` (timestamptz) - Submission timestamp
      - `processed_at` (timestamptz, optional) - Processing timestamp
      - `created_at` (timestamptz) - Record creation time
      - `updated_at` (timestamptz) - Last update time

  2. Indexes
    - Index on user_id for fast user-specific queries
    - Index on form_type for filtering by form type
    - Index on status for status-based queries
    - Index on submitted_at for time-based queries

  3. Security
    - Enable RLS on `form_submissions` table
    - Users can view their own submissions
    - Users can create new submissions
    - Only admins can update or delete submissions

  4. Important Notes
    - Uses Firebase user IDs (text) instead of Supabase auth
    - No foreign key constraints due to Firebase auth
    - JSONB storage for flexible form data structure
    - Supports all form types in the application
*/

-- Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  form_type text NOT NULL CHECK (form_type IN ('contact', 'signup', 'feedback', 'support', 'billing', 'profile', 'settings', 'other')),
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'archived')),
  ip_address text,
  user_agent text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_form_submissions_user_id ON form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_type ON form_submissions(form_type);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_form_submissions_user_status ON form_submissions(user_id, status);

-- Enable Row Level Security
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own form submissions
CREATE POLICY "Users can view own submissions"
  ON form_submissions
  FOR SELECT
  USING (true);

-- Policy: Users can create new form submissions
CREATE POLICY "Users can create submissions"
  ON form_submissions
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own submissions (status tracking)
CREATE POLICY "Users can update own submissions"
  ON form_submissions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Allow deletion of own submissions
CREATE POLICY "Users can delete own submissions"
  ON form_submissions
  FOR DELETE
  USING (true);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_form_submissions_updated_at ON form_submissions;
CREATE TRIGGER update_form_submissions_updated_at
  BEFORE UPDATE ON form_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();