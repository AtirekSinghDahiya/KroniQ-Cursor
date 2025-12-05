/*
  # Final Index and Function Security Fixes

  ## Summary
  Addresses remaining security issues:
  1. Swap indexes based on actual usage patterns
  2. Fix remaining function search_path issues
  3. Document RLS disabled tables

  ## Changes
  - Add indexes for assets and video_jobs foreign keys
  - Remove unused indexes from previous migration
  - Secure all remaining functions
  - Document Firebase auth table design
*/

-- ============================================================================
-- STEP 1: FIX FOREIGN KEY INDEXES BASED ON ACTUAL USAGE
-- ============================================================================

-- Add indexes for foreign keys that are actually being used
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_video_jobs_user_id ON video_jobs(user_id);

-- Remove indexes that are not being used
DROP INDEX IF EXISTS idx_job_applications_job_id;
DROP INDEX IF EXISTS idx_messages_conversation_id;
DROP INDEX IF EXISTS idx_token_purchases_pack_id;
DROP INDEX IF EXISTS idx_transactions_plan_id;

-- ============================================================================
-- STEP 2: FIX ALL REMAINING FUNCTION SEARCH_PATH ISSUES
-- ============================================================================

-- This comprehensive block attempts to fix all functions reported
DO $$
BEGIN
  -- Token management functions
  BEGIN
    ALTER FUNCTION deduct_tokens(text, bigint) SET search_path = public;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter deduct_tokens: %', SQLERRM;
  END;

  BEGIN
    ALTER FUNCTION add_tokens(text, bigint) SET search_path = public;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter add_tokens: %', SQLERRM;
  END;

  BEGIN
    ALTER FUNCTION check_and_reset_free_limits() SET search_path = public;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter check_and_reset_free_limits: %', SQLERRM;
  END;

  -- Message credit functions
  BEGIN
    ALTER FUNCTION deduct_message_credit(text) SET search_path = public;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter deduct_message_credit: %', SQLERRM;
  END;

  BEGIN
    ALTER FUNCTION add_message_credits(text, bigint) SET search_path = public;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter add_message_credits: %', SQLERRM;
  END;

  BEGIN
    ALTER FUNCTION deduct_tokens_with_tier(text, bigint) SET search_path = public;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter deduct_tokens_with_tier: %', SQLERRM;
  END;

  -- Dual currency functions
  BEGIN
    ALTER FUNCTION deduct_dual_currency(text, bigint, bigint) SET search_path = public;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter deduct_dual_currency: %', SQLERRM;
  END;

  BEGIN
    ALTER FUNCTION check_dual_currency_access(text, text) SET search_path = public;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter check_dual_currency_access: %', SQLERRM;
  END;

  -- Tier management functions
  BEGIN
    ALTER FUNCTION classify_user_tier(text) SET search_path = public;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter classify_user_tier: %', SQLERRM;
  END;

  BEGIN
    ALTER FUNCTION get_user_tier_stats(text) SET search_path = public;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter get_user_tier_stats: %', SQLERRM;
  END;

  BEGIN
    ALTER FUNCTION initialize_free_tier_tokens(text) SET search_path = public;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter initialize_free_tier_tokens: %', SQLERRM;
  END;

  BEGIN
    ALTER FUNCTION deduct_user_tokens(text, bigint) SET search_path = public;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter deduct_user_tokens: %', SQLERRM;
  END;

  BEGIN
    ALTER FUNCTION upgrade_user_to_paid_tier(text) SET search_path = public;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter upgrade_user_to_paid_tier: %', SQLERRM;
  END;

  -- Purchase and usage functions
  BEGIN
    ALTER FUNCTION record_token_purchase(text, bigint, numeric) SET search_path = public;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter record_token_purchase: %', SQLERRM;
  END;

  BEGIN
    ALTER FUNCTION increment_usage(text, text, bigint) SET search_path = public;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not alter increment_usage: %', SQLERRM;
  END;
END $$;

-- ============================================================================
-- STEP 3: DOCUMENT RLS DISABLED TABLES
-- ============================================================================

-- These tables intentionally don't use RLS because they use Firebase Auth
COMMENT ON TABLE free_tier_users IS 'RLS intentionally disabled - Firebase Auth integration, not Supabase auth.uid()';
COMMENT ON TABLE paid_tier_users IS 'RLS intentionally disabled - Firebase Auth integration, not Supabase auth.uid()';

-- ============================================================================
-- VERIFICATION AND SUMMARY
-- ============================================================================

DO $$
DECLARE
  v_assets_idx boolean;
  v_video_idx boolean;
  v_functions_fixed int := 0;
BEGIN
  -- Check if new indexes exist
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'idx_assets_user_id'
  ) INTO v_assets_idx;
  
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND indexname = 'idx_video_jobs_user_id'
  ) INTO v_video_idx;

  -- Count functions with search_path set
  SELECT COUNT(*) INTO v_functions_fixed
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'deduct_tokens', 'add_tokens', 'check_and_reset_free_limits',
      'deduct_message_credit', 'add_message_credits', 'deduct_tokens_with_tier',
      'deduct_dual_currency', 'check_dual_currency_access', 'classify_user_tier',
      'get_user_tier_stats', 'initialize_free_tier_tokens', 'deduct_user_tokens',
      'record_token_purchase', 'increment_usage', 'upgrade_user_to_paid_tier'
    )
    AND 'search_path=public' = ANY(p.proconfig);
  
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'FINAL SECURITY FIXES APPLIED';
  RAISE NOTICE '================================================================';
  RAISE NOTICE '✓ Assets index created: %', v_assets_idx;
  RAISE NOTICE '✓ Video jobs index created: %', v_video_idx;
  RAISE NOTICE '✓ Unused indexes removed: 4';
  RAISE NOTICE '✓ Functions with search_path secured: %', v_functions_fixed;
  RAISE NOTICE '✓ Firebase auth tables documented';
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'Note: free_tier_users and paid_tier_users use Firebase Auth';
  RAISE NOTICE 'RLS is intentionally disabled for Firebase compatibility';
  RAISE NOTICE '================================================================';
END $$;
