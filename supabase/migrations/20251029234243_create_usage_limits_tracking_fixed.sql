/*
  # Create Usage Limits Tracking System

  1. New Tables
    - `usage_limits`
      - `id` (uuid, primary key)
      - `user_id` (text, references profiles)
      - `month_year` (text, format: YYYY-MM)
      - `ppt_generated` (integer, default 0)
      - `images_generated` (integer, default 0)
      - `videos_generated` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Limits
    - Free tier: 3 PPTs, 6 images, 1 video per month
    - Paid tier: Unlimited (token-based only)

  3. Security
    - Enable RLS on `usage_limits` table
    - Add policy for users to read their own usage
    - Add policy for system to update usage
*/

-- Create usage limits table
CREATE TABLE IF NOT EXISTS usage_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  month_year text NOT NULL,
  ppt_generated integer DEFAULT 0,
  images_generated integer DEFAULT 0,
  videos_generated integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month_year)
);

-- Enable RLS
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage
CREATE POLICY "Users can read own usage limits"
  ON usage_limits
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

-- System can insert/update usage
CREATE POLICY "System can manage usage limits"
  ON usage_limits
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Function to check and increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id text,
  p_usage_type text
) RETURNS jsonb AS $$
DECLARE
  v_month_year text;
  v_is_paid boolean;
  v_current_usage integer;
  v_limit integer;
  v_can_proceed boolean;
BEGIN
  -- Get current month
  v_month_year := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Check if user is paid
  SELECT is_paid INTO v_is_paid
  FROM profiles
  WHERE id = p_user_id;
  
  -- Paid users have unlimited usage (token-based only)
  IF v_is_paid THEN
    RETURN jsonb_build_object(
      'success', true,
      'can_proceed', true,
      'is_paid', true,
      'usage', 0,
      'limit', -1
    );
  END IF;
  
  -- Set limits for free users
  IF p_usage_type = 'ppt' THEN
    v_limit := 3;
  ELSIF p_usage_type = 'image' THEN
    v_limit := 6;
  ELSIF p_usage_type = 'video' THEN
    v_limit := 1;
  ELSE
    v_limit := 0;
  END IF;
  
  -- Get or create usage record
  INSERT INTO usage_limits (user_id, month_year)
  VALUES (p_user_id, v_month_year)
  ON CONFLICT (user_id, month_year) DO NOTHING;
  
  -- Get current usage
  IF p_usage_type = 'ppt' THEN
    SELECT ppt_generated INTO v_current_usage
    FROM usage_limits
    WHERE user_id = p_user_id AND month_year = v_month_year;
  ELSIF p_usage_type = 'image' THEN
    SELECT images_generated INTO v_current_usage
    FROM usage_limits
    WHERE user_id = p_user_id AND month_year = v_month_year;
  ELSIF p_usage_type = 'video' THEN
    SELECT videos_generated INTO v_current_usage
    FROM usage_limits
    WHERE user_id = p_user_id AND month_year = v_month_year;
  END IF;
  
  v_current_usage := COALESCE(v_current_usage, 0);
  v_can_proceed := v_current_usage < v_limit;
  
  -- Increment if can proceed
  IF v_can_proceed THEN
    IF p_usage_type = 'ppt' THEN
      UPDATE usage_limits
      SET ppt_generated = ppt_generated + 1, updated_at = NOW()
      WHERE user_id = p_user_id AND month_year = v_month_year;
    ELSIF p_usage_type = 'image' THEN
      UPDATE usage_limits
      SET images_generated = images_generated + 1, updated_at = NOW()
      WHERE user_id = p_user_id AND month_year = v_month_year;
    ELSIF p_usage_type = 'video' THEN
      UPDATE usage_limits
      SET videos_generated = videos_generated + 1, updated_at = NOW()
      WHERE user_id = p_user_id AND month_year = v_month_year;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'can_proceed', v_can_proceed,
    'is_paid', false,
    'usage', v_current_usage + CASE WHEN v_can_proceed THEN 1 ELSE 0 END,
    'limit', v_limit
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_usage_limits_user_month ON usage_limits(user_id, month_year);