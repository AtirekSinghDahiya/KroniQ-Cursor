/*
  # Fix First 200 Users Token Allocation Bug
  
  ## Issue
  - New users in first 200 slots getting 150k instead of 5.15M tokens
  - Token display showing incorrect values (sidebar vs draggable)
  - Promotional bonus not being applied correctly
  
  ## Root Cause
  - Previous migration was ADDING bonus to all balances instead of SETTING them correctly
  - tokens_balance should be 5.15M (150k base + 5M bonus)
  - paid_tokens_balance should be 5M (the bonus)
  - free_tokens_balance should be 150k (the base)
  
  ## Fix
  - Correct the trigger logic to SET balances properly
  - Grant 5M to paid_tokens_balance only
  - Keep free_tokens_balance at 150k
  - Set tokens_balance to 5.15M total
*/

-- Fix the unified_profile_initialization trigger
CREATE OR REPLACE FUNCTION unified_profile_initialization()
RETURNS TRIGGER AS $$
DECLARE
  v_current_count INTEGER;
  v_should_grant_bonus BOOLEAN := FALSE;
  v_base_tokens BIGINT := 150000;
  v_bonus_tokens BIGINT := 5000000;
  v_total_tokens BIGINT;
BEGIN
  RAISE NOTICE '🚀 Starting profile initialization for user: %', NEW.id;

  -- ========================================================================
  -- STEP 1: Set base values (all users get these)
  -- ========================================================================
  
  NEW.free_tokens_balance := v_base_tokens;
  NEW.paid_tokens_balance := 0;
  NEW.tokens_balance := v_base_tokens;
  NEW.daily_tokens_remaining := 5000;
  NEW.daily_token_limit := 5000;
  NEW.monthly_token_limit := v_base_tokens;
  NEW.current_tier := 'free';
  NEW.is_paid := false;
  NEW.is_premium := false;
  NEW.last_reset_date := CURRENT_DATE;
  NEW.last_token_refresh := NOW();
  
  RAISE NOTICE '✅ Set base tokens: %', v_base_tokens;

  -- ========================================================================
  -- STEP 2: Check for First 200 Bonus (atomic check and grant)
  -- ========================================================================
  
  BEGIN
    -- Atomically increment counter for users within first 200
    UPDATE promotional_user_counter
    SET
      first_101_count = first_101_count + 1,
      last_updated = NOW()
    WHERE id = 1 AND first_101_count < 200
    RETURNING first_101_count INTO v_current_count;

    -- If update succeeded, user is within first 200
    IF FOUND AND v_current_count <= 200 THEN
      v_should_grant_bonus := TRUE;
      RAISE NOTICE '🎉 User % qualifies for First 200 bonus! Position: %', NEW.id, v_current_count;
      
      -- Grant bonus CORRECTLY
      NEW.paid_tokens_balance := v_bonus_tokens;  -- 5M in paid balance
      NEW.tokens_balance := v_base_tokens + v_bonus_tokens;  -- 5.15M total
      -- free_tokens_balance stays at 150k
      
      -- Upgrade to premium
      NEW.is_premium := true;
      NEW.is_paid := true;
      NEW.current_tier := 'premium';
      
      -- Log to promotional_users
      BEGIN
        INSERT INTO promotional_users (user_id, campaign_id, tokens_awarded, activated_at)
        VALUES (NEW.id, 'first-200-users', v_bonus_tokens, NOW())
        ON CONFLICT (user_id, campaign_id) DO NOTHING;
        
        RAISE NOTICE '✅ Logged promotional bonus for user %', NEW.id;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Could not log promotional bonus: %', SQLERRM;
      END;
      
      RAISE NOTICE '✅ Granted 5M bonus tokens! Total: % (Free: %, Paid: %)', 
        NEW.tokens_balance, NEW.free_tokens_balance, NEW.paid_tokens_balance;
    ELSE
      RAISE NOTICE 'ℹ️ User % not in First 200. Current count: %', NEW.id, COALESCE(v_current_count, 200);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '⚠️ Error checking First 200 bonus: %', SQLERRM;
      -- Continue with base allocation
  END;

  -- ========================================================================
  -- STEP 3: Final summary
  -- ========================================================================
  
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ Profile initialized for user: %', NEW.id;
  RAISE NOTICE '   📊 Total Tokens: %', NEW.tokens_balance;
  RAISE NOTICE '   🆓 Free Tokens: %', NEW.free_tokens_balance;
  RAISE NOTICE '   💎 Paid Tokens: %', NEW.paid_tokens_balance;
  RAISE NOTICE '   🏆 Tier: %', NEW.current_tier;
  RAISE NOTICE '   🎁 First 200 Bonus: %', CASE WHEN v_should_grant_bonus THEN 'YES ✅' ELSE 'NO' END;
  RAISE NOTICE '═══════════════════════════════════════════════════════════';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS unified_profile_init_trigger ON profiles;
CREATE TRIGGER unified_profile_init_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION unified_profile_initialization();

-- ============================================================================
-- Fix existing users who got wrong allocation
-- ============================================================================

DO $$
DECLARE
  v_user_record RECORD;
  v_fixed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🔧 Fixing existing users with incorrect token allocation...';
  
  -- Find users in promotional_users who should have 5M but don't
  FOR v_user_record IN 
    SELECT pu.user_id, p.tokens_balance, p.paid_tokens_balance, p.free_tokens_balance
    FROM promotional_users pu
    JOIN profiles p ON p.id = pu.user_id
    WHERE pu.campaign_id = 'first-200-users'
    AND pu.tokens_awarded = 5000000
    AND (
      p.paid_tokens_balance < 5000000 
      OR p.tokens_balance < 5000000
      OR p.free_tokens_balance != 150000
    )
  LOOP
    -- Fix their balances
    UPDATE profiles
    SET
      free_tokens_balance = 150000,
      paid_tokens_balance = 5000000,
      tokens_balance = 5150000,
      is_premium = true,
      is_paid = true,
      current_tier = 'premium'
    WHERE id = v_user_record.user_id;
    
    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE '✅ Fixed user % (was: % total, now: 5.15M)', 
      v_user_record.user_id, v_user_record.tokens_balance;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ TOKEN ALLOCATION FIX COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '  🔧 Fixed % existing users', v_fixed_count;
  RAISE NOTICE '  ✅ Trigger updated for new signups';
  RAISE NOTICE '  📊 Correct allocation: 5.15M total (150k free + 5M paid)';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
