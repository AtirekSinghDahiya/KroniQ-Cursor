/*
  # Fix Generation Limits - Drop and Recreate Functions
  
  ## Summary
  Drop existing functions and recreate with correct logic for:
  - Free users: 5 images, 1 video, 1 song, 2 tts, 1 ppt per month
  - Paid users (10k+ paid tokens): Unlimited generations
  - Add PPT support
*/

-- ========================================================================
-- STEP 1: Drop existing functions
-- ========================================================================

DROP FUNCTION IF EXISTS check_generation_limit(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS check_generation_limit(TEXT, TEXT);
DROP FUNCTION IF EXISTS increment_generation(TEXT, TEXT);

-- ========================================================================
-- STEP 2: Add ppt_generated column if it doesn't exist
-- ========================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generation_limits' AND column_name = 'ppt_generated'
  ) THEN
    ALTER TABLE generation_limits ADD COLUMN ppt_generated INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Added ppt_generated column';
  END IF;
END $$;

-- ========================================================================
-- STEP 3: Create check_generation_limit function
-- ========================================================================

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
  
  -- Check if user has 10k+ PAID tokens (not promotional)
  SELECT COALESCE(paid_tokens_balance, 0) INTO v_paid_tokens
  FROM profiles
  WHERE id = p_user_id;
  
  v_is_paid := v_paid_tokens >= 10000;
  
  RAISE NOTICE '🔍 Check limit: user=%, type=%, paid_tokens=%, is_paid=%', 
    p_user_id, p_generation_type, v_paid_tokens, v_is_paid;
  
  -- Paid users (10k+ paid tokens) = unlimited
  IF v_is_paid THEN
    RETURN json_build_object(
      'can_generate', TRUE,
      'current', 0,
      'limit', -1,
      'is_paid', TRUE,
      'message', 'Unlimited (Premium)'
    );
  END IF;
  
  -- Free users: Set limits
  CASE p_generation_type
    WHEN 'image' THEN v_limit := 5;
    WHEN 'video' THEN v_limit := 1;
    WHEN 'song' THEN v_limit := 1;
    WHEN 'tts' THEN v_limit := 2;
    WHEN 'ppt' THEN v_limit := 1;
    ELSE v_limit := 0;
  END CASE;
  
  -- Get or create record
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

-- ========================================================================
-- STEP 4: Create increment_generation function
-- ========================================================================

CREATE OR REPLACE FUNCTION increment_generation(
  p_user_id TEXT,
  p_generation_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_month TEXT;
  v_paid_tokens BIGINT := 0;
BEGIN
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Check if paid user
  SELECT COALESCE(paid_tokens_balance, 0) INTO v_paid_tokens
  FROM profiles
  WHERE id = p_user_id;
  
  -- Paid users don't increment (unlimited)
  IF v_paid_tokens >= 10000 THEN
    RETURN TRUE;
  END IF;
  
  -- Free users: increment
  INSERT INTO generation_limits (user_id, month, images_generated, videos_generated, songs_generated, tts_generated, ppt_generated)
  VALUES (p_user_id, v_current_month, 0, 0, 0, 0, 0)
  ON CONFLICT (user_id, month) DO NOTHING;
  
  CASE p_generation_type
    WHEN 'image' THEN
      UPDATE generation_limits SET images_generated = images_generated + 1, updated_at = NOW()
      WHERE user_id = p_user_id AND month = v_current_month;
    WHEN 'video' THEN
      UPDATE generation_limits SET videos_generated = videos_generated + 1, updated_at = NOW()
      WHERE user_id = p_user_id AND month = v_current_month;
    WHEN 'song' THEN
      UPDATE generation_limits SET songs_generated = songs_generated + 1, updated_at = NOW()
      WHERE user_id = p_user_id AND month = v_current_month;
    WHEN 'tts' THEN
      UPDATE generation_limits SET tts_generated = tts_generated + 1, updated_at = NOW()
      WHERE user_id = p_user_id AND month = v_current_month;
    WHEN 'ppt' THEN
      UPDATE generation_limits SET ppt_generated = ppt_generated + 1, updated_at = NOW()
      WHERE user_id = p_user_id AND month = v_current_month;
  END CASE;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ========================================================================
-- Verification
-- ========================================================================

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ GENERATION LIMITS CONFIGURED';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Free Users: 5 images, 1 video, 1 song, 2 tts, 1 ppt';
  RAISE NOTICE 'Paid Users (10k+ paid tokens): Unlimited';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
