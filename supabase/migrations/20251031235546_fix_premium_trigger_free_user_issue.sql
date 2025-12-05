/*
  # Fix Auto-Sync Trigger - Free User Issue
  
  ## Problem
  The auto_sync_premium_flags trigger treats ANY tokens as paid tokens, including
  the free daily messages (messages_remaining = 10). This gives free users premium access!
  
  ## Root Cause
  The trigger calculates: v_total_tokens = MAX(paid_tokens_balance, tokens_balance, messages_remaining)
  
  For a new free user:
  - paid_tokens_balance = 0
  - tokens_balance = 5000 (free starter balance)
  - messages_remaining = 10 (free daily messages)
  - MAX = 5000 → Sets is_premium = TRUE ❌ WRONG!
  
  ## Solution
  Premium status should ONLY be based on paid_tokens_balance, not free tokens.
  - paid_tokens_balance > 0 = Premium user
  - paid_tokens_balance = 0 = Free user (regardless of free tokens)
  
  ## Changes
  1. Update trigger to only check paid_tokens_balance for premium status
  2. Don't sync free tokens to paid_tokens_balance
  3. Keep token columns separate with proper semantics
*/

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS trigger_auto_sync_premium_flags ON profiles;

-- Create corrected function that respects free vs paid tokens
CREATE OR REPLACE FUNCTION auto_sync_premium_flags()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_paid_tokens bigint;
BEGIN
  -- ONLY paid_tokens_balance determines premium status
  v_paid_tokens := COALESCE(NEW.paid_tokens_balance, 0);
  
  -- DON'T sync free tokens to paid_tokens_balance
  -- Each column has its own purpose:
  -- - paid_tokens_balance: Purchased tokens (determines premium status)
  -- - tokens_balance: Total available tokens (free + paid)
  -- - messages_remaining: Free daily messages
  
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

-- Recreate trigger with corrected logic
CREATE TRIGGER trigger_auto_sync_premium_flags
  BEFORE INSERT OR UPDATE OF paid_tokens_balance
  ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_sync_premium_flags();

-- Fix any existing users that were incorrectly marked as premium
UPDATE profiles
SET
  is_premium = FALSE,
  is_paid = FALSE,
  is_paid_user = FALSE,
  current_tier = 'free',
  updated_at = NOW()
WHERE 
  COALESCE(paid_tokens_balance, 0) = 0
  AND (is_premium = TRUE OR current_tier = 'premium');

-- Verify paid users still have correct flags
UPDATE profiles
SET
  is_premium = TRUE,
  is_paid = TRUE,
  is_paid_user = TRUE,
  current_tier = 'premium',
  updated_at = NOW()
WHERE 
  COALESCE(paid_tokens_balance, 0) > 0
  AND (is_premium != TRUE OR current_tier != 'premium');

-- Log the results
DO $$
DECLARE
  v_free_users INTEGER;
  v_premium_users INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_free_users
  FROM profiles
  WHERE COALESCE(paid_tokens_balance, 0) = 0;
  
  SELECT COUNT(*)::INTEGER INTO v_premium_users
  FROM profiles
  WHERE COALESCE(paid_tokens_balance, 0) > 0;
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PREMIUM TRIGGER FIX APPLIED';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Free users (paid_tokens = 0): %', v_free_users;
  RAISE NOTICE 'Premium users (paid_tokens > 0): %', v_premium_users;
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Premium status now based ONLY on paid_tokens_balance';
  RAISE NOTICE '✅ Free users keep their free tokens without premium access';
  RAISE NOTICE '✅ Paid users retain premium access';
  RAISE NOTICE '============================================';
END $$;
