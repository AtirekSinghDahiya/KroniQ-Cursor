/*
  # Add Flexible Token Pack Options

  ## Summary
  Adds multiple token pack options (Micro, Mini, Standard, Power, Pro) with clear
  messaging about rollover for paid packs vs. no rollover for free pack.

  ## Changes
  1. Add new token pack options to token_packs table
  2. Clear distinction: Free pack = no rollover, Paid packs = rollover allowed

  ## Token Pack Pricing
  - Micro: 10K tokens = $2 (0.2¢ per 1K)
  - Mini: 25K tokens = $4 (0.16¢ per 1K)
  - Standard: 55K tokens (50K + 5K bonus) = $8 (0.145¢ per 1K) - POPULAR
  - Power: 115K tokens (100K + 15K bonus) = $16 (0.139¢ per 1K)
  - Pro: 300K tokens (250K + 50K bonus) = $40 (0.133¢ per 1K)

  ## Security
  No security changes - existing RLS policies apply
*/

-- Remove old token packs first
DELETE FROM token_packs WHERE TRUE;

-- Insert new token packs
INSERT INTO token_packs (name, tokens, bonus_tokens, price_usd, active)
VALUES
  ('Micro Pack', 10000, 0, 2.00, true),
  ('Mini Pack', 25000, 0, 4.00, true),
  ('Standard Pack', 50000, 5000, 8.00, true),
  ('Power Pack', 100000, 15000, 16.00, true),
  ('Pro Pack', 250000, 50000, 40.00, true);
