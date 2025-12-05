/*
  # Fix Promotional Tokens System - No Premium Model Access
  
  ## Changes
  1. Update unified_profile_initialization trigger
     - Promotional tokens go to free_tokens_balance (NOT paid_tokens_balance)
     - Do NOT set is_premium, is_paid flags for promotional users
     - Keep them as free tier users with bonus tokens
  
  2. This ensures:
     - Promotional users get 5M tokens but CANNOT access paid models
     - Only actual paying customers get premium model access
     - user_type stays 'free' for promotional accounts
  
  ## Security
  - Only paid_tokens_balance grants premium access
  - Promotional tokens are clearly separated
*/

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_unified_profile_init ON profiles;

-- Update the initialization function
CREATE OR REPLACE FUNCTION public.unified_profile_initialization()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
v_current_count INTEGER;
v_should_grant_bonus BOOLEAN := FALSE;
v_base_tokens BIGINT := 150000;
v_bonus_tokens BIGINT := 5000000;
BEGIN
RAISE NOTICE '🚀 Starting unified profile initialization for user: %', NEW.id;

-- ========================================================================
-- STEP 1: Set base token allocation (150k for all users)
-- ========================================================================

IF NEW.tokens_balance IS NULL OR NEW.tokens_balance = 0 THEN
NEW.tokens_balance := v_base_tokens;
RAISE NOTICE '✅ Set tokens_balance to %', v_base_tokens;
END IF;

IF NEW.free_tokens_balance IS NULL OR NEW.free_tokens_balance = 0 THEN
NEW.free_tokens_balance := v_base_tokens;
RAISE NOTICE '✅ Set free_tokens_balance to %', v_base_tokens;
END IF;

IF NEW.paid_tokens_balance IS NULL THEN
NEW.paid_tokens_balance := 0;
RAISE NOTICE '✅ Set paid_tokens_balance to 0';
END IF;

-- Set other defaults
IF NEW.daily_tokens_remaining IS NULL THEN
NEW.daily_tokens_remaining := 5000;
END IF;

IF NEW.daily_token_limit IS NULL THEN
NEW.daily_token_limit := 5000;
END IF;

IF NEW.monthly_token_limit IS NULL THEN
NEW.monthly_token_limit := v_base_tokens;
END IF;

IF NEW.current_tier IS NULL THEN
NEW.current_tier := 'free';
END IF;

IF NEW.is_paid IS NULL THEN
NEW.is_paid := false;
END IF;

IF NEW.is_premium IS NULL THEN
NEW.is_premium := false;
END IF;

IF NEW.user_type IS NULL THEN
NEW.user_type := 'free';
END IF;

IF NEW.last_reset_date IS NULL THEN
NEW.last_reset_date := CURRENT_DATE;
END IF;

IF NEW.last_token_refresh IS NULL THEN
NEW.last_token_refresh := NOW();
END IF;

-- ========================================================================
-- STEP 2: Check and grant First 105 Bonus (TOKENS ONLY, NO PREMIUM ACCESS)
-- ========================================================================

BEGIN
  -- Atomically increment counter and check if user is in first 105
  UPDATE promotional_user_counter
  SET
    first_101_count = first_101_count + 1,
    last_updated = NOW()
  WHERE id = 1 AND first_101_count < 105
  RETURNING first_101_count INTO v_current_count;

  -- Check if update succeeded (user is within first 105)
  IF FOUND AND v_current_count <= 105 THEN
    v_should_grant_bonus := TRUE;

    RAISE NOTICE '🎉 User % is within First 105! User number: %', NEW.id, v_current_count;

    -- CRITICAL CHANGE: Add bonus to FREE tokens, NOT paid tokens
    -- This gives them tokens but KEEPS them as free tier users
    NEW.free_tokens_balance := COALESCE(NEW.free_tokens_balance, 0) + v_bonus_tokens;
    NEW.tokens_balance := COALESCE(NEW.tokens_balance, 0) + v_bonus_tokens;

    -- DO NOT set premium flags - keep as free user
    -- NEW.is_premium := true;  -- REMOVED
    -- NEW.is_paid := true;     -- REMOVED
    -- NEW.current_tier := 'premium';  -- REMOVED
    
    -- They stay as free tier with bonus tokens
    NEW.is_premium := false;
    NEW.is_paid := false;
    NEW.user_type := 'free';
    NEW.current_tier := 'free';

    -- Log in promotional_users table
    BEGIN
      INSERT INTO promotional_users (user_id, campaign_id, tokens_awarded, activated_at)
      VALUES (NEW.id, 'first-105-users', v_bonus_tokens, NOW())
      ON CONFLICT (user_id, campaign_id) DO NOTHING;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not log to promotional_users: %', SQLERRM;
    END;

    RAISE NOTICE '✅ Granted 5,000,000 FREE tokens to user % (First 105 user #%) - FREE TIER ACCESS ONLY', NEW.id, v_current_count;
  ELSE
    RAISE NOTICE 'ℹ️ User % is NOT in First 105. Promotion ended. Total granted: %', NEW.id, v_current_count;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Could not check First 105 bonus: %', SQLERRM;
END;

-- ========================================================================
-- STEP 3: Final validation and logging
-- ========================================================================

RAISE NOTICE '✅ Profile initialization complete for user %', NEW.id;
RAISE NOTICE '   - Total tokens: %', NEW.tokens_balance;
RAISE NOTICE '   - Free tokens: %', NEW.free_tokens_balance;
RAISE NOTICE '   - Paid tokens: %', NEW.paid_tokens_balance;
RAISE NOTICE '   - User type: %', NEW.user_type;
RAISE NOTICE '   - Tier: %', NEW.current_tier;
RAISE NOTICE '   - Is Premium: %', NEW.is_premium;
RAISE NOTICE '   - First 105 Bonus: %', CASE WHEN v_should_grant_bonus THEN 'YES (Free Tier)' ELSE 'NO' END;

RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER trigger_unified_profile_init
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION unified_profile_initialization();
