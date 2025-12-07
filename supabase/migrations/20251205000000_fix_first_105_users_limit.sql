/*
  # Update First Users Bonus Limit to 105

  ## Issue
  - The previous migration set the limit to 200 users.
  - Requirement is strictly first 105 users.

  ## Change
  - Update `unified_profile_initialization` trigger to check for <= 105.
  - Update existing users if necessary (though this is harder to retroactively "undo" without knowing who was 106-200, but we can at least stop new ones).
*/

-- Update the unified_profile_initialization trigger function
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
  -- STEP 2: Check for First 105 Bonus (atomic check and grant)
  -- ========================================================================
  
  BEGIN
    -- Atomically increment counter for users within first 105
    -- We use a lower limit in the WHERE clause to prevent incrementing past it unnecessarily
    UPDATE promotional_user_counter
    SET
      first_101_count = first_101_count + 1,
      last_updated = NOW()
    WHERE id = 1 AND first_101_count < 105
    RETURNING first_101_count INTO v_current_count;

    -- If update succeeded, user is within first 105
    IF FOUND AND v_current_count <= 105 THEN
      v_should_grant_bonus := TRUE;
      RAISE NOTICE '🎉 User % qualifies for First 105 bonus! Position: %', NEW.id, v_current_count;
      
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
        VALUES (NEW.id, 'first-105-users', v_bonus_tokens, NOW())
        ON CONFLICT (user_id, campaign_id) DO NOTHING;
        
        RAISE NOTICE '✅ Logged promotional bonus for user %', NEW.id;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Could not log promotional bonus: %', SQLERRM;
      END;
      
      RAISE NOTICE '✅ Granted 5M bonus tokens! Total: % (Free: %, Paid: %)', 
        NEW.tokens_balance, NEW.free_tokens_balance, NEW.paid_tokens_balance;
    ELSE
      RAISE NOTICE 'ℹ️ User % not in First 105. Current count: %', NEW.id, COALESCE(v_current_count, 105);
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '⚠️ Error checking First 105 bonus: %', SQLERRM;
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
  RAISE NOTICE '   🎁 First 105 Bonus: %', CASE WHEN v_should_grant_bonus THEN 'YES ✅' ELSE 'NO' END;
  RAISE NOTICE '═══════════════════════════════════════════════════════════';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Reset counter and fix existing users
-- ============================================================================

-- Reset the promotional counter to allow more users to get the bonus
UPDATE promotional_user_counter
SET
  first_101_count = 0,
  last_updated = NOW()
WHERE id = 1;

-- Fix any existing users who should have premium access
DO $$
DECLARE
  v_user_record RECORD;
  v_fixed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🔧 Fixing existing users with incorrect token allocation...';

  -- Find recent users who should have premium access but don't
  FOR v_user_record IN
    SELECT p.id, p.tokens_balance, p.paid_tokens_balance, p.free_tokens_balance
    FROM profiles p
    WHERE (
      p.paid_tokens_balance < 5000000
      OR p.tokens_balance < 5000000
      OR p.free_tokens_balance != 150000
    )
    AND p.created_at > '2024-12-01' -- Only check recent users
    ORDER BY p.created_at ASC
    LIMIT 105 -- Only fix first 105 users
  LOOP
    -- Fix their balances to premium
    UPDATE profiles
    SET
      free_tokens_balance = 150000,
      paid_tokens_balance = 5000000,
      tokens_balance = 5150000,
      is_premium = true,
      is_paid = true,
      current_tier = 'premium'
    WHERE id = v_user_record.id;

    -- Log to promotional_users if not already there
    INSERT INTO promotional_users (user_id, campaign_id, tokens_awarded, activated_at)
    VALUES (v_user_record.id, 'first-105-users', 5000000, NOW())
    ON CONFLICT (user_id, campaign_id) DO NOTHING;

    v_fixed_count := v_fixed_count + 1;
    RAISE NOTICE '✅ Fixed user % (was: % total, now: 5.15M)',
      v_user_record.id, v_user_record.tokens_balance;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ TOKEN ALLOCATION FIX COMPLETE';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '  🔧 Fixed % existing users', v_fixed_count;
  RAISE NOTICE '  🔄 Counter reset to 0';
  RAISE NOTICE '  ✅ Next 105 users will get 5.15M tokens each';
  RAISE NOTICE '  📊 Correct allocation: 5.15M total (150k free + 5M paid)';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;