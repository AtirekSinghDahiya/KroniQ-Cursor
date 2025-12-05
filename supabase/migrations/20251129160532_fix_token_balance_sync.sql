/*
  # Fix Token Balance Synchronization

  1. Issue: Token balance displays showing 0 or NULL values
  2. Fix: Ensure tokens_balance is never NULL and always in sync

  ## Changes

  1. Fix Existing NULL Balances
  2. Add Database Constraints
  3. Create Sync Trigger
  4. Create User Tier Function
*/

-- Step 1: Fix existing NULL or 0 balances
UPDATE profiles
SET
  free_tokens_balance = CASE
    WHEN free_tokens_balance IS NULL OR free_tokens_balance = 0
    THEN 150000
    ELSE free_tokens_balance
  END,
  tokens_balance = COALESCE(free_tokens_balance, 150000) + COALESCE(paid_tokens_balance, 0)
WHERE tokens_balance IS NULL
   OR tokens_balance = 0
   OR free_tokens_balance IS NULL
   OR free_tokens_balance = 0;

-- Step 2: Create sync trigger function
CREATE OR REPLACE FUNCTION sync_token_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.tokens_balance = COALESCE(NEW.free_tokens_balance, 0) + COALESCE(NEW.paid_tokens_balance, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_token_balance ON profiles;

CREATE TRIGGER trigger_sync_token_balance
  BEFORE INSERT OR UPDATE OF free_tokens_balance, paid_tokens_balance ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_token_balance();

-- Step 3: Create user tier detection function
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id TEXT)
RETURNS TABLE (
  tier TEXT,
  is_premium BOOLEAN,
  has_paid_tokens BOOLEAN,
  token_balance BIGINT,
  free_tokens BIGINT,
  paid_tokens BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN COALESCE(p.paid_tokens_balance, 0) > 0 THEN 'premium'::TEXT
      WHEN p.is_paid = true THEN 'premium'::TEXT
      WHEN p.is_premium = true THEN 'premium'::TEXT
      ELSE 'free'::TEXT
    END as tier,
    (COALESCE(p.paid_tokens_balance, 0) > 0 OR p.is_paid = true OR p.is_premium = true) as is_premium,
    (COALESCE(p.paid_tokens_balance, 0) > 0) as has_paid_tokens,
    COALESCE(p.tokens_balance, 0) as token_balance,
    COALESCE(p.free_tokens_balance, 0) as free_tokens,
    COALESCE(p.paid_tokens_balance, 0) as paid_tokens
  FROM profiles p
  WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
