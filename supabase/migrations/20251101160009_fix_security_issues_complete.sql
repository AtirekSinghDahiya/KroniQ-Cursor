/*
  # Fix All Security Issues - Complete
  
  ## Security Fixes Applied
  
  ### 1. Performance: Unindexed Foreign Keys ✅
  - Added indexes for job_applications.job_id
  - Added indexes for messages.conversation_id
  - Added indexes for token_purchases.pack_id
  - Added indexes for transactions.plan_id
  
  ### 2. Critical: RLS Disabled on Tables with Policies ✅
  - Enabled RLS on conversations table
  - Enabled RLS on messages table
  - Enabled RLS on projects table
  
  ### 3. Security: Function Search Path Mutable ✅
  - Fixed auto_assign_free_tier
  - Fixed upgrade_user_to_paid_tier
  - Fixed check_user_is_premium
  - Fixed auto_sync_premium_flags
  - Fixed check_user_premium_status
*/

-- ============================================================
-- PART 1: CREATE INDEXES FOR FOREIGN KEYS (Performance)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id 
ON job_applications(job_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id 
ON messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_project_id 
ON messages(project_id);

CREATE INDEX IF NOT EXISTS idx_token_purchases_pack_id 
ON token_purchases(pack_id);

CREATE INDEX IF NOT EXISTS idx_token_purchases_user_id 
ON token_purchases(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_plan_id 
ON transactions(plan_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id 
ON transactions(user_id);

-- ============================================================
-- PART 2: ENABLE RLS ON TABLES (Critical Security)
-- ============================================================

ALTER TABLE IF EXISTS conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 3: FIX FUNCTION SEARCH PATHS (Security)
-- ============================================================

-- Drop all existing triggers first
DROP TRIGGER IF EXISTS trigger_auto_assign_free_tier ON profiles;
DROP TRIGGER IF EXISTS trigger_upgrade_user_to_paid_tier ON profiles;
DROP TRIGGER IF EXISTS trigger_auto_sync_premium_flags ON profiles;
DROP TRIGGER IF EXISTS auto_assign_free_tier_on_signup ON profiles;
DROP TRIGGER IF EXISTS upgrade_to_paid_tier_on_token_purchase ON profiles;
DROP TRIGGER IF EXISTS sync_premium_flags_on_change ON profiles;

-- Drop all existing functions with CASCADE
DROP FUNCTION IF EXISTS auto_assign_free_tier() CASCADE;
DROP FUNCTION IF EXISTS auto_sync_premium_flags() CASCADE;
DROP FUNCTION IF EXISTS check_user_is_premium(TEXT) CASCADE;
DROP FUNCTION IF EXISTS upgrade_user_to_paid_tier(TEXT, BIGINT) CASCADE;
DROP FUNCTION IF EXISTS check_user_premium_status(TEXT) CASCADE;

-- Recreate auto_assign_free_tier with fixed search path
CREATE OR REPLACE FUNCTION auto_assign_free_tier()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.paid_tokens_balance IS NULL OR NEW.paid_tokens_balance = 0 OR 
       (NEW.paid_tokens_balance = 5000 AND NEW.tokens_balance = 5000) THEN
      
      NEW.paid_tokens_balance := 0;
      NEW.tokens_balance := 5000;
      NEW.free_tokens_balance := 5000;
      NEW.messages_remaining := 10;
      NEW.is_premium := false;
      NEW.is_paid := false;
      NEW.is_paid_user := false;
      NEW.current_tier := 'free';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate auto_sync_premium_flags with fixed search path
CREATE OR REPLACE FUNCTION auto_sync_premium_flags()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_paid_tokens bigint;
BEGIN
  -- ONLY paid_tokens_balance determines premium status
  v_paid_tokens := COALESCE(NEW.paid_tokens_balance, 0);
  
  -- Update premium flags ONLY based on PAID tokens
  IF v_paid_tokens > 0 THEN
    NEW.is_premium := TRUE;
    NEW.is_paid := TRUE;
    NEW.is_paid_user := TRUE;
    NEW.current_tier := 'premium';
  ELSE
    NEW.is_premium := FALSE;
    NEW.is_paid := FALSE;
    NEW.is_paid_user := FALSE;
    NEW.current_tier := 'free';
  END IF;
  
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$;

-- Recreate check_user_is_premium with fixed search path
CREATE OR REPLACE FUNCTION check_user_is_premium(p_user_id text)
RETURNS TABLE(
  is_premium boolean,
  tier_source text,
  paid_tokens bigint,
  tier_level text
)
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_result RECORD;
BEGIN
  -- Check profiles table (most reliable)
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
$$;

-- Recreate upgrade_user_to_paid_tier with fixed search path
CREATE OR REPLACE FUNCTION upgrade_user_to_paid_tier(p_user_id text, p_tokens_added bigint)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles
  SET 
    -- Update ALL token columns consistently
    paid_tokens_balance = COALESCE(paid_tokens_balance, 0) + p_tokens_added,
    tokens_balance = COALESCE(tokens_balance, 0) + p_tokens_added,
    messages_remaining = COALESCE(messages_remaining, 0) + p_tokens_added,
    
    -- Set ALL premium flags
    is_premium = TRUE,
    is_paid = TRUE,
    is_paid_user = TRUE,
    current_tier = 'premium',
    
    -- Update timestamps
    last_purchase_date = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  RAISE NOTICE 'User % upgraded: added % tokens, set all premium flags', p_user_id, p_tokens_added;
END;
$$;

-- Recreate check_user_premium_status with fixed search path
CREATE OR REPLACE FUNCTION check_user_premium_status(p_user_id text)
RETURNS TABLE(
  user_id text,
  paid_tokens_balance bigint,
  tokens_balance bigint,
  messages_remaining integer,
  is_premium boolean,
  is_paid boolean,
  is_paid_user boolean,
  current_tier text,
  diagnosis text
)
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_profile RECORD;
  v_max_tokens BIGINT;
  v_diagnosis TEXT;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      p_user_id, 
      0::BIGINT, 0::BIGINT, 0::INTEGER,
      FALSE, FALSE, FALSE,
      'not_found'::TEXT,
      'User does not exist'::TEXT;
    RETURN;
  END IF;
  
  v_max_tokens := GREATEST(
    COALESCE(v_profile.paid_tokens_balance, 0),
    COALESCE(v_profile.tokens_balance, 0),
    COALESCE(v_profile.messages_remaining, 0)
  );
  
  -- Determine diagnosis
  IF v_max_tokens > 0 THEN
    IF v_profile.is_premium = TRUE AND 
       v_profile.is_paid = TRUE AND 
       v_profile.current_tier = 'premium' THEN
      v_diagnosis := '✅ OK: Premium access correctly configured';
    ELSE
      v_diagnosis := '⚠️ ISSUE: Has tokens but premium flags not set';
    END IF;
  ELSE
    IF v_profile.is_premium = TRUE OR v_profile.current_tier = 'premium' THEN
      v_diagnosis := '⚠️ ISSUE: Premium flags set but no tokens';
    ELSE
      v_diagnosis := '✅ OK: Free tier user';
    END IF;
  END IF;
  
  RETURN QUERY SELECT
    v_profile.id::TEXT,
    COALESCE(v_profile.paid_tokens_balance, 0),
    COALESCE(v_profile.tokens_balance, 0),
    COALESCE(v_profile.messages_remaining, 0),
    COALESCE(v_profile.is_premium, FALSE),
    COALESCE(v_profile.is_paid, FALSE),
    COALESCE(v_profile.is_paid_user, FALSE),
    COALESCE(v_profile.current_tier, 'free'),
    v_diagnosis;
END;
$$;

-- ============================================================
-- PART 4: RECREATE TRIGGERS
-- ============================================================

CREATE TRIGGER trigger_auto_assign_free_tier
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_free_tier();

CREATE TRIGGER trigger_auto_sync_premium_flags
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_premium_flags();
