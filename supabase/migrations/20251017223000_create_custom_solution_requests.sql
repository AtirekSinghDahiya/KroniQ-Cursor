/*
  # Custom Solution Requests Table

  Creates a table to store enterprise/custom solution inquiries from potential clients.

  1. New Tables
    - `custom_solution_requests`
      - `id` (uuid, primary key) - Unique identifier
      - `full_name` (text) - Client's full name
      - `email` (text) - Contact email
      - `company_name` (text) - Company/organization name
      - `phone` (text, optional) - Contact phone number
      - `company_size` (text) - Size of company (startup, small, medium, large, enterprise)
      - `industry` (text, optional) - Industry/sector
      - `use_case` (text) - Description of their use case
      - `requirements` (text) - Specific requirements
      - `budget_range` (text, optional) - Budget range
      - `timeline` (text, optional) - Expected timeline
      - `additional_info` (text, optional) - Any additional information
      - `status` (text) - Status (new, contacted, in_progress, completed)
      - `created_at` (timestamptz) - When request was submitted
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `custom_solution_requests` table
    - Public can insert (submit forms)
    - Only authenticated users with admin role can read
    - Only authenticated admins can update status
*/

-- Create custom solution requests table
CREATE TABLE IF NOT EXISTS custom_solution_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  company_name text NOT NULL,
  phone text,
  company_size text NOT NULL,
  industry text,
  use_case text NOT NULL,
  requirements text NOT NULL,
  budget_range text,
  timeline text,
  additional_info text,
  status text DEFAULT 'new' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE custom_solution_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit (insert) - no auth required for public form
CREATE POLICY "Anyone can submit custom solution requests"
  ON custom_solution_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only allow reading for future admin panel (when we add roles)
-- For now, no SELECT policy means only service role can read
-- This keeps submissions private

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_custom_solution_requests_created_at
  ON custom_solution_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_custom_solution_requests_status
  ON custom_solution_requests(status);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_custom_solution_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_custom_solution_requests_updated_at
  BEFORE UPDATE ON custom_solution_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_solution_requests_updated_at();
