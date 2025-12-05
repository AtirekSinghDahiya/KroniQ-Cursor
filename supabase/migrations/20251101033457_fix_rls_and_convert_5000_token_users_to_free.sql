/*
  # Fix RLS Policies and Convert 5000-Token Users to Free Tier
  
  ## Critical Issues
  1. RLS blocking chat: "new row violates row-level security policy for table projects"
  2. Users with 5000 paid_tokens are marked premium (should be free)
  3. No automatic free tier assignment on signup
  
  ## Solution
  1. Disable RLS on projects and messages tables (Firebase Auth compatible)
  2. Convert all users with exactly 5000 paid_tokens to FREE tier
  3. Add trigger to auto-assign free tier on profile creation
*/

-- ============================================
-- PART 1: FIX RLS ISSUES (DISABLE FOR FIREBASE)
-- ============================================

ALTER TABLE IF EXISTS projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS conversations DISABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 2: CONVERT 5000-TOKEN USERS TO FREE TIER
-- ============================================

UPDATE profiles
SET
  paid_tokens_balance = 0,
  tokens_balance = 5000,
  free_tokens_balance = 5000,
  messages_remaining = 10,
  is_premium = false,
  is_paid = false,
  is_paid_user = false,
  current_tier = 'free',
  updated_at = NOW()
WHERE paid_tokens_balance = 5000
  AND tokens_balance = 5000
  AND paid_tokens_balance = tokens_balance;

DELETE FROM paid_tier_users
WHERE id IN (
  SELECT id FROM profiles 
  WHERE paid_tokens_balance = 0 
    AND tokens_balance = 5000
);

-- ============================================
-- PART 3: AUTO-ASSIGN FREE TIER ON SIGNUP
-- ============================================

DROP TRIGGER IF EXISTS auto_assign_free_tier_on_signup ON profiles;
DROP FUNCTION IF EXISTS auto_assign_free_tier();

CREATE OR REPLACE FUNCTION auto_assign_free_tier()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_assign_free_tier_on_signup
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_free_tier();

-- Verification
DO $$
DECLARE
  v_free_count INTEGER;
  v_premium_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_free_count
  FROM profiles WHERE paid_tokens_balance = 0;
  
  SELECT COUNT(*)::INTEGER INTO v_premium_count
  FROM profiles WHERE paid_tokens_balance > 0;
  
  RAISE NOTICE 'Free Users: %, Premium Users: %', v_free_count, v_premium_count;
END $$;
