/*
  # Update Token Packs to Correct Amounts Based on Cost Structure

  ## Summary
  Updates token pack amounts to reflect actual cost structure where:
  - Cost per 1M tokens: $1.10
  - Average message: ~500 tokens
  - Target: 50% profit margin on each pack

  ## Changes
  Updates token_packs table with correct token amounts:
  - Starter: 900K tokens (~1,800 messages) = $2
  - Popular: 2.25M tokens (~4,500 messages) = $5
  - Power User: 4.5M tokens (~9,000 messages) = $10
  - Pro: 9M tokens (~18,000 messages) = $20

  ## Pricing Calculation
  Each pack gives tokens worth 2x the price (50% profit margin):
  - $2 pack: $1 cost → 909K tokens (rounded to 900K)
  - $5 pack: $2.50 cost → 2.27M tokens (rounded to 2.25M)
  - $10 pack: $5 cost → 4.54M tokens (rounded to 4.5M)
  - $20 pack: $10 cost → 9.09M tokens (rounded to 9M)

  ## Security
  No security changes - existing RLS policies apply
*/

-- Remove existing token packs
DELETE FROM token_packs WHERE TRUE;

-- Insert new token packs with correct amounts
INSERT INTO token_packs (name, tokens, bonus_tokens, price_usd, active, description)
VALUES
  ('Starter', 900000, 0, 2.00, true, 'Perfect for trying out the platform - ~1,800 messages'),
  ('Popular', 2250000, 0, 5.00, true, 'Most popular choice - ~4,500 messages'),
  ('Power User', 4500000, 0, 10.00, true, 'For heavy users - ~9,000 messages'),
  ('Pro', 9000000, 0, 20.00, true, 'Maximum value - ~18,000 messages');

-- Mark Popular pack as popular
UPDATE token_packs SET description = 'POPULAR: ' || description WHERE name = 'Popular';
