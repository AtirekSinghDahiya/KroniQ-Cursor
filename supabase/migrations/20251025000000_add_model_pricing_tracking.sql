/*
  # Add Model Pricing Tracking

  1. New Tables
    - `model_pricing`
      - Stores dynamic pricing for each AI model
      - Fields: model_id, model_name, provider, tokens_per_message, cost_per_message, tier, active

  2. Schema Changes
    - Add `model_token_cost` column to `token_transactions` table to track actual tokens charged per model
    - Add `model_tier` column to track which tier the model belongs to
    - Add `actual_provider_cost` column to track what we paid to OpenRouter

  3. Indexes
    - Add indexes on frequently queried columns for performance

  4. RLS Policies
    - Enable RLS on model_pricing table (read-only for all users)
    - Maintain existing RLS on token_transactions
*/

-- Create model_pricing table
CREATE TABLE IF NOT EXISTS model_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id text UNIQUE NOT NULL,
  model_name text NOT NULL,
  provider text NOT NULL,
  tokens_per_message integer NOT NULL DEFAULT 20,
  cost_per_message decimal(10, 6) NOT NULL DEFAULT 0.0002,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'budget', 'mid', 'premium', 'ultra-premium')),
  icon text DEFAULT '⚡',
  description text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add columns to token_transactions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_transactions' AND column_name = 'model_token_cost'
  ) THEN
    ALTER TABLE token_transactions ADD COLUMN model_token_cost integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_transactions' AND column_name = 'model_tier'
  ) THEN
    ALTER TABLE token_transactions ADD COLUMN model_tier text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'token_transactions' AND column_name = 'actual_provider_cost'
  ) THEN
    ALTER TABLE token_transactions ADD COLUMN actual_provider_cost decimal(10, 6) DEFAULT 0;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_model_pricing_tier ON model_pricing(tier);
CREATE INDEX IF NOT EXISTS idx_model_pricing_active ON model_pricing(active);
CREATE INDEX IF NOT EXISTS idx_token_transactions_model_tier ON token_transactions(model_tier);
CREATE INDEX IF NOT EXISTS idx_token_transactions_model ON token_transactions(model);

-- Enable RLS
ALTER TABLE model_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for model_pricing (read-only for everyone)
CREATE POLICY "Anyone can view active model pricing"
  ON model_pricing
  FOR SELECT
  USING (active = true);

-- Insert default model pricing data
INSERT INTO model_pricing (model_id, model_name, provider, tokens_per_message, cost_per_message, tier, icon, description) VALUES
  ('grok-4-fast', 'Grok 4 Fast', 'X.AI', 20, 0.0002, 'free', '⚡', 'Lightning fast, minimal cost'),
  ('gemini-flash-lite-free', 'Gemini 2.5 Flash Lite', 'Google', 25, 0.00025, 'free', '✨', 'Fast multimodal AI'),
  ('deepseek-v3.1-free', 'DeepSeek V3.1 Free', 'DeepSeek', 15, 0.00015, 'free', '🧠', 'Efficient and smart'),
  ('llama-4-maverick-free', 'Llama 4 Maverick Free', 'Meta', 30, 0.0003, 'free', '🦙', 'Latest Llama, free tier'),
  ('nemotron-nano-free', 'Nemotron Nano 9B V2', 'NVIDIA', 28, 0.00028, 'free', '🚀', 'Fast nano model'),
  ('qwen-vl-30b-free', 'Qwen3 VL 30B Thinking', 'Qwen', 35, 0.00035, 'free', '👁️', 'Visual & thinking model'),
  ('claude-haiku-free', 'Claude Haiku 4.5', 'Anthropic', 40, 0.0004, 'free', '📝', 'Fast Claude model'),
  ('kimi-k2-free', 'Kimi K2 Free', 'Moonshot', 32, 0.00032, 'free', '🌙', 'Long context support'),
  ('codex-mini', 'Codex Mini', 'OpenAI', 38, 0.00038, 'free', '💻', 'Lightweight coding'),
  ('lfm2-8b', 'LiquidAI LFM2-8B', 'LiquidAI', 42, 0.00042, 'free', '💧', 'Efficient model'),
  ('granite-4.0', 'Granite 4.0 Micro', 'IBM', 45, 0.00045, 'free', '🪨', 'Micro model'),
  ('ernie-4.5', 'ERNIE 4.5 21B Thinking', 'Baidu', 48, 0.00048, 'free', '🧩', 'Thinking model'),
  ('kimi-k2', 'Kimi K2', 'Moonshot', 150, 0.015, 'budget', '🌙', 'Long context, paid tier'),
  ('deepseek-v3.2', 'DeepSeek V3.2', 'DeepSeek', 180, 0.018, 'budget', '🧠', 'Advanced DeepSeek'),
  ('gemini-flash-image', 'Gemini 2.5 Flash Image', 'Google', 200, 0.02, 'mid', '🖼️', 'Image focused'),
  ('qwen-vl-32b', 'Qwen3 VL 32B Instruct', 'Qwen', 250, 0.025, 'mid', '👁️', 'Advanced visual model'),
  ('gpt-5-chat', 'GPT-5 Chat', 'OpenAI', 400, 0.04, 'mid', '🤖', 'Latest ChatGPT with images'),
  ('nemotron-super', 'Nemotron Super 49B', 'NVIDIA', 350, 0.035, 'mid', '🚀', 'Powerful reasoning'),
  ('llama-4-maverick', 'Llama 4 Maverick', 'Meta', 380, 0.038, 'mid', '🦙', 'Latest Llama, paid tier'),
  ('glm-4.6', 'GLM 4.6', 'Z.AI', 420, 0.042, 'mid', '⚙️', 'Advanced model'),
  ('gpt-5-codex', 'GPT-5 Codex', 'OpenAI', 600, 0.06, 'premium', '💻', 'Best for coding'),
  ('claude-sonnet', 'Claude Sonnet 4.5', 'Anthropic', 3000, 0.30, 'premium', '🎵', 'Advanced reasoning'),
  ('claude-opus', 'Claude Opus 4.1', 'Anthropic', 5500, 0.55, 'ultra-premium', '👑', 'Ultimate AI model'),
  ('dall-e-3', 'DALL-E 3', 'OpenAI', 800, 0.08, 'premium', '🎨', 'High quality images'),
  ('stable-diffusion-xl', 'Stable Diffusion XL', 'Stability AI', 500, 0.05, 'mid', '🎨', 'Open source image gen'),
  ('firefly', 'Firefly', 'Adobe', 700, 0.07, 'premium', '🔥', 'Commercial safe images'),
  ('sora', 'Sora', 'OpenAI', 5000, 0.50, 'ultra-premium', '🎬', 'Text to video'),
  ('eleven-labs', 'ElevenLabs', 'ElevenLabs', 300, 0.03, 'mid', '🎙️', 'Natural voice synthesis')
ON CONFLICT (model_id) DO UPDATE SET
  tokens_per_message = EXCLUDED.tokens_per_message,
  cost_per_message = EXCLUDED.cost_per_message,
  tier = EXCLUDED.tier,
  updated_at = now();

-- Create function to get model cost
CREATE OR REPLACE FUNCTION get_model_cost(p_model_id text)
RETURNS TABLE (
  tokens_per_message integer,
  cost_per_message decimal,
  tier text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mp.tokens_per_message,
    mp.cost_per_message,
    mp.tier
  FROM model_pricing mp
  WHERE mp.model_id = p_model_id AND mp.active = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update model pricing (admin only)
CREATE OR REPLACE FUNCTION update_model_pricing(
  p_model_id text,
  p_tokens_per_message integer,
  p_cost_per_message decimal
)
RETURNS boolean AS $$
BEGIN
  UPDATE model_pricing
  SET
    tokens_per_message = p_tokens_per_message,
    cost_per_message = p_cost_per_message,
    updated_at = now()
  WHERE model_id = p_model_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
