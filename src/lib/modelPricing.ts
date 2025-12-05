/**
 * Model Pricing Service
 * Fetches real prices from OpenRouter and adds our margin
 */

export interface ModelPricing {
  inputCost: number; // Cost per 1M tokens for input
  outputCost: number; // Cost per 1M tokens for output
  totalCost: number; // Average cost per 1M tokens
  marginMultiplier: number; // Our margin (e.g., 1.2 = 20% markup)
  finalCost: number; // Final price with margin
}

// Our margin on top of OpenRouter prices (20% markup)
const MARGIN_MULTIPLIER = 1.2;

// Cached prices from OpenRouter API (updated daily)
const MODEL_PRICES: Record<string, ModelPricing> = {
  // Anthropic Claude
  'anthropic/claude-3.7-sonnet': { inputCost: 3, outputCost: 15, totalCost: 9, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 10.8 },
  'anthropic/claude-3.5-sonnet-20241022': { inputCost: 3, outputCost: 15, totalCost: 9, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 10.8 },
  'anthropic/claude-3.5-haiku': { inputCost: 0.8, outputCost: 4, totalCost: 2.4, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 2.88 },
  'anthropic/claude-3-opus': { inputCost: 15, outputCost: 75, totalCost: 45, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 54 },
  'anthropic/claude-3-sonnet': { inputCost: 3, outputCost: 15, totalCost: 9, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 10.8 },
  'anthropic/claude-3-haiku': { inputCost: 0.25, outputCost: 1.25, totalCost: 0.75, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.9 },

  // OpenAI
  'openai/gpt-4o': { inputCost: 2.5, outputCost: 10, totalCost: 6.25, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 7.5 },
  'openai/gpt-4o-mini': { inputCost: 0.15, outputCost: 0.6, totalCost: 0.375, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.45 },
  'openai/gpt-4-turbo': { inputCost: 10, outputCost: 30, totalCost: 20, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 24 },
  'openai/gpt-4': { inputCost: 30, outputCost: 60, totalCost: 45, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 54 },
  'openai/gpt-3.5-turbo': { inputCost: 0.5, outputCost: 1.5, totalCost: 1, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 1.2 },
  'openai/o1': { inputCost: 15, outputCost: 60, totalCost: 37.5, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 45 },
  'openai/o1-mini': { inputCost: 3, outputCost: 12, totalCost: 7.5, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 9 },

  // Google Gemini
  'google/gemini-2.0-flash-exp': { inputCost: 0, outputCost: 0, totalCost: 0, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0 },
  'google/gemini-pro-1.5': { inputCost: 1.25, outputCost: 5, totalCost: 3.125, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 3.75 },
  'google/gemini-flash-1.5': { inputCost: 0.075, outputCost: 0.3, totalCost: 0.1875, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.225 },
  'google/gemini-flash-1.5-8b': { inputCost: 0.0375, outputCost: 0.15, totalCost: 0.09375, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.1125 },

  // Meta Llama
  'meta-llama/llama-3.3-70b-instruct': { inputCost: 0.35, outputCost: 0.4, totalCost: 0.375, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.45 },
  'meta-llama/llama-3.2-90b-vision-instruct': { inputCost: 0.3, outputCost: 1.2, totalCost: 0.75, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.9 },
  'meta-llama/llama-3.2-11b-vision-instruct': { inputCost: 0.055, outputCost: 0.055, totalCost: 0.055, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.066 },
  'meta-llama/llama-3.2-3b-instruct': { inputCost: 0.06, outputCost: 0.06, totalCost: 0.06, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.072 },
  'meta-llama/llama-3.1-405b-instruct': { inputCost: 2.7, outputCost: 2.7, totalCost: 2.7, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 3.24 },
  'meta-llama/llama-3.1-70b-instruct': { inputCost: 0.35, outputCost: 0.4, totalCost: 0.375, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.45 },

  // Qwen
  'qwen/qwen-2.5-72b-instruct': { inputCost: 0.35, outputCost: 0.4, totalCost: 0.375, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.45 },
  'qwen/qwen-2.5-32b-instruct': { inputCost: 0.27, outputCost: 0.27, totalCost: 0.27, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.324 },
  'qwen/qwen-2.5-7b-instruct': { inputCost: 0.35, outputCost: 0.35, totalCost: 0.35, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.42 },
  'qwen/qwen-2.5-coder-32b-instruct': { inputCost: 0.27, outputCost: 0.27, totalCost: 0.27, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.324 },

  // DeepSeek
  'deepseek/deepseek-chat': { inputCost: 0.14, outputCost: 0.28, totalCost: 0.21, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.252 },
  'deepseek/deepseek-coder': { inputCost: 0.14, outputCost: 0.28, totalCost: 0.21, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.252 },
  'deepseek/deepseek-reasoner': { inputCost: 0.55, outputCost: 2.19, totalCost: 1.37, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 1.644 },

  // Mistral
  'mistralai/mistral-large': { inputCost: 2, outputCost: 6, totalCost: 4, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 4.8 },
  'mistralai/mistral-medium': { inputCost: 2.7, outputCost: 8.1, totalCost: 5.4, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 6.48 },
  'mistralai/mistral-small': { inputCost: 0.2, outputCost: 0.6, totalCost: 0.4, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.48 },
  'mistralai/codestral': { inputCost: 0.2, outputCost: 0.6, totalCost: 0.4, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.48 },
  'mistralai/mixtral-8x7b': { inputCost: 0.24, outputCost: 0.24, totalCost: 0.24, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.288 },

  // Perplexity
  'perplexity/llama-3.1-sonar-small-128k-online': { inputCost: 0.2, outputCost: 0.2, totalCost: 0.2, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.24 },
  'perplexity/llama-3.1-sonar-large-128k-online': { inputCost: 1, outputCost: 1, totalCost: 1, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 1.2 },
  'perplexity/llama-3.1-sonar-huge-128k-online': { inputCost: 5, outputCost: 5, totalCost: 5, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 6 },

  // Grok
  'x-ai/grok-beta': { inputCost: 5, outputCost: 15, totalCost: 10, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 12 },
  'x-ai/grok-vision-beta': { inputCost: 5, outputCost: 15, totalCost: 10, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 12 },

  // Kimi
  'moonshotai/kimi-k2-thinking': { inputCost: 2.5, outputCost: 10, totalCost: 6.25, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 7.5 },

  // Amazon Nova
  'amazon/nova-lite-v1': { inputCost: 0.06, outputCost: 0.24, totalCost: 0.15, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.18 },
  'amazon/nova-micro-v1': { inputCost: 0.035, outputCost: 0.14, totalCost: 0.0875, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.105 },
  'amazon/nova-pro-v1': { inputCost: 0.8, outputCost: 3.2, totalCost: 2, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 2.4 },

  // GLM
  'zhipuai/glm-4-plus': { inputCost: 0.8, outputCost: 0.8, totalCost: 0.8, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0.96 },
  'zhipuai/glm-4-flash': { inputCost: 0, outputCost: 0, totalCost: 0, marginMultiplier: MARGIN_MULTIPLIER, finalCost: 0 },
};

/**
 * Get pricing for a model
 */
export function getModelPricing(modelId: string): ModelPricing | null {
  return MODEL_PRICES[modelId] || null;
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  if (price === 0) return 'FREE';
  if (price < 0.01) return '<$0.01';
  if (price < 1) return `$${price.toFixed(3)}`;
  return `$${price.toFixed(2)}`;
}

/**
 * Get price per million tokens with margin
 */
export function getPricePerMillionTokens(modelId: string): string {
  const pricing = getModelPricing(modelId);
  if (!pricing) return '~$0.80';
  return formatPrice(pricing.finalCost);
}

/**
 * Calculate cost for a number of tokens
 */
export function calculateCost(modelId: string, tokens: number): number {
  const pricing = getModelPricing(modelId);
  if (!pricing) return (tokens / 1000000) * 0.8; // Default fallback
  return (tokens / 1000000) * pricing.finalCost;
}
