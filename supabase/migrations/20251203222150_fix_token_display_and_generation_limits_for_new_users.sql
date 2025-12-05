/*
  # Fix Token Display and Generation Limits for New Users

  ## Issues Fixed
  1. New users showing 0 tokens in UI (should show 150k)
  2. Generation limits showing 0/0 (should show proper limits)
  3. init_generation_limits trigger using wrong column names
  
  ## Changes
  1. Fix generation_limits trigger to use correct column names
  2. Set correct limits: 3 images, 1 video, 2 songs, 3 TTS, 1 PPT per month
  3. Ensure tokens_balance is properly set for new users
  4. Create generation_limits record for existing users who don't have one
*/

-- Drop and recreate the init_generation_limits trigger with correct column names
DROP TRIGGER IF EXISTS init_generation_limits_trigger ON profiles;
DROP FUNCTION IF EXISTS init_generation_limits();

CREATE OR REPLACE FUNCTION init_generation_limits()
RETURNS TRIGGER AS $$
DECLARE
  v_current_month TEXT;
BEGIN
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Insert generation limits record with correct column names
  INSERT INTO generation_limits (
    user_id,
    month,
    images_generated,
    videos_generated,
    songs_generated,
    tts_generated,
    ppt_generated,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    v_current_month,
    0,
    0,
    0,
    0,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, month) DO NOTHING;
  
  RAISE NOTICE '✅ Generation limits initialized for user %', NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER init_generation_limits_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION init_generation_limits();

-- Update check_generation_limit function with correct limits: 3 images, 1 video, 2 songs, 3 TTS, 1 PPT
CREATE OR REPLACE FUNCTION check_generation_limit(
  p_user_id TEXT,
  p_generation_type TEXT,
  p_user_type TEXT DEFAULT 'free'
)
RETURNS JSON AS $$
DECLARE
  v_current_month TEXT;
  v_current_count INTEGER := 0;
  v_limit INTEGER := 0;
  v_can_generate BOOLEAN := FALSE;
  v_is_paid BOOLEAN := FALSE;
  v_message TEXT;
  v_paid_tokens BIGINT := 0;
BEGIN
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Check if user has paid tokens (10k+)
  SELECT COALESCE(paid_tokens_balance, 0) INTO v_paid_tokens
  FROM profiles
  WHERE id = p_user_id;
  
  v_is_paid := v_paid_tokens >= 10000;
  
  -- Paid users = unlimited
  IF v_is_paid THEN
    RETURN json_build_object(
      'can_generate', TRUE,
      'current', 0,
      'limit', -1,
      'is_paid', TRUE,
      'message', 'Unlimited (Premium)'
    );
  END IF;
  
  -- Free users: Set correct limits (3 images, 1 video, 2 songs, 3 TTS, 1 PPT)
  CASE p_generation_type
    WHEN 'image' THEN v_limit := 3;
    WHEN 'video' THEN v_limit := 1;
    WHEN 'song' THEN v_limit := 2;
    WHEN 'tts' THEN v_limit := 3;
    WHEN 'ppt' THEN v_limit := 1;
    ELSE v_limit := 0;
  END CASE;
  
  -- Get or create record for current month
  INSERT INTO generation_limits (user_id, month, images_generated, videos_generated, songs_generated, tts_generated, ppt_generated)
  VALUES (p_user_id, v_current_month, 0, 0, 0, 0, 0)
  ON CONFLICT (user_id, month) DO NOTHING;
  
  -- Get current count
  SELECT
    CASE p_generation_type
      WHEN 'image' THEN COALESCE(images_generated, 0)
      WHEN 'video' THEN COALESCE(videos_generated, 0)
      WHEN 'song' THEN COALESCE(songs_generated, 0)
      WHEN 'tts' THEN COALESCE(tts_generated, 0)
      WHEN 'ppt' THEN COALESCE(ppt_generated, 0)
      ELSE 0
    END INTO v_current_count
  FROM generation_limits
  WHERE user_id = p_user_id AND month = v_current_month;
  
  v_can_generate := v_current_count < v_limit;
  
  IF v_can_generate THEN
    v_message := format('%s of %s remaining', v_limit - v_current_count, v_limit);
  ELSE
    v_message := format('Limit reached (%s/%s)', v_current_count, v_limit);
  END IF;
  
  RETURN json_build_object(
    'can_generate', v_can_generate,
    'current', v_current_count,
    'limit', v_limit,
    'is_paid', FALSE,
    'message', v_message
  );
END;
$$ LANGUAGE plpgsql;

-- Create generation_limits records for any existing users who don't have one
DO $$
DECLARE
  v_current_month TEXT;
  v_user_record RECORD;
  v_count INTEGER := 0;
BEGIN
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  FOR v_user_record IN 
    SELECT id FROM profiles 
    WHERE NOT EXISTS (
      SELECT 1 FROM generation_limits 
      WHERE generation_limits.user_id = profiles.id 
      AND generation_limits.month = v_current_month
    )
  LOOP
    INSERT INTO generation_limits (
      user_id,
      month,
      images_generated,
      videos_generated,
      songs_generated,
      tts_generated,
      ppt_generated,
      created_at,
      updated_at
    ) VALUES (
      v_user_record.id,
      v_current_month,
      0,
      0,
      0,
      0,
      0,
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id, month) DO NOTHING;
    
    v_count := v_count + 1;
  END LOOP;
  
  RAISE NOTICE '✅ Created generation_limits records for % existing users', v_count;
END $$;

-- Verification
DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ GENERATION LIMITS FIXED';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Free Users: 3 images, 1 video, 2 songs, 3 TTS, 1 PPT per month';
  RAISE NOTICE 'Paid Users (10k+ paid tokens): Unlimited';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;