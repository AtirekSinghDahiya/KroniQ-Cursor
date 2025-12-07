-- Fix token allocation for new users - final version
-- This ensures first 105 users get 5.15M tokens (150k free + 5M paid)

-- Reset counter to ensure new users get bonus tokens
UPDATE promotional_user_counter SET first_101_count = 0 WHERE id = 1;

-- Update the trigger function to properly allocate tokens
CREATE OR REPLACE FUNCTION unified_profile_initialization()
RETURNS TRIGGER AS $$
DECLARE
  v_current_count INTEGER;
  v_should_grant_bonus BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '🚀 Starting profile initialization for user: %', NEW.id;

  -- ========================================================================
  -- STEP 1: Set base values (all users get these)
  -- ========================================================================

  NEW.free_tokens_balance := 150000;
  NEW.paid_tokens_balance := 0;
  NEW.tokens_balance := 150000;
  NEW.daily_tokens_remaining := 5000;
  NEW.daily_token_limit := 5000;
  NEW.monthly_token_limit := 150000;
  NEW.current_tier := 'free';
  NEW.is_paid := false;
  NEW.is_premium := false;
  NEW.last_reset_date := CURRENT_DATE;
  NEW.last_token_refresh := NOW();

  RAISE NOTICE '✅ Set base tokens: %', 150000;

  -- ========================================================================
  -- STEP 2: Check for First 105 Bonus (atomic check and grant)
  -- ========================================================================

  BEGIN
    -- Atomically increment counter for users within first 105
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
      NEW.paid_tokens_balance := 5000000;  -- 5M in paid balance
      NEW.tokens_balance := 5150000;  -- 5.15M total
      -- free_tokens_balance stays at 150k

      -- Upgrade to premium
      NEW.is_premium := true;
      NEW.is_paid := true;
      NEW.current_tier := 'premium';

      -- Log to promotional_users
      BEGIN
        INSERT INTO promotional_users (user_id, campaign_id, tokens_awarded, activated_at)
        VALUES (NEW.id, 'first-105-users', 5000000, NOW())
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS unified_profile_init_trigger ON profiles;
CREATE TRIGGER unified_profile_init_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION unified_profile_initialization();

-- Fix any existing users who should have premium access
DO $$
DECLARE
  v_user_record RECORD;
  v_fixed_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🔧 Fixing existing users with incorrect token allocation...';

  -- Find users who signed up recently and should have premium access
  FOR v_user_record IN
    SELECT p.id, p.tokens_balance, p.created_at
    FROM profiles p
    WHERE p.created_at > '2024-12-01'
    AND p.tokens_balance < 1000000  -- Less than 1M tokens (should have 5.15M)
    ORDER BY p.created_at ASC
    LIMIT 105
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
    RAISE NOTICE '✅ Fixed user % (was: %, now: 5.15M)', v_user_record.id, v_user_record.tokens_balance;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ TOKEN ALLOCATION FIX COMPLETE';
  RAISE NOTICE '  🔧 Fixed % existing users', v_fixed_count;
  RAISE NOTICE '  🔄 Counter reset to 0';
  RAISE NOTICE '  ✅ Next 105 users will get 5.15M tokens each';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;
