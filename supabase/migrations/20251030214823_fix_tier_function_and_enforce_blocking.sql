/*
  # Fix Tier Function and Enforce Model Blocking

  ## Changes
  1. Fix ambiguous column references in get_user_tier_config function
  2. Add proper STRICT enforcement for free tier blocking
  3. Ensure canAccessModel returns false for free tier + premium models

  ## Security
  - Free tier users CANNOT access premium models
  - Free tier users CANNOT access video generation
  - Paid tier determined by paid_tokens_balance > 0
*/

-- Drop and recreate the tier config function with proper column references
DROP FUNCTION IF EXISTS get_user_tier_config(text);

CREATE OR REPLACE FUNCTION get_user_tier_config(p_user_id text)
RETURNS TABLE (
  tier_name text,
  tier_level integer,
  is_free_tier boolean,
  daily_token_limit integer,
  monthly_token_limit integer,
  can_access_premium_models boolean,
  can_access_video_generation boolean,
  daily_tokens_remaining integer,
  monthly_tokens_remaining integer,
  paid_tokens_available bigint,
  free_tokens_available bigint
) AS $$
DECLARE
  v_profile RECORD;
  v_tier RECORD;
BEGIN
  -- Get user profile
  SELECT 
    p.id,
    p.paid_tokens_balance,
    p.free_tokens_balance,
    p.daily_tokens_remaining,
    p.current_tier
  INTO v_profile
  FROM profiles p
  WHERE p.id = p_user_id;
  
  IF NOT FOUND THEN
    -- Return default free tier for non-existent users
    RETURN QUERY
    SELECT 
      'free'::text,
      0::integer,
      true::boolean,
      5000::integer,
      150000::integer,
      false::boolean,
      false::boolean,
      5000::integer,
      150000::integer,
      0::bigint,
      0::bigint;
    RETURN;
  END IF;

  -- Determine tier: STRICTLY based on paid_tokens_balance
  IF COALESCE(v_profile.paid_tokens_balance, 0) > 0 THEN
    -- User has paid tokens = paid tier (minimum starter)
    SELECT 
      tc.tier_name,
      tc.tier_level,
      tc.is_free_tier,
      tc.daily_token_limit,
      tc.monthly_token_limit,
      tc.can_access_premium_models,
      tc.can_access_video_generation
    INTO v_tier
    FROM tier_config tc
    WHERE tc.tier_name = 'starter';
  ELSE
    -- NO paid tokens = FREE tier
    SELECT 
      tc.tier_name,
      tc.tier_level,
      tc.is_free_tier,
      tc.daily_token_limit,
      tc.monthly_token_limit,
      tc.can_access_premium_models,
      tc.can_access_video_generation
    INTO v_tier
    FROM tier_config tc
    WHERE tc.tier_name = 'free';
  END IF;

  -- Return combined data with STRICT free tier enforcement
  RETURN QUERY SELECT 
    v_tier.tier_name,
    v_tier.tier_level,
    v_tier.is_free_tier,
    v_tier.daily_token_limit,
    v_tier.monthly_token_limit,
    v_tier.can_access_premium_models,
    v_tier.can_access_video_generation,
    COALESCE(v_profile.daily_tokens_remaining, v_tier.daily_token_limit)::integer,
    COALESCE(v_profile.free_tokens_balance, v_tier.monthly_token_limit)::integer,
    COALESCE(v_profile.paid_tokens_balance, 0)::bigint,
    COALESCE(v_profile.free_tokens_balance, 0)::bigint;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update can_user_access_model to be STRICT about free tier
DROP FUNCTION IF EXISTS can_user_access_model(text, text, boolean);

CREATE OR REPLACE FUNCTION can_user_access_model(p_user_id text, p_model_id text, p_is_premium boolean)
RETURNS boolean AS $$
DECLARE
  v_tier_info RECORD;
  v_has_tokens boolean;
BEGIN
  -- Get tier config
  SELECT * INTO v_tier_info FROM get_user_tier_config(p_user_id) LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if user has any tokens available
  v_has_tokens := (v_tier_info.daily_tokens_remaining > 0 OR v_tier_info.paid_tokens_available > 0);
  
  IF NOT v_has_tokens THEN
    RETURN false;
  END IF;

  -- STRICT CHECK: If this is a premium model AND user is free tier, BLOCK
  IF p_is_premium AND v_tier_info.is_free_tier THEN
    RETURN false;
  END IF;

  -- If model is premium and user has paid access, allow
  IF p_is_premium THEN
    RETURN v_tier_info.can_access_premium_models AND v_tier_info.paid_tokens_available > 0;
  END IF;

  -- Free models are accessible to everyone with tokens
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add helper function to check video access
CREATE OR REPLACE FUNCTION can_user_generate_video(p_user_id text)
RETURNS boolean AS $$
DECLARE
  v_tier_info RECORD;
BEGIN
  SELECT * INTO v_tier_info FROM get_user_tier_config(p_user_id) LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Video generation requires: paid tier + paid tokens + video permission
  RETURN NOT v_tier_info.is_free_tier 
    AND v_tier_info.can_access_video_generation 
    AND v_tier_info.paid_tokens_available > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
