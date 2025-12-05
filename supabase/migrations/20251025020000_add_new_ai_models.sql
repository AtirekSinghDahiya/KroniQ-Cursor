/*
  # Add New AI Models to Model Pricing

  1. New Models Added
    - Perplexity Sonar (Free) - Web search enabled
    - Perplexity Sonar Pro (Mid) - Pro search with vision
    - Perplexity Sonar Reasoning Pro (Premium) - Advanced reasoning
    - Perplexity Sonar Deep Research (Premium) - Deep research
    - Claude 3 Haiku (Free) - Fast Claude 3
    - Claude Haiku 4.5 (Mid) - Fast Claude 4.5
    - Claude Opus 4 (Ultra-Premium) - Powerful Opus
    - Claude Opus 4.1 (Ultra-Premium) - Ultimate Opus
    - Kimi K2 0905 (Budget) - Latest Kimi

  2. Changes
    - Replace old claude-haiku-free with claude-3-haiku
    - Add all new Perplexity models
    - Add Claude Opus variants
    - Update model mappings
*/

-- Insert new models
INSERT INTO model_pricing (model_id, model_name, provider, tokens_per_message, cost_per_message, tier, icon, description, active) VALUES
  ('perplexity-sonar', 'Perplexity Sonar', 'Perplexity', 45, 0.00045, 'free', '🔍', 'Web search enabled AI', true),
  ('claude-3-haiku', 'Claude 3 Haiku', 'Anthropic', 40, 0.0004, 'free', '📝', 'Fast Claude 3 model', true),
  ('kimi-k2-0905', 'Kimi K2 0905', 'MoonshotAI', 180, 0.018, 'budget', '🌙', 'Latest Kimi model', true),
  ('claude-haiku-4.5', 'Claude Haiku 4.5', 'Anthropic', 200, 0.02, 'mid', '📝', 'Fast Claude 4.5', true),
  ('perplexity-sonar-pro', 'Perplexity Sonar Pro', 'Perplexity', 450, 0.045, 'mid', '🔍', 'Pro web search with vision', true),
  ('perplexity-sonar-reasoning', 'Perplexity Sonar Reasoning Pro', 'Perplexity', 800, 0.08, 'premium', '🧠', 'Advanced reasoning with search', true),
  ('perplexity-sonar-deep', 'Perplexity Sonar Deep Research', 'Perplexity', 1500, 0.15, 'premium', '🔬', 'Deep research capabilities', true),
  ('claude-opus-4', 'Claude Opus 4', 'Anthropic', 5000, 0.50, 'ultra-premium', '👑', 'Powerful Opus model', true),
  ('claude-opus-4.1', 'Claude Opus 4.1', 'Anthropic', 5500, 0.55, 'ultra-premium', '👑', 'Ultimate AI model', true)
ON CONFLICT (model_id) DO UPDATE SET
  model_name = EXCLUDED.model_name,
  tokens_per_message = EXCLUDED.tokens_per_message,
  cost_per_message = EXCLUDED.cost_per_message,
  tier = EXCLUDED.tier,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  active = EXCLUDED.active,
  updated_at = now();

-- Deactivate old claude-haiku-free model
UPDATE model_pricing
SET active = false, updated_at = now()
WHERE model_id = 'claude-haiku-free';

-- Update old claude-opus to claude-opus-4.1
UPDATE model_pricing
SET
  model_id = 'claude-opus-4.1',
  model_name = 'Claude Opus 4.1',
  updated_at = now()
WHERE model_id = 'claude-opus';

-- Add comment
COMMENT ON TABLE model_pricing IS 'Now includes 35+ AI models with transparent per-model token pricing. Free models (13), Budget (2), Mid (6), Premium (8), Ultra-Premium (3+).';
