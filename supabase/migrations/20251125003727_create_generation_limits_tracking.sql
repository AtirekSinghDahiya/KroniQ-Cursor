/*
  # Generation Limits Tracking System

  1. New Tables
    - `generation_limits`
      - `id` (uuid, primary key)
      - `user_id` (text, indexed) - Firebase user ID
      - `month` (text) - Format: YYYY-MM
      - `images_generated` (integer) - Count of images generated this month
      - `videos_generated` (integer) - Count of videos generated this month
      - `songs_generated` (integer) - Count of songs generated this month
      - `tts_generated` (integer) - Count of TTS generations this month
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - Unique index on (user_id, month) for fast lookups and preventing duplicates

  3. Security
    - RLS disabled for Firebase auth compatibility

  4. Functions
    - `get_generation_limits(user_id text, month text)` - Get or create limits record
    - `increment_generation(user_id text, generation_type text)` - Increment counter
    - `check_generation_limit(user_id text, generation_type text, user_type text)` - Check if limit exceeded
*/

-- Create generation_limits table
CREATE TABLE IF NOT EXISTS generation_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  month text NOT NULL,
  images_generated integer DEFAULT 0,
  videos_generated integer DEFAULT 0,
  songs_generated integer DEFAULT 0,
  tts_generated integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_generation_limits_user_month
  ON generation_limits(user_id, month);

-- Disable RLS (Firebase auth compatibility)
ALTER TABLE generation_limits DISABLE ROW LEVEL SECURITY;

-- Function to get or create generation limits record
CREATE OR REPLACE FUNCTION get_generation_limits(
  p_user_id text,
  p_month text
)
RETURNS generation_limits
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record generation_limits;
BEGIN
  -- Try to get existing record
  SELECT * INTO v_record
  FROM generation_limits
  WHERE user_id = p_user_id AND month = p_month;

  -- If not found, create it
  IF NOT FOUND THEN
    INSERT INTO generation_limits (user_id, month)
    VALUES (p_user_id, p_month)
    RETURNING * INTO v_record;
  END IF;

  RETURN v_record;
END;
$$;

-- Function to increment generation count
CREATE OR REPLACE FUNCTION increment_generation(
  p_user_id text,
  p_generation_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month text;
BEGIN
  -- Get current month (YYYY-MM format)
  v_month := to_char(now(), 'YYYY-MM');

  -- Ensure record exists
  PERFORM get_generation_limits(p_user_id, v_month);

  -- Increment the appropriate counter
  IF p_generation_type = 'image' THEN
    UPDATE generation_limits
    SET images_generated = images_generated + 1, updated_at = now()
    WHERE user_id = p_user_id AND month = v_month;
  ELSIF p_generation_type = 'video' THEN
    UPDATE generation_limits
    SET videos_generated = videos_generated + 1, updated_at = now()
    WHERE user_id = p_user_id AND month = v_month;
  ELSIF p_generation_type = 'song' THEN
    UPDATE generation_limits
    SET songs_generated = songs_generated + 1, updated_at = now()
    WHERE user_id = p_user_id AND month = v_month;
  ELSIF p_generation_type = 'tts' THEN
    UPDATE generation_limits
    SET tts_generated = tts_generated + 1, updated_at = now()
    WHERE user_id = p_user_id AND month = v_month;
  ELSE
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Function to check if generation limit is exceeded
CREATE OR REPLACE FUNCTION check_generation_limit(
  p_user_id text,
  p_generation_type text,
  p_user_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month text;
  v_limits generation_limits;
  v_limit integer;
  v_current integer;
  v_can_generate boolean;
BEGIN
  -- Paid users have no hard limits (token-based only)
  IF p_user_type = 'paid' THEN
    RETURN jsonb_build_object(
      'can_generate', true,
      'current', 0,
      'limit', -1,
      'is_paid', true,
      'message', 'Unlimited (token-based)'
    );
  END IF;

  -- Get current month
  v_month := to_char(now(), 'YYYY-MM');

  -- Get or create limits record
  v_limits := get_generation_limits(p_user_id, v_month);

  -- Set limits for free users
  IF p_generation_type = 'image' THEN
    v_limit := 5;
    v_current := v_limits.images_generated;
  ELSIF p_generation_type = 'video' THEN
    v_limit := 1;
    v_current := v_limits.videos_generated;
  ELSIF p_generation_type = 'song' THEN
    v_limit := 1;
    v_current := v_limits.songs_generated;
  ELSIF p_generation_type = 'tts' THEN
    v_limit := 5;
    v_current := v_limits.tts_generated;
  ELSE
    RETURN jsonb_build_object(
      'can_generate', false,
      'current', 0,
      'limit', 0,
      'is_paid', false,
      'message', 'Invalid generation type'
    );
  END IF;

  -- Check if under limit
  v_can_generate := v_current < v_limit;

  RETURN jsonb_build_object(
    'can_generate', v_can_generate,
    'current', v_current,
    'limit', v_limit,
    'is_paid', false,
    'message', CASE
      WHEN v_can_generate THEN format('%s/%s generations used', v_current, v_limit)
      ELSE format('Monthly limit reached (%s/%s)', v_current, v_limit)
    END
  );
END;
$$;