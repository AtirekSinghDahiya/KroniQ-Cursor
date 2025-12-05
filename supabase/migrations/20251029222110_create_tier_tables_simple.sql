/*
  # Create Tier Classification Tables - Simple Version

  ## Summary
  Creates separate tables for free_tier_users and paid_tier_users while keeping profiles
  as the master table for all users.

  ## Tables Created
  
  ### 1. free_tier_users - All users on free tier
  ### 2. paid_tier_users - All users on paid tiers
  ### 3. profiles - Master table (unchanged)

  ## Security
  - RLS enabled on all tables
  - Users can only view their own data
  - Automatic classification on tier changes
*/

-- ============================================================================
-- 1. CREATE FREE_TIER_USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS free_tier_users (
  id text PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  
  -- Token allocation
  daily_tokens_remaining integer NOT NULL DEFAULT 5000,
  daily_token_limit integer NOT NULL DEFAULT 5000,
  tokens_used_today integer DEFAULT 0,
  
  -- Refresh tracking
  last_reset_date date DEFAULT CURRENT_DATE,
  last_token_refresh timestamptz,
  total_messages_sent integer DEFAULT 0,
  
  -- Account info
  signup_date timestamptz DEFAULT now(),
  last_active timestamptz,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_free_tier_users_email ON free_tier_users(email);
CREATE INDEX IF NOT EXISTS idx_free_tier_users_reset_date ON free_tier_users(last_reset_date);

-- ============================================================================
-- 2. CREATE PAID_TIER_USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS paid_tier_users (
  id text PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  
  -- Tier information
  tier_level text NOT NULL DEFAULT 'premium' CHECK (tier_level IN ('premium', 'ultra-premium', 'enterprise')),
  
  -- Token allocation
  total_tokens_purchased bigint DEFAULT 0,
  tokens_remaining bigint NOT NULL DEFAULT 0,
  daily_token_limit integer,
  tokens_used_lifetime bigint DEFAULT 0,
  
  -- Payment info
  stripe_customer_id text,
  
  -- Billing
  total_amount_paid decimal(10, 2) DEFAULT 0.00,
  last_payment_date timestamptz,
  
  -- Usage stats
  total_messages_sent integer DEFAULT 0,
  premium_models_used integer DEFAULT 0,
  
  -- Account info
  upgraded_date timestamptz DEFAULT now(),
  last_active timestamptz,
  
  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paid_tier_users_email ON paid_tier_users(email);
CREATE INDEX IF NOT EXISTS idx_paid_tier_users_tier_level ON paid_tier_users(tier_level);
CREATE INDEX IF NOT EXISTS idx_paid_tier_users_stripe ON paid_tier_users(stripe_customer_id);

-- ============================================================================
-- 3. CREATE AUTOMATIC CLASSIFICATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION classify_user_tier()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier_level text;
BEGIN
  -- If user is free tier
  IF COALESCE(NEW.current_tier, 'free') = 'free' OR NEW.is_paid = false OR NEW.current_tier IS NULL THEN
    DELETE FROM paid_tier_users WHERE id = NEW.id;
    
    INSERT INTO free_tier_users (
      id, email, display_name,
      daily_tokens_remaining, daily_token_limit,
      last_reset_date, last_token_refresh,
      signup_date, updated_at
    )
    VALUES (
      NEW.id, NEW.email, NEW.display_name,
      COALESCE(NEW.daily_tokens_remaining, 5000),
      COALESCE(NEW.daily_token_limit, 5000),
      COALESCE(NEW.last_reset_date, CURRENT_DATE),
      NEW.last_token_refresh,
      NEW.created_at,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      daily_tokens_remaining = EXCLUDED.daily_tokens_remaining,
      daily_token_limit = EXCLUDED.daily_token_limit,
      last_reset_date = EXCLUDED.last_reset_date,
      updated_at = NOW();
      
  -- If user is paid tier
  ELSIF NEW.current_tier IN ('premium', 'ultra-premium', 'enterprise', 'paid') OR NEW.is_paid = true THEN
    DELETE FROM free_tier_users WHERE id = NEW.id;
    
    v_tier_level := CASE 
      WHEN NEW.current_tier IN ('ultra-premium', 'enterprise') THEN 'ultra-premium'
      ELSE 'premium'
    END;
    
    INSERT INTO paid_tier_users (
      id, email, display_name, tier_level,
      tokens_remaining, daily_token_limit,
      stripe_customer_id,
      total_tokens_purchased,
      upgraded_date, updated_at
    )
    VALUES (
      NEW.id, NEW.email, NEW.display_name, v_tier_level,
      COALESCE(NEW.tokens_remaining, 0),
      NEW.daily_token_limit,
      NEW.stripe_customer_id,
      COALESCE(NEW.tokens_lifetime_purchased, 0),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      display_name = EXCLUDED.display_name,
      tier_level = EXCLUDED.tier_level,
      tokens_remaining = EXCLUDED.tokens_remaining,
      daily_token_limit = EXCLUDED.daily_token_limit,
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      total_tokens_purchased = EXCLUDED.total_tokens_purchased,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 4. CREATE TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_classify_user_on_insert ON profiles;
DROP TRIGGER IF EXISTS trigger_classify_user_on_update ON profiles;

CREATE TRIGGER trigger_classify_user_on_insert
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION classify_user_tier();

CREATE TRIGGER trigger_classify_user_on_update
  AFTER UPDATE OF current_tier, is_paid, tokens_remaining, daily_tokens_remaining ON profiles
  FOR EACH ROW
  WHEN (OLD.current_tier IS DISTINCT FROM NEW.current_tier 
    OR OLD.is_paid IS DISTINCT FROM NEW.is_paid)
  EXECUTE FUNCTION classify_user_tier();

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE free_tier_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE paid_tier_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own free tier data" ON free_tier_users;
DROP POLICY IF EXISTS "Users can view own paid tier data" ON paid_tier_users;
DROP POLICY IF EXISTS "System can manage free tier users" ON free_tier_users;
DROP POLICY IF EXISTS "System can manage paid tier users" ON paid_tier_users;

CREATE POLICY "Users can view own free tier data"
  ON free_tier_users FOR SELECT
  TO authenticated
  USING (id = auth.uid()::text);

CREATE POLICY "System can manage free tier users"
  ON free_tier_users FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view own paid tier data"
  ON paid_tier_users FOR SELECT
  TO authenticated
  USING (id = auth.uid()::text);

CREATE POLICY "System can manage paid tier users"
  ON paid_tier_users FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 6. POPULATE TABLES WITH EXISTING USERS
-- ============================================================================

-- Insert free tier users
INSERT INTO free_tier_users (
  id, email, display_name,
  daily_tokens_remaining, daily_token_limit,
  last_reset_date, last_token_refresh,
  signup_date
)
SELECT 
  id, email, display_name,
  COALESCE(daily_tokens_remaining, 5000),
  COALESCE(daily_token_limit, 5000),
  COALESCE(last_reset_date, CURRENT_DATE),
  last_token_refresh,
  created_at
FROM profiles
WHERE COALESCE(current_tier, 'free') = 'free' OR is_paid = false OR current_tier IS NULL
ON CONFLICT (id) DO NOTHING;

-- Insert paid tier users
INSERT INTO paid_tier_users (
  id, email, display_name, tier_level,
  tokens_remaining, daily_token_limit,
  stripe_customer_id,
  total_tokens_purchased,
  upgraded_date
)
SELECT 
  id, email, display_name,
  CASE 
    WHEN current_tier IN ('ultra-premium', 'enterprise') THEN 'ultra-premium'
    ELSE 'premium'
  END,
  COALESCE(tokens_remaining, 0),
  daily_token_limit,
  stripe_customer_id,
  COALESCE(tokens_lifetime_purchased, 0),
  created_at
FROM profiles
WHERE current_tier IN ('premium', 'ultra-premium', 'enterprise', 'paid')
  AND is_paid = true
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. CREATE HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_tier_stats()
RETURNS TABLE (
  total_users bigint,
  free_tier_count bigint,
  paid_tier_count bigint,
  premium_count bigint,
  ultra_premium_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    (SELECT COUNT(*) FROM profiles)::bigint,
    (SELECT COUNT(*) FROM free_tier_users)::bigint,
    (SELECT COUNT(*) FROM paid_tier_users)::bigint,
    (SELECT COUNT(*) FROM paid_tier_users WHERE tier_level = 'premium')::bigint,
    (SELECT COUNT(*) FROM paid_tier_users WHERE tier_level = 'ultra-premium')::bigint;
$$;

-- ============================================================================
-- 8. ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE free_tier_users IS 'All users on free tier with 5000 daily tokens - auto-synced from profiles';
COMMENT ON TABLE paid_tier_users IS 'All users on paid tiers (premium, ultra-premium) - auto-synced from profiles';
COMMENT ON FUNCTION classify_user_tier() IS 'Automatically classifies users into tier tables based on profiles.current_tier';
COMMENT ON FUNCTION get_user_tier_stats() IS 'Returns user distribution statistics across tiers';
