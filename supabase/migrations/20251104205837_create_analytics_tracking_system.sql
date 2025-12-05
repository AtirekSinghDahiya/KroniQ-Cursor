/*
  # Create Analytics Tracking System

  ## Overview
  Creates comprehensive analytics tracking system to monitor landing page visitors,
  user actions, and signup conversion rates.

  ## New Tables
  
  ### 1. `page_visits`
  Tracks every landing page view with session information
  - `id` (uuid, primary key)
  - `session_id` (text) - Anonymous session identifier
  - `user_id` (text, nullable) - Links to authenticated user if applicable
  - `page_name` (text) - Which page was viewed (home, pricing, about, etc.)
  - `referrer` (text, nullable) - Where the visitor came from
  - `user_agent` (text, nullable) - Browser and device information
  - `screen_width` (integer, nullable) - Screen resolution width
  - `screen_height` (integer, nullable) - Screen resolution height
  - `visited_at` (timestamptz) - When the visit occurred
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. `analytics_events`
  Tracks specific user actions and interactions
  - `id` (uuid, primary key)
  - `session_id` (text) - Links to session
  - `user_id` (text, nullable) - Links to authenticated user if applicable
  - `event_type` (text) - Type of event (button_click, scroll, form_submit, etc.)
  - `event_name` (text) - Specific event name (get_started_clicked, pricing_viewed, etc.)
  - `event_data` (jsonb, nullable) - Additional event metadata
  - `page_name` (text) - Which page the event occurred on
  - `occurred_at` (timestamptz) - When the event happened
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. `conversion_funnel`
  Tracks the user journey from landing to signup
  - `id` (uuid, primary key)
  - `session_id` (text, unique) - Session identifier
  - `user_id` (text, nullable) - Links to authenticated user after signup
  - `first_visit_at` (timestamptz) - First landing page visit
  - `get_started_clicked_at` (timestamptz, nullable) - When Get Started was clicked
  - `signup_page_viewed_at` (timestamptz, nullable) - When signup page was viewed
  - `signup_completed_at` (timestamptz, nullable) - When signup was completed
  - `time_to_conversion_seconds` (integer, nullable) - Time from first visit to signup
  - `referrer_source` (text, nullable) - Original referrer
  - `converted` (boolean) - Whether the session resulted in signup
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS disabled for these tables (Firebase auth used)
  - Only accessible via edge functions or admin dashboard
  - No user PII stored in analytics events

  ## Indexes
  - Added indexes on session_id, user_id, and timestamp columns for fast queries
  - Added index on conversion status for funnel analysis
*/

-- Create page_visits table
CREATE TABLE IF NOT EXISTS page_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id text,
  page_name text NOT NULL,
  referrer text,
  user_agent text,
  screen_width integer,
  screen_height integer,
  visited_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id text,
  event_type text NOT NULL,
  event_name text NOT NULL,
  event_data jsonb,
  page_name text NOT NULL,
  occurred_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create conversion_funnel table
CREATE TABLE IF NOT EXISTS conversion_funnel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  user_id text,
  first_visit_at timestamptz NOT NULL,
  get_started_clicked_at timestamptz,
  signup_page_viewed_at timestamptz,
  signup_completed_at timestamptz,
  time_to_conversion_seconds integer,
  referrer_source text,
  converted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_visits_session ON page_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_user ON page_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_date ON page_visits(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_visits_page ON page_visits(page_name);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_date ON analytics_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);

CREATE INDEX IF NOT EXISTS idx_conversion_funnel_session ON conversion_funnel(session_id);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_user ON conversion_funnel(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_converted ON conversion_funnel(converted);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_date ON conversion_funnel(first_visit_at DESC);

-- Disable RLS (Firebase auth used, data accessed via edge functions)
ALTER TABLE page_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_funnel DISABLE ROW LEVEL SECURITY;

-- Create function to update conversion funnel timestamps
CREATE OR REPLACE FUNCTION update_conversion_funnel_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Calculate time to conversion if signup completed
  IF NEW.signup_completed_at IS NOT NULL AND NEW.time_to_conversion_seconds IS NULL THEN
    NEW.time_to_conversion_seconds = EXTRACT(EPOCH FROM (NEW.signup_completed_at - NEW.first_visit_at))::integer;
    NEW.converted = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conversion funnel updates
DROP TRIGGER IF EXISTS update_conversion_funnel_timestamp_trigger ON conversion_funnel;
CREATE TRIGGER update_conversion_funnel_timestamp_trigger
  BEFORE UPDATE ON conversion_funnel
  FOR EACH ROW
  EXECUTE FUNCTION update_conversion_funnel_timestamp();
