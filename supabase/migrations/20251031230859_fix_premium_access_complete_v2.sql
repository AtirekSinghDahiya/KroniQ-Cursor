/*
  # Complete Premium Access Fix V2

  ## Summary
  Fixes the check_user_is_premium function and ensures proper premium access
*/

-- Drop the broken function
DROP FUNCTION IF EXISTS check_user_is_premium(text);

-- Create fixed version without ambiguous column names
CREATE OR REPLACE FUNCTION check_user_is_premium(p_user_id text)
RETURNS TABLE (
  is_premium boolean,
  tier_source text,
  paid_tokens bigint,
  tier_level text
) AS $$
DECLARE
  v_result RECORD;
BEGIN
  -- Method 1: Check profiles table first (most reliable)
  SELECT 
    COALESCE(p.is_premium, false) OR COALESCE(p.is_paid, false) OR (COALESCE(p.paid_tokens_balance, 0) > 0) as is_premium,
    'profiles' as tier_source,
    COALESCE(p.paid_tokens_balance, 0) as paid_tokens,
    COALESCE(p.current_tier, 'free') as tier_level
  INTO v_result
  FROM profiles p
  WHERE p.id = p_user_id
  LIMIT 1;
  
  IF FOUND THEN
    RETURN QUERY SELECT v_result.is_premium, v_result.tier_source, v_result.paid_tokens, v_result.tier_level;
    RETURN;
  END IF;
  
  -- Default: user is free tier
  RETURN QUERY SELECT false as is_premium, 'default_free'::text as tier_source, 0::bigint as paid_tokens, 'free'::text as tier_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
DO $$
DECLARE
  v_result RECORD;
BEGIN
  SELECT * INTO v_result FROM check_user_is_premium('lc27Ut1BIeZw6nmXhpmhI2OhzH23');
  RAISE NOTICE 'Premium check result:';
  RAISE NOTICE '  is_premium: %', v_result.is_premium;
  RAISE NOTICE '  tier_source: %', v_result.tier_source;
  RAISE NOTICE '  paid_tokens: %', v_result.paid_tokens;
  RAISE NOTICE '  tier_level: %', v_result.tier_level;
END $$;
