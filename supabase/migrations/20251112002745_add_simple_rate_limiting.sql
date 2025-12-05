/*
  # Simple Rate Limiting System

  ## Critical Security Fix
  No rate limiting exists, allowing spam and abuse.

  ## Solution
  Create simple rate limiting using existing structure.

  ## Changes
  1. Create rate limit check function
  2. Add rate limiting table if not exists
  3. Simple cleanup function
*/

-- ============================================================================
-- CREATE RATE LIMIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rate_limit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  service TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_user_time 
  ON rate_limit_requests(user_id, service, created_at DESC);

ALTER TABLE rate_limit_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No user access" ON rate_limit_requests;
CREATE POLICY "No user access"
  ON rate_limit_requests FOR ALL
  TO authenticated, anon
  USING (false);

-- ============================================================================
-- RATE LIMIT CHECK FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION check_rate_limit_simple(
  p_user_id TEXT,
  p_service TEXT
) RETURNS JSON AS $$
DECLARE
  v_count_minute INTEGER;
  v_limit_minute INTEGER := 20;
BEGIN
  -- Set limits based on service
  v_limit_minute := CASE p_service
    WHEN 'ai-chat' THEN 20
    WHEN 'image-gen' THEN 10
    WHEN 'video-gen' THEN 5
    ELSE 50
  END;

  -- Count recent requests
  SELECT COUNT(*) INTO v_count_minute
  FROM rate_limit_requests
  WHERE user_id = p_user_id
    AND service = p_service
    AND created_at > now() - INTERVAL '1 minute';

  -- Check limit
  IF v_count_minute >= v_limit_minute THEN
    RETURN json_build_object(
      'allowed', false,
      'error', 'Rate limit exceeded. Please wait before trying again.',
      'limit', v_limit_minute,
      'retry_after', 60
    );
  END IF;

  -- Log request
  INSERT INTO rate_limit_requests (user_id, service)
  VALUES (p_user_id, p_service);

  RETURN json_build_object(
    'allowed', true,
    'remaining', v_limit_minute - v_count_minute - 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CLEANUP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM rate_limit_requests
  WHERE created_at < now() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION check_rate_limit_simple TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_rate_limits TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE '✅ RATE LIMITING ENABLED';
  RAISE NOTICE '════════════════════════════════════════════';
  RAISE NOTICE 'Limits: AI:20/min | Image:10/min | Video:5/min';
  RAISE NOTICE 'Function: check_rate_limit_simple()';
  RAISE NOTICE '════════════════════════════════════════════';
END $$;
