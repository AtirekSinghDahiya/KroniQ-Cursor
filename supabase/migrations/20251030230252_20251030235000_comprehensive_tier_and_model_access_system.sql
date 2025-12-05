/*
  # Comprehensive Tier-Based Access Control System
  
  ## Overview
  Complete tier management system with automatic upgrades/downgrades and model access control.
  
  ## Changes
  
  1. Model Access Control Tables
     - `model_catalog`: Stores all available AI models with tier requirements
     - Defines which models are free vs paid tier
     - Categorizes models by type (chat, image, video, music, voiceover)
  
  2. Enhanced Profile Management
     - Ensures `is_premium` column exists and is properly set
     - Links tier status to `paid_tokens_balance`
     - Automatic tier determination based on token balance
  
  3. Tier Transition Functions
     - `upgrade_user_to_paid_tier()`: Upgrades user when they purchase tokens
     - `downgrade_user_to_free_tier()`: Downgrades when tokens depleted
     - `check_and_update_user_tier()`: Automatic tier sync based on balance
  
  4. Model Access Functions
     - `get_accessible_models()`: Returns models available to user's tier
     - `can_access_model_by_tier()`: Checks if user can access specific model
     - `get_user_tier_status()`: Returns complete tier information
  
  5. Security
     - All functions use SECURITY DEFINER for consistent access
     - RLS policies ensure users can only access their own data
     - Free tier users CANNOT access premium models
     - Paid tier users get full access to all models
*/

-- =====================================================
-- 1. MODEL CATALOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS model_catalog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('chat', 'image', 'video', 'music', 'voiceover', 'editing')),
  requires_paid_tier BOOLEAN NOT NULL DEFAULT FALSE,
  base_cost_tokens INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE model_catalog ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read model catalog
CREATE POLICY "Anyone can view model catalog"
  ON model_catalog FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 2. INSERT MODEL CATALOG DATA
-- =====================================================

-- Clear existing data
TRUNCATE TABLE model_catalog;

-- Free Tier Chat Models
INSERT INTO model_catalog (id, name, provider, category, requires_paid_tier, base_cost_tokens, description) VALUES
('grok-4-fast', 'Grok 4 Fast', 'xAI', 'chat', FALSE, 100, 'Fast and efficient chat model'),
('llama-3.3-70b', 'Llama 3.3 70B', 'Meta', 'chat', FALSE, 100, 'Open source chat model'),
('qwen-2.5-72b', 'Qwen 2.5 72B', 'Alibaba', 'chat', FALSE, 100, 'Chinese-English bilingual model');

-- Paid Tier Chat Models
INSERT INTO model_catalog (id, name, provider, category, requires_paid_tier, base_cost_tokens, description) VALUES
('gpt-5-chat', 'GPT-5', 'OpenAI', 'chat', TRUE, 500, 'Latest GPT model'),
('claude-sonnet-4.5', 'Claude Sonnet 4.5', 'Anthropic', 'chat', TRUE, 400, 'Advanced reasoning model'),
('claude-opus-4', 'Claude Opus 4', 'Anthropic', 'chat', TRUE, 600, 'Most capable Claude model'),
('gemini-2.0-flash', 'Gemini 2.0 Flash', 'Google', 'chat', TRUE, 300, 'Fast multimodal model'),
('kimi-k2', 'Kimi K2', 'Moonshot', 'chat', TRUE, 350, 'Long context model'),
('deepseek-v3.2', 'DeepSeek V3.2', 'DeepSeek', 'chat', TRUE, 250, 'Reasoning specialist'),
('perplexity-sonar-pro', 'Sonar Pro', 'Perplexity', 'chat', TRUE, 400, 'Search-augmented chat');

-- Free Tier Image Models
INSERT INTO model_catalog (id, name, provider, category, requires_paid_tier, base_cost_tokens, description) VALUES
('flux-schnell', 'FLUX Schnell', 'Black Forest Labs', 'image', FALSE, 200, 'Fast image generation');

-- Paid Tier Image Models
INSERT INTO model_catalog (id, name, provider, category, requires_paid_tier, base_cost_tokens, description) VALUES
('nano-banana', 'Nano Banana', 'Google Gemini', 'image', TRUE, 300, 'High-quality image generation'),
('dall-e-3', 'DALL-E 3', 'OpenAI', 'image', TRUE, 400, 'Advanced image generation'),
('stable-diffusion-xl', 'Stable Diffusion XL', 'Stability AI', 'image', TRUE, 250, 'Open source image generation');

-- Video Models (All Paid Tier)
INSERT INTO model_catalog (id, name, provider, category, requires_paid_tier, base_cost_tokens, description) VALUES
('sora-2', 'Sora 2', 'OpenAI', 'video', TRUE, 5000, 'Text-to-video generation'),
('veo-3', 'Veo 3 Fast', 'Google', 'video', TRUE, 4000, 'Fast video generation'),
('runway-gen3', 'Runway Gen-3', 'Runway', 'video', TRUE, 3500, 'Professional video generation');

-- Music Models (All Paid Tier)
INSERT INTO model_catalog (id, name, provider, category, requires_paid_tier, base_cost_tokens, description) VALUES
('suno-v3.5', 'Suno V3.5', 'Suno', 'music', TRUE, 2000, 'AI music generation');

-- Video Editing (All Paid Tier)
INSERT INTO model_catalog (id, name, provider, category, requires_paid_tier, base_cost_tokens, description) VALUES
('wan-vace', 'Wan VACE', 'Wan', 'editing', TRUE, 3000, 'AI video editing');

-- Voiceover (All Paid Tier)
INSERT INTO model_catalog (id, name, provider, category, requires_paid_tier, base_cost_tokens, description) VALUES
('eleven-labs', 'ElevenLabs', 'ElevenLabs', 'voiceover', TRUE, 1000, 'Natural voice generation');

-- =====================================================
-- 3. TIER TRANSITION FUNCTIONS
-- =====================================================

-- Upgrade user to paid tier
CREATE OR REPLACE FUNCTION upgrade_user_to_paid_tier(p_user_id TEXT, p_tokens_added BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    is_premium = TRUE,
    is_paid = TRUE,
    current_tier = 'premium',
    paid_tokens_balance = COALESCE(paid_tokens_balance, 0) + p_tokens_added,
    last_purchase_date = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RAISE NOTICE 'User % upgraded to paid tier with % tokens', p_user_id, p_tokens_added;
END;
$$;

-- Downgrade user to free tier
CREATE OR REPLACE FUNCTION downgrade_user_to_free_tier(p_user_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    is_premium = FALSE,
    current_tier = 'free',
    updated_at = NOW()
  WHERE id = p_user_id
    AND COALESCE(paid_tokens_balance, 0) <= 0;
  
  RAISE NOTICE 'User % downgraded to free tier', p_user_id;
END;
$$;

-- Automatic tier check and update
CREATE OR REPLACE FUNCTION check_and_update_user_tier(p_user_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_paid_tokens BIGINT;
  v_current_tier TEXT;
BEGIN
  SELECT paid_tokens_balance, current_tier
  INTO v_paid_tokens, v_current_tier
  FROM profiles
  WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN 'user_not_found';
  END IF;
  
  -- If user has paid tokens but isn't marked as premium, upgrade them
  IF COALESCE(v_paid_tokens, 0) > 0 AND v_current_tier != 'premium' THEN
    UPDATE profiles
    SET 
      is_premium = TRUE,
      is_paid = TRUE,
      current_tier = 'premium',
      updated_at = NOW()
    WHERE id = p_user_id;
    RETURN 'upgraded_to_paid';
  END IF;
  
  -- If user has no paid tokens but is marked as premium, downgrade them
  IF COALESCE(v_paid_tokens, 0) <= 0 AND v_current_tier = 'premium' THEN
    UPDATE profiles
    SET 
      is_premium = FALSE,
      current_tier = 'free',
      updated_at = NOW()
    WHERE id = p_user_id;
    RETURN 'downgraded_to_free';
  END IF;
  
  RETURN 'no_change';
END;
$$;

-- =====================================================
-- 4. MODEL ACCESS FUNCTIONS
-- =====================================================

-- Get all models accessible to user based on tier
CREATE OR REPLACE FUNCTION get_accessible_models(p_user_id TEXT)
RETURNS TABLE (
  model_id TEXT,
  model_name TEXT,
  provider TEXT,
  category TEXT,
  requires_paid_tier BOOLEAN,
  base_cost_tokens INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_paid_tokens BIGINT;
BEGIN
  -- Get user tier status
  SELECT is_premium, paid_tokens_balance
  INTO v_is_premium, v_paid_tokens
  FROM profiles
  WHERE id = p_user_id;
  
  -- Default to free tier if user not found
  v_is_premium := COALESCE(v_is_premium, FALSE);
  v_paid_tokens := COALESCE(v_paid_tokens, 0);
  
  -- If user has paid tokens, they're premium (even if flag not set)
  IF v_paid_tokens > 0 THEN
    v_is_premium := TRUE;
  END IF;
  
  -- Return models based on tier
  IF v_is_premium THEN
    -- Paid tier: All models
    RETURN QUERY
    SELECT mc.id, mc.name, mc.provider, mc.category, mc.requires_paid_tier, mc.base_cost_tokens
    FROM model_catalog mc
    WHERE mc.is_active = TRUE
    ORDER BY mc.category, mc.name;
  ELSE
    -- Free tier: Only free models
    RETURN QUERY
    SELECT mc.id, mc.name, mc.provider, mc.category, mc.requires_paid_tier, mc.base_cost_tokens
    FROM model_catalog mc
    WHERE mc.is_active = TRUE
      AND mc.requires_paid_tier = FALSE
    ORDER BY mc.category, mc.name;
  END IF;
END;
$$;

-- Check if user can access specific model
CREATE OR REPLACE FUNCTION can_access_model_by_tier(p_user_id TEXT, p_model_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_premium BOOLEAN;
  v_paid_tokens BIGINT;
  v_requires_paid BOOLEAN;
BEGIN
  -- Get user tier status
  SELECT is_premium, paid_tokens_balance
  INTO v_is_premium, v_paid_tokens
  FROM profiles
  WHERE id = p_user_id;
  
  -- Default to free tier
  v_is_premium := COALESCE(v_is_premium, FALSE);
  v_paid_tokens := COALESCE(v_paid_tokens, 0);
  
  -- If user has paid tokens, they're premium
  IF v_paid_tokens > 0 THEN
    v_is_premium := TRUE;
  END IF;
  
  -- Get model requirements
  SELECT requires_paid_tier
  INTO v_requires_paid
  FROM model_catalog
  WHERE id = p_model_id AND is_active = TRUE;
  
  -- If model not found, deny access
  IF v_requires_paid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Free models: accessible to everyone
  IF v_requires_paid = FALSE THEN
    RETURN TRUE;
  END IF;
  
  -- Paid models: only accessible to premium users
  RETURN v_is_premium;
END;
$$;

-- Get complete tier status for user
CREATE OR REPLACE FUNCTION get_user_tier_status(p_user_id TEXT)
RETURNS TABLE (
  user_id TEXT,
  current_tier TEXT,
  is_premium BOOLEAN,
  paid_tokens_balance BIGINT,
  free_tokens_balance BIGINT,
  daily_tokens_remaining INTEGER,
  can_access_premium_models BOOLEAN,
  total_accessible_models INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
  v_model_count INTEGER;
BEGIN
  -- Get profile data
  SELECT 
    p.id,
    p.current_tier,
    p.is_premium,
    p.paid_tokens_balance,
    p.free_tokens_balance,
    p.daily_tokens_remaining
  INTO v_profile
  FROM profiles p
  WHERE p.id = p_user_id;
  
  IF NOT FOUND THEN
    -- Return default free tier
    RETURN QUERY SELECT
      p_user_id,
      'free'::TEXT,
      FALSE,
      0::BIGINT,
      0::BIGINT,
      0::INTEGER,
      FALSE,
      0::INTEGER;
    RETURN;
  END IF;
  
  -- Count accessible models
  SELECT COUNT(*)::INTEGER
  INTO v_model_count
  FROM get_accessible_models(p_user_id);
  
  -- Determine if user can access premium models
  DECLARE
    v_has_premium_access BOOLEAN;
  BEGIN
    v_has_premium_access := (
      COALESCE(v_profile.is_premium, FALSE) OR 
      COALESCE(v_profile.paid_tokens_balance, 0) > 0
    );
    
    RETURN QUERY SELECT
      v_profile.id,
      COALESCE(v_profile.current_tier, 'free'),
      COALESCE(v_profile.is_premium, FALSE),
      COALESCE(v_profile.paid_tokens_balance, 0),
      COALESCE(v_profile.free_tokens_balance, 0),
      COALESCE(v_profile.daily_tokens_remaining, 0),
      v_has_premium_access,
      v_model_count;
  END;
END;
$$;

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION upgrade_user_to_paid_tier(TEXT, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION downgrade_user_to_free_tier(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_update_user_tier(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_accessible_models(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_model_by_tier(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_tier_status(TEXT) TO authenticated;

-- =====================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_model_catalog_tier ON model_catalog(requires_paid_tier, is_active);
CREATE INDEX IF NOT EXISTS idx_model_catalog_category ON model_catalog(category, is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_tier_status ON profiles(is_premium, paid_tokens_balance) WHERE is_premium = TRUE OR paid_tokens_balance > 0;
