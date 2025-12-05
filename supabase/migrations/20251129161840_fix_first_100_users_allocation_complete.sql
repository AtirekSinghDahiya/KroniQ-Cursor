/*
  # Fix First 100 Users Token and Generation Limits Allocation

  ## Issues Fixed
  1. New users receiving 150k instead of 5M tokens for first 100
  2. Generation limits showing -1 instead of proper values (5 images, 1 video, 1 music, 3 TTS, 1 PPT)
  3. Reset counter to properly track first 100 users

  ## Changes
  1. Reset promotional counter to allow more users
  2. Update trigger to give 5M tokens to first 100 (not 115)
  3. Initialize generation_limits with proper values on signup
  4. Fix generation limit logic
*/

-- Reset promotional counter to allow new users to get 5M
UPDATE promotional_user_counter
SET first_101_count = 0, last_updated = NOW()
WHERE id = 1;

-- Update trigger for first 100 users with 5M tokens
CREATE OR REPLACE FUNCTION unified_profile_initialization()
RETURNS TRIGGER AS $$
DECLARE
  v_current_count INTEGER;
  v_should_grant_bonus BOOLEAN := FALSE;
  v_base_tokens BIGINT := 150000;
  v_bonus_tokens BIGINT := 5000000;
BEGIN
  RAISE NOTICE '🚀 Starting unified profile initialization for user: %', NEW.id;

  BEGIN
    UPDATE promotional_user_counter
    SET
      first_101_count = first_101_count + 1,
      last_updated = NOW()
    WHERE id = 1 AND first_101_count < 100
    RETURNING first_101_count INTO v_current_count;

    IF FOUND AND v_current_count <= 100 THEN
      v_should_grant_bonus := TRUE;
      RAISE NOTICE '🎉 User % is within First 100! User number: %', NEW.id, v_current_count;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Could not check First 100 bonus: %', SQLERRM;
  END;

  IF v_should_grant_bonus THEN
    NEW.tokens_balance := v_bonus_tokens;
    NEW.free_tokens_balance := 0;
    NEW.paid_tokens_balance := v_bonus_tokens;
    
    NEW.is_premium := true;
    NEW.is_paid := true;
    NEW.current_tier := 'premium';

    RAISE NOTICE '✅ Set tokens_balance to % (First 100 user - 5M)', v_bonus_tokens;

    BEGIN
      INSERT INTO promotional_users (user_id, campaign_id, tokens_awarded, activated_at)
      VALUES (NEW.id, 'first-100-users', v_bonus_tokens, NOW())
      ON CONFLICT (user_id, campaign_id) DO NOTHING;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not log to promotional_users: %', SQLERRM;
    END;
  ELSE
    NEW.tokens_balance := v_base_tokens;
    NEW.free_tokens_balance := v_base_tokens;
    NEW.paid_tokens_balance := 0;
    
    NEW.current_tier := 'free';
    NEW.is_paid := false;
    NEW.is_premium := false;

    RAISE NOTICE '✅ Set tokens_balance to % (Standard free user)', v_base_tokens;
  END IF;

  IF NEW.daily_tokens_remaining IS NULL THEN
    NEW.daily_tokens_remaining := 5000;
  END IF;

  IF NEW.daily_token_limit IS NULL THEN
    NEW.daily_token_limit := 5000;
  END IF;

  IF NEW.monthly_token_limit IS NULL THEN
    NEW.monthly_token_limit := v_base_tokens;
  END IF;

  IF NEW.last_reset_date IS NULL THEN
    NEW.last_reset_date := CURRENT_DATE;
  END IF;

  IF NEW.last_token_refresh IS NULL THEN
    NEW.last_token_refresh := NOW();
  END IF;

  RAISE NOTICE '✅ Profile initialization complete for user %', NEW.id;
  RAISE NOTICE '   - Total tokens: %', NEW.tokens_balance;
  RAISE NOTICE '   - Tier: %', NEW.current_tier;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS unified_profile_init_trigger ON profiles;
CREATE TRIGGER unified_profile_init_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION unified_profile_initialization();

-- Create trigger to initialize generation limits for new users
CREATE OR REPLACE FUNCTION init_generation_limits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO generation_limits (
    user_id,
    period_start,
    period_end,
    image_generated,
    video_generated,
    song_generated,
    tts_generated,
    ppt_generated
  ) VALUES (
    NEW.id,
    DATE_TRUNC('month', NOW()),
    DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
    0,
    0,
    0,
    0,
    0
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS init_generation_limits_trigger ON profiles;
CREATE TRIGGER init_generation_limits_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION init_generation_limits();

-- Update check_generation_limit function with correct limits
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
  
  SELECT COALESCE(paid_tokens_balance, 0) INTO v_paid_tokens
  FROM profiles
  WHERE id = p_user_id;
  
  v_is_paid := v_paid_tokens > 0;
  
  IF v_is_paid THEN
    RETURN json_build_object(
      'can_generate', TRUE,
      'current', 0,
      'limit', -1,
      'is_paid', TRUE,
      'message', 'Unlimited (Premium)'
    );
  END IF;
  
  CASE p_generation_type
    WHEN 'image' THEN v_limit := 5;
    WHEN 'video' THEN v_limit := 1;
    WHEN 'song' THEN v_limit := 1;
    WHEN 'tts' THEN v_limit := 3;
    WHEN 'ppt' THEN v_limit := 1;
    ELSE v_limit := 0;
  END CASE;
  
  SELECT
    CASE p_generation_type
      WHEN 'image' THEN COALESCE(image_generated, 0)
      WHEN 'video' THEN COALESCE(video_generated, 0)
      WHEN 'song' THEN COALESCE(song_generated, 0)
      WHEN 'tts' THEN COALESCE(tts_generated, 0)
      WHEN 'ppt' THEN COALESCE(ppt_generated, 0)
      ELSE 0
    END INTO v_current_count
  FROM generation_limits
  WHERE user_id = p_user_id;
  
  v_can_generate := v_current_count < v_limit;
  
  IF v_can_generate THEN
    v_message := FORMAT('You have %s/%s %s remaining', 
      v_limit - v_current_count, v_limit, p_generation_type);
  ELSE
    v_message := FORMAT('Monthly limit reached (%s/%s)', v_current_count, v_limit);
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
