/*
  # Fix Generation Limits for Promotional Token Users

  ## Issue
  Users with 150K promotional tokens (First 200 bonus users) are being blocked after 1 image generation.

  ## Root Cause
  The check_generation_limit function only checks paid_tokens_balance >= 10000
  But First 200 users have their tokens in free_tokens_balance, not paid_tokens_balance

  ## Solution
  Check TOTAL tokens (free + paid) >= 10000 instead of just paid tokens
  This allows both:
  - Users who purchased tokens (paid_tokens_balance)
  - Users who got promotional tokens (free_tokens_balance)
  To have unlimited generations

  ## Changes
  1. Update check_generation_limit to check total tokens
  2. Consider anyone with 10k+ total tokens as "premium" for generation purposes
*/

-- ========================================================================
-- STEP 1: Drop and recreate check_generation_limit with correct logic
-- ========================================================================

DROP FUNCTION IF EXISTS check_generation_limit(TEXT, TEXT, TEXT);

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
  v_free_tokens BIGINT := 0;
  v_total_tokens BIGINT := 0;
BEGIN
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');

  -- Check TOTAL tokens (free + paid) instead of just paid
  SELECT
    COALESCE(paid_tokens_balance, 0),
    COALESCE(free_tokens_balance, 0)
  INTO v_paid_tokens, v_free_tokens
  FROM profiles
  WHERE id = p_user_id;

  v_total_tokens := v_paid_tokens + v_free_tokens;

  -- Users with 10k+ TOTAL tokens = unlimited (includes promotional users)
  v_is_paid := v_total_tokens >= 10000;

  RAISE NOTICE '🔍 Check limit: user=%, type=%, paid=%, free=%, total=%, is_premium=%',
    p_user_id, p_generation_type, v_paid_tokens, v_free_tokens, v_total_tokens, v_is_paid;

  -- Premium users (10k+ total tokens) = unlimited
  IF v_is_paid THEN
    RETURN json_build_object(
      'can_generate', TRUE,
      'current', 0,
      'limit', -1,
      'is_paid', TRUE,
      'message', 'Unlimited (Premium)'
    );
  END IF;

  -- Free users (less than 10k total tokens): Set limits
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
    v_message := format('Monthly limit reached (%s/%s). Upgrade for unlimited access!', v_current_count, v_limit);
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

COMMENT ON FUNCTION check_generation_limit IS
  'Checks generation limits. Users with 10k+ TOTAL tokens (free+paid) get unlimited generations. Others get monthly limits.';

-- ========================================================================
-- STEP 2: Update increment_generation to match
-- ========================================================================

DROP FUNCTION IF EXISTS increment_generation(TEXT, TEXT);

CREATE OR REPLACE FUNCTION increment_generation(
  p_user_id TEXT,
  p_generation_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_month TEXT;
  v_total_tokens BIGINT := 0;
BEGIN
  v_current_month := TO_CHAR(NOW(), 'YYYY-MM');

  -- Check TOTAL tokens instead of just paid
  SELECT COALESCE(paid_tokens_balance, 0) + COALESCE(free_tokens_balance, 0)
  INTO v_total_tokens
  FROM profiles
  WHERE id = p_user_id;

  -- Premium users (10k+ total tokens) don't increment (unlimited)
  IF v_total_tokens >= 10000 THEN
    RAISE NOTICE '✅ Premium user (total=%): skipping increment', v_total_tokens;
    RETURN TRUE;
  END IF;

  RAISE NOTICE '📊 Free user (total=%): incrementing % count', v_total_tokens, p_generation_type;

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

COMMENT ON FUNCTION increment_generation IS
  'Increments generation count for free users only. Premium users (10k+ total tokens) skip increment.';

-- ========================================================================
-- Verification
-- ========================================================================

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ GENERATION LIMITS FIXED FOR PROMOTIONAL USERS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'What Changed:';
  RAISE NOTICE '  ✅ Now checks TOTAL tokens (free + paid) instead of just paid';
  RAISE NOTICE '  ✅ Users with 150K promotional tokens = Premium (unlimited)';
  RAISE NOTICE '  ✅ Both purchase and promotional users get unlimited access';
  RAISE NOTICE '';
  RAISE NOTICE 'Thresholds:';
  RAISE NOTICE '  🎯 10K+ total tokens = Premium (unlimited generations)';
  RAISE NOTICE '  📉 Less than 10K = Free tier (monthly limits)';
  RAISE NOTICE '';
  RAISE NOTICE 'Free Tier Limits (when total < 10K):';
  RAISE NOTICE '  📷 Images: 5 per month';
  RAISE NOTICE '  🎬 Videos: 1 per month';
  RAISE NOTICE '  🎵 Songs: 1 per month';
  RAISE NOTICE '  🎤 TTS: 2 per month';
  RAISE NOTICE '  📊 PPT: 1 per month';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;