/*
  # Update Token Pack Pricing Strategy

  1. Changes
    - Update existing token packs with new pricing (35% margin)
    - Set correct token amounts based on $1 = ~450K tokens conversion
    - Add bonus tokens for larger packs
    - Mark popular pack

  2. New Pricing Structure
    - Micro: $2 = 900K tokens
    - Starter: $5 = 2.25M tokens (Most Popular)
    - Pro: $10 = 4.5M tokens
    - Power: $20 = 10M tokens (with 11% bonus)

  3. Notes
    - Each pack allows flexible model usage
    - Users can use any model, tokens deducted based on model cost
    - Free tier gets 10K tokens per day
*/

-- Update token_packs table with new pricing
UPDATE token_packs
SET
  tokens = 900000,
  bonus_tokens = 0,
  price_usd = 2.00,
  recurring_price_usd = 2.00,
  popular = false,
  updated_at = now()
WHERE name = 'Starter' OR price_usd = 2;

UPDATE token_packs
SET
  tokens = 2250000,
  bonus_tokens = 0,
  price_usd = 5.00,
  recurring_price_usd = 5.00,
  popular = true,
  updated_at = now()
WHERE name = 'Popular' OR price_usd = 5;

UPDATE token_packs
SET
  tokens = 4500000,
  bonus_tokens = 0,
  price_usd = 10.00,
  recurring_price_usd = 10.00,
  popular = false,
  updated_at = now()
WHERE name = 'Pro' OR name = 'Power User' OR price_usd = 10;

UPDATE token_packs
SET
  tokens = 9000000,
  bonus_tokens = 1000000,
  price_usd = 20.00,
  recurring_price_usd = 20.00,
  popular = false,
  updated_at = now()
WHERE price_usd = 20;

-- Insert packs if they don't exist
INSERT INTO token_packs (name, tokens, bonus_tokens, price_usd, recurring_price_usd, popular, active, description)
VALUES
  ('Micro', 900000, 0, 2.00, 2.00, false, true, 'Perfect for trying out premium models'),
  ('Starter', 2250000, 0, 5.00, 5.00, true, true, 'Most popular - great for regular use'),
  ('Pro', 4500000, 0, 10.00, 10.00, false, true, 'For power users who need more'),
  ('Power', 9000000, 1000000, 20.00, 20.00, false, true, 'Maximum value with 11% bonus')
ON CONFLICT (name) DO UPDATE SET
  tokens = EXCLUDED.tokens,
  bonus_tokens = EXCLUDED.bonus_tokens,
  price_usd = EXCLUDED.price_usd,
  recurring_price_usd = EXCLUDED.recurring_price_usd,
  popular = EXCLUDED.popular,
  description = EXCLUDED.description,
  updated_at = now();

-- Update profiles table to set correct free tier daily tokens
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'daily_free_tokens'
  ) THEN
    UPDATE profiles
    SET daily_free_tokens = 10000
    WHERE is_token_user = false OR daily_free_tokens < 10000;
  END IF;
END $$;

-- Add comment explaining the pricing model
COMMENT ON TABLE token_packs IS 'Token packs with 35% profit margin. Users can access all 27 models, with tokens deducted based on per-model costs ranging from 15-5500 tokens per message.';
