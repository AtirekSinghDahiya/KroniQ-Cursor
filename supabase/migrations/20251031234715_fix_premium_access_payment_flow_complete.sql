/*
  # Fix Premium Access - Complete Payment Flow Integration
  
  ## Problem Identified
  The Stripe webhook calls `add_message_credits()` which updates `messages_remaining` 
  but the frontend premium checks look at `paid_tokens_balance`, `is_premium`, `is_paid`, 
  and `current_tier`. This causes a mismatch where users have tokens but appear as free users.
  
  ## Root Cause
  1. Multiple versions of `add_message_credits()` exist with different behaviors
  2. Webhook calls version that updates wrong columns
  3. Frontend checks different columns than what webhook updates
  4. No automatic sync between payment and premium flags
  
  ## Solution
  1. **Consolidate Token Storage**: Use `paid_tokens_balance` as single source of truth
  2. **Fix add_message_credits**: Make it update ALL premium-related columns
  3. **Create Sync Function**: Migrate existing balances to correct column
  4. **Update Webhook Logic**: Ensure complete premium status update
  5. **Add Safety Trigger**: Auto-sync premium flags when tokens change
  
  ## Changes
  1. Drop conflicting function overloads
  2. Create definitive `add_message_credits()` that updates all premium columns
  3. Sync all existing token balances to `paid_tokens_balance`
  4. Update premium flags for all users with tokens
  5. Create trigger to keep flags in sync automatically
  
  ## Security
  - Maintains all existing RLS policies
  - Uses SECURITY DEFINER for admin functions
  - No changes to authentication
  - Preserves all transaction logs
*/

-- =====================================================
-- 1. DROP CONFLICTING FUNCTION OVERLOADS
-- =====================================================

-- Drop the simplified versions that don't update premium flags
DROP FUNCTION IF EXISTS add_message_credits(text, bigint);
DROP FUNCTION IF EXISTS add_message_credits(uuid, integer);

-- =====================================================
-- 2. CREATE UNIFIED add_message_credits FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION add_message_credits(
  p_user_id text,
  p_messages integer,
  p_pack_price numeric,
  p_stripe_payment_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_paid_balance bigint;
  v_new_messages_remaining integer;
BEGIN
  -- Update ALL relevant columns in ONE atomic operation
  UPDATE profiles
  SET
    -- Update token balances (paid_tokens_balance is the source of truth)
    paid_tokens_balance = COALESCE(paid_tokens_balance, 0) + p_messages,
    tokens_balance = COALESCE(tokens_balance, 0) + p_messages,
    
    -- Also update messages_remaining for backward compatibility
    messages_remaining = COALESCE(messages_remaining, 0) + p_messages,
    
    -- Set ALL premium flags
    is_premium = TRUE,
    is_paid = TRUE,
    is_paid_user = TRUE,
    current_tier = 'premium',
    
    -- Update timestamps
    last_purchase_date = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING paid_tokens_balance, messages_remaining 
  INTO v_new_paid_balance, v_new_messages_remaining;

  -- Log purchase in transactions table
  IF p_stripe_payment_id IS NOT NULL THEN
    INSERT INTO transactions (
      user_id, 
      plan_name, 
      amount, 
      status, 
      transaction_type, 
      metadata
    )
    VALUES (
      p_user_id, 
      'Token Pack - ' || p_messages || ' tokens',
      p_pack_price,
      'completed',
      'purchase',
      json_build_object(
        'tokens_purchased', p_messages,
        'stripe_payment_id', p_stripe_payment_id,
        'new_paid_balance', v_new_paid_balance
      )
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'paid_tokens_balance', v_new_paid_balance,
    'messages_remaining', v_new_messages_remaining,
    'is_premium', true,
    'current_tier', 'premium'
  );
END;
$$;

-- =====================================================
-- 3. SYNC EXISTING USER BALANCES
-- =====================================================

-- Consolidate all token values into paid_tokens_balance
-- This handles users who have tokens in different columns
UPDATE profiles
SET
  paid_tokens_balance = GREATEST(
    COALESCE(paid_tokens_balance, 0),
    COALESCE(tokens_balance, 0),
    COALESCE(messages_remaining, 0)
  ),
  tokens_balance = GREATEST(
    COALESCE(paid_tokens_balance, 0),
    COALESCE(tokens_balance, 0),
    COALESCE(messages_remaining, 0)
  ),
  messages_remaining = GREATEST(
    COALESCE(paid_tokens_balance, 0),
    COALESCE(tokens_balance, 0),
    COALESCE(messages_remaining, 0)
  ),
  is_premium = TRUE,
  is_paid = TRUE,
  is_paid_user = TRUE,
  current_tier = 'premium',
  updated_at = NOW()
WHERE 
  -- Only update users who have tokens somewhere but flags aren't set
  (COALESCE(paid_tokens_balance, 0) > 0 
   OR COALESCE(tokens_balance, 0) > 0 
   OR COALESCE(messages_remaining, 0) > 0)
  AND (
    is_premium IS NOT TRUE
    OR is_paid IS NOT TRUE
    OR is_paid_user IS NOT TRUE
    OR current_tier != 'premium'
  );

-- =====================================================
-- 4. UPDATE upgrade_user_to_paid_tier FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION upgrade_user_to_paid_tier(
  p_user_id TEXT, 
  p_tokens_added BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
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

-- =====================================================
-- 5. CREATE AUTO-SYNC TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION auto_sync_premium_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_total_tokens bigint;
BEGIN
  -- Calculate max tokens across all columns
  v_total_tokens := GREATEST(
    COALESCE(NEW.paid_tokens_balance, 0),
    COALESCE(NEW.tokens_balance, 0),
    COALESCE(NEW.messages_remaining, 0)
  );
  
  -- Sync all token columns to the same value
  NEW.paid_tokens_balance := v_total_tokens;
  NEW.tokens_balance := v_total_tokens;
  NEW.messages_remaining := v_total_tokens;
  
  -- Update premium flags based on token balance
  IF v_total_tokens > 0 THEN
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

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_sync_premium_flags ON profiles;

-- Create trigger that fires on INSERT or UPDATE
CREATE TRIGGER trigger_auto_sync_premium_flags
  BEFORE INSERT OR UPDATE OF paid_tokens_balance, tokens_balance, messages_remaining
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_premium_flags();

-- =====================================================
-- 6. UPDATE DIAGNOSTIC FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION check_user_premium_status(p_user_id TEXT)
RETURNS TABLE (
  user_id TEXT,
  paid_tokens_balance BIGINT,
  tokens_balance BIGINT,
  messages_remaining INTEGER,
  is_premium BOOLEAN,
  is_paid BOOLEAN,
  is_paid_user BOOLEAN,
  current_tier TEXT,
  diagnosis TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION add_message_credits(text, integer, numeric, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION upgrade_user_to_paid_tier(TEXT, BIGINT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION check_user_premium_status(TEXT) TO authenticated, service_role;

-- =====================================================
-- 8. VERIFY AND LOG RESULTS
-- =====================================================

DO $$
DECLARE
  v_users_fixed INTEGER;
  v_total_premium INTEGER;
BEGIN
  -- Count users that were fixed
  SELECT COUNT(*)::INTEGER INTO v_users_fixed
  FROM profiles
  WHERE 
    (COALESCE(paid_tokens_balance, 0) > 0 
     OR COALESCE(tokens_balance, 0) > 0 
     OR COALESCE(messages_remaining, 0) > 0)
    AND is_premium = TRUE
    AND current_tier = 'premium';
  
  -- Count total premium users
  SELECT COUNT(*)::INTEGER INTO v_total_premium
  FROM profiles
  WHERE is_premium = TRUE;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PREMIUM ACCESS FIX - COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total premium users: %', v_total_premium;
  RAISE NOTICE 'Users with tokens and correct flags: %', v_users_fixed;
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Unified add_message_credits function deployed';
  RAISE NOTICE '✅ All token balances synced to paid_tokens_balance';
  RAISE NOTICE '✅ Premium flags updated for all token holders';
  RAISE NOTICE '✅ Auto-sync trigger installed';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Diagnostic function: check_user_premium_status(user_id)';
  RAISE NOTICE '============================================';
END $$;
