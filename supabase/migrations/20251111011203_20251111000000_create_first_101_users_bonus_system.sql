/*
  # First 101 Users Bonus System

  1. New Tables
    - `promotional_user_counter`
      - Tracks the count of users who have received the first 101 bonus
      - Single row table with atomic counter

  2. Triggers
    - `grant_first_101_bonus`
      - Automatically grants 5,000,000 tokens to first 101 new users
      - Runs on profile creation
      - Uses atomic counter to ensure exactly 101 users get the bonus

  3. Security
    - Counter is protected and only updated by trigger
    - No RLS needed as it's a system table
*/

-- Create promotional counter table
CREATE TABLE IF NOT EXISTS promotional_user_counter (
  id INTEGER PRIMARY KEY DEFAULT 1,
  first_101_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial row
INSERT INTO promotional_user_counter (id, first_101_count)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Create function to grant first 101 bonus
CREATE OR REPLACE FUNCTION grant_first_101_bonus()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  should_grant BOOLEAN := FALSE;
BEGIN
  -- Lock the counter row for update
  SELECT first_101_count INTO current_count
  FROM promotional_user_counter
  WHERE id = 1
  FOR UPDATE;

  -- Check if we're still within first 101 users
  IF current_count < 101 THEN
    should_grant := TRUE;

    -- Increment counter atomically
    UPDATE promotional_user_counter
    SET
      first_101_count = first_101_count + 1,
      last_updated = now()
    WHERE id = 1;

    RAISE NOTICE 'Granting first 101 bonus to user %. Counter: % -> %',
      NEW.id, current_count, current_count + 1;
  ELSE
    RAISE NOTICE 'First 101 promotion ended. User % not eligible.', NEW.id;
  END IF;

  -- Grant bonus if eligible
  IF should_grant THEN
    -- Update profile with 5M tokens
    UPDATE profiles
    SET
      tokens_balance = COALESCE(tokens_balance, 0) + 5000000,
      free_tokens_balance = COALESCE(free_tokens_balance, 0) + 5000000,
      updated_at = now()
    WHERE id = NEW.id;

    RAISE NOTICE 'Granted 5,000,000 tokens to user %', NEW.id;

    -- Log the bonus in a promotional record if promotional_users table exists
    BEGIN
      INSERT INTO promotional_users (user_id, campaign_id, activated_at)
      VALUES (NEW.id, 'first-101-users', now())
      ON CONFLICT DO NOTHING;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not log promotional bonus: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on profile creation
DROP TRIGGER IF EXISTS trigger_grant_first_101_bonus ON profiles;
CREATE TRIGGER trigger_grant_first_101_bonus
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION grant_first_101_bonus();

-- Create view to check promotion status
CREATE OR REPLACE VIEW first_101_promotion_status AS
SELECT
  first_101_count as users_granted,
  101 - first_101_count as remaining_slots,
  CASE
    WHEN first_101_count >= 101 THEN 'ENDED'
    ELSE 'ACTIVE'
  END as status,
  last_updated
FROM promotional_user_counter
WHERE id = 1;

-- Grant read access to authenticated users (so they can check if promo is active)
GRANT SELECT ON first_101_promotion_status TO authenticated;
GRANT SELECT ON first_101_promotion_status TO anon;
