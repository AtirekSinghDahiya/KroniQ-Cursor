export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  category: 'chat' | 'code' | 'image' | 'video' | 'audio';
  tier?: 'FREE' | 'BUDGET' | 'MID' | 'PREMIUM' | 'ULTRA_PREMIUM';
  paidOnly?: boolean;
  logoUrl?: string;
}

// Provider logo URLs
const LOGOS = {
  anthropic: 'https://cdn.worldvectorlogo.com/logos/anthropic-2.svg',
  openai: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg',
  google: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
  meta: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta-Logo.png',
  deepseek: 'https://avatars.githubusercontent.com/u/148330685',
  mistral: 'https://avatars.githubusercontent.com/u/132372032',
  qwen: 'https://avatars.githubusercontent.com/u/135470043',
  xai: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/X_logo_2023.svg',
  perplexity: 'https://avatars.githubusercontent.com/u/112958312',
  nvidia: 'https://www.nvidia.com/content/dam/en-zz/Solutions/about-nvidia/logo-and-brand/01-nvidia-logo-vert-500x200-2c50-d@2x.png',
  moonshot: 'https://avatars.githubusercontent.com/u/150794313',
  amazon: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
  cohere: 'https://avatars.githubusercontent.com/u/54850923',
  baidu: 'https://avatars.githubusercontent.com/u/23551585',
  ibm: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg',
  microsoft: 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
  kieai: 'https://kroniqai.com/logo.png',
  elevenlabs: 'https://avatars.githubusercontent.com/u/93539719'
};

// VERIFIED OpenRouter model IDs - Updated Dec 2024
// NOTE: Token pricing is DYNAMIC based on OpenRouter usage * 2 (see MainChat.tsx)
export const AI_MODELS: AIModel[] = [
  // ===== FREE TIER MODELS =====
  { id: 'google/gemini-2.5-flash-lite-preview-06-17:free', name: 'Gemini 2.5 Flash Lite', provider: 'Google', description: 'Fast multimodal AI - Free', category: 'chat', tier: 'FREE', logoUrl: LOGOS.google },
  { id: 'deepseek/deepseek-chat:free', name: 'DeepSeek Chat', provider: 'DeepSeek', description: 'Efficient and smart - Free', category: 'chat', tier: 'FREE', logoUrl: LOGOS.deepseek },
  { id: 'meta-llama/llama-4-maverick:free', name: 'Llama 4 Maverick', provider: 'Meta', description: 'Latest Llama - Free tier', category: 'chat', tier: 'FREE', logoUrl: LOGOS.meta },
  { id: 'nvidia/llama-3.1-nemotron-70b-instruct:free', name: 'Nemotron 70B', provider: 'NVIDIA', description: 'NVIDIA optimized Llama', category: 'chat', tier: 'FREE', logoUrl: LOGOS.nvidia },
  { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B', provider: 'Qwen', description: 'Large multilingual model', category: 'chat', tier: 'FREE', logoUrl: LOGOS.qwen },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', description: 'Fast Claude 3 model', category: 'chat', tier: 'FREE', logoUrl: LOGOS.anthropic },
  { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B', provider: 'Mistral', description: 'Fast open model', category: 'chat', tier: 'FREE', logoUrl: LOGOS.mistral },
  { id: 'microsoft/phi-3-mini-128k-instruct:free', name: 'Phi-3 Mini', provider: 'Microsoft', description: 'Compact reasoning model', category: 'chat', tier: 'FREE', logoUrl: LOGOS.microsoft },

  // ===== BUDGET TIER MODELS =====
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', description: 'Advanced DeepSeek', category: 'chat', tier: 'BUDGET', logoUrl: LOGOS.deepseek },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', description: 'Reasoning model', category: 'chat', tier: 'BUDGET', logoUrl: LOGOS.deepseek },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', provider: 'Qwen', description: 'Large multilingual model', category: 'chat', tier: 'BUDGET', logoUrl: LOGOS.qwen },
  { id: 'mistralai/mistral-small-3.1-24b-instruct', name: 'Mistral Small 3.1', provider: 'Mistral', description: 'Efficient Mistral model', category: 'chat', tier: 'BUDGET', logoUrl: LOGOS.mistral },
  { id: 'cohere/command-r', name: 'Command R', provider: 'Cohere', description: 'Balanced model', category: 'chat', tier: 'BUDGET', logoUrl: LOGOS.cohere },
  { id: 'openrouter/auto', name: 'Auto Router', provider: 'OpenRouter', description: 'Auto-selects best model', category: 'chat', tier: 'BUDGET' },
  { id: 'x-ai/grok-4-fast', name: 'Grok 4 Fast', provider: 'xAI', description: 'Ultra-fast Grok model', category: 'chat', tier: 'BUDGET', logoUrl: LOGOS.xai },
  { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast', provider: 'xAI', description: 'Latest fast Grok', category: 'chat', tier: 'BUDGET', logoUrl: LOGOS.xai },

  // ===== MID TIER MODELS =====
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Fast multimodal GPT', category: 'chat', tier: 'MID', logoUrl: LOGOS.openai },
  { id: 'google/gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash', provider: 'Google', description: 'Fast Gemini with thinking', category: 'chat', tier: 'MID', logoUrl: LOGOS.google },
  { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic', description: 'Fast Claude 3.5', category: 'chat', tier: 'MID', logoUrl: LOGOS.anthropic },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta', description: 'Large Llama model', category: 'chat', tier: 'MID', logoUrl: LOGOS.meta },
  { id: 'mistralai/mistral-large-2411', name: 'Mistral Large', provider: 'Mistral', description: 'Powerful Mistral', category: 'chat', tier: 'MID', logoUrl: LOGOS.mistral },
  { id: 'perplexity/sonar', name: 'Perplexity Sonar', provider: 'Perplexity', description: 'Web search enabled AI', category: 'chat', tier: 'MID', logoUrl: LOGOS.perplexity },
  { id: 'perplexity/sonar-pro', name: 'Perplexity Sonar Pro', provider: 'Perplexity', description: 'Advanced search AI', category: 'chat', tier: 'MID', logoUrl: LOGOS.perplexity },
  { id: 'x-ai/grok-2-1212', name: 'Grok 2', provider: 'xAI', description: 'Latest Grok model', category: 'chat', tier: 'MID', logoUrl: LOGOS.xai },
  { id: 'cohere/command-r-plus', name: 'Command R+', provider: 'Cohere', description: 'Enhanced reasoning', category: 'chat', tier: 'MID', logoUrl: LOGOS.cohere },
  { id: 'openai/gpt-5.1-codex-mini', name: 'GPT-5.1 Codex Mini', provider: 'OpenAI', description: 'Compact coding model', category: 'chat', tier: 'MID', logoUrl: LOGOS.openai },

  // ===== PREMIUM TIER MODELS =====
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Omni multimodal', category: 'chat', tier: 'PREMIUM', logoUrl: LOGOS.openai },
  { id: 'openai/o1', name: 'o1', provider: 'OpenAI', description: 'Advanced reasoning', category: 'chat', tier: 'PREMIUM', logoUrl: LOGOS.openai },
  { id: 'openai/o1-mini', name: 'o1-mini', provider: 'OpenAI', description: 'Compact reasoning', category: 'chat', tier: 'PREMIUM', logoUrl: LOGOS.openai },
  { id: 'openai/gpt-5', name: 'GPT-5', provider: 'OpenAI', description: 'Latest flagship GPT', category: 'chat', tier: 'PREMIUM', logoUrl: LOGOS.openai },
  { id: 'openai/gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI', description: 'Enhanced GPT-5', category: 'chat', tier: 'PREMIUM', logoUrl: LOGOS.openai },
  { id: 'openai/gpt-5.1-chat', name: 'GPT-5.1 Chat', provider: 'OpenAI', description: 'GPT-5.1 optimized for chat', category: 'chat', tier: 'PREMIUM', logoUrl: LOGOS.openai },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'Advanced balanced Claude', category: 'chat', tier: 'PREMIUM', logoUrl: LOGOS.anthropic },
  { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic', description: 'Latest Sonnet with thinking', category: 'chat', tier: 'PREMIUM', logoUrl: LOGOS.anthropic },
  { id: 'google/gemini-2.5-pro-preview-06-05', name: 'Gemini 2.5 Pro', provider: 'Google', description: 'Flagship Gemini model', category: 'chat', tier: 'PREMIUM', logoUrl: LOGOS.google },
  { id: 'perplexity/sonar-reasoning', name: 'Sonar Reasoning', provider: 'Perplexity', description: 'Deep reasoning + search', category: 'chat', tier: 'PREMIUM', logoUrl: LOGOS.perplexity },
  { id: 'x-ai/grok-3-beta', name: 'Grok 3 Beta', provider: 'xAI', description: 'Cutting-edge Grok', category: 'chat', tier: 'PREMIUM', logoUrl: LOGOS.xai },
  { id: 'x-ai/grok-4', name: 'Grok 4', provider: 'xAI', description: 'Latest Grok flagship', category: 'chat', tier: 'PREMIUM', logoUrl: LOGOS.xai },
  { id: 'x-ai/grok-4.1', name: 'Grok 4.1', provider: 'xAI', description: 'Enhanced Grok 4', category: 'chat', tier: 'PREMIUM', logoUrl: LOGOS.xai },

  // ===== ULTRA PREMIUM TIER =====
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Most powerful Claude 3', category: 'chat', tier: 'ULTRA_PREMIUM', logoUrl: LOGOS.anthropic },
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic', description: 'Next-gen Claude Sonnet', category: 'chat', tier: 'ULTRA_PREMIUM', logoUrl: LOGOS.anthropic },
  { id: 'anthropic/claude-opus-4', name: 'Claude Opus 4', provider: 'Anthropic', description: 'Next-gen Claude Opus', category: 'chat', tier: 'ULTRA_PREMIUM', logoUrl: LOGOS.anthropic },
  { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', provider: 'Anthropic', description: 'Latest Claude flagship', category: 'chat', tier: 'ULTRA_PREMIUM', logoUrl: LOGOS.anthropic },
  { id: 'openai/o1-pro', name: 'o1 Pro', provider: 'OpenAI', description: 'Professional reasoning', category: 'chat', tier: 'ULTRA_PREMIUM', logoUrl: LOGOS.openai },
  { id: 'google/gemini-2.5-pro-exp-03-25', name: 'Gemini 2.5 Pro Exp', provider: 'Google', description: 'Experimental flagship', category: 'chat', tier: 'ULTRA_PREMIUM', logoUrl: LOGOS.google },
  { id: 'google/gemini-3-pro', name: 'Gemini 3 Pro', provider: 'Google', description: 'Latest Gemini flagship', category: 'chat', tier: 'ULTRA_PREMIUM', logoUrl: LOGOS.google },
  { id: 'google/gemini-3-pro-extended', name: 'Gemini 3 Pro Extended', provider: 'Google', description: 'Extended context Gemini 3', category: 'chat', tier: 'ULTRA_PREMIUM', logoUrl: LOGOS.google },

  // ===== CODE MODELS =====
  { id: 'deepseek/deepseek-coder', name: 'DeepSeek Coder', provider: 'DeepSeek', description: 'Code specialist', category: 'code', tier: 'BUDGET', logoUrl: LOGOS.deepseek },
  { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen Coder 32B', provider: 'Qwen', description: 'Advanced code model', category: 'code', tier: 'MID', logoUrl: LOGOS.qwen },
  { id: 'mistralai/codestral-2501', name: 'Codestral', provider: 'Mistral', description: 'Mistral code model', category: 'code', tier: 'MID', logoUrl: LOGOS.mistral },
  { id: 'openai/gpt-5.1-codex', name: 'GPT-5.1 Codex', provider: 'OpenAI', description: 'Latest OpenAI code model', category: 'code', tier: 'PREMIUM', logoUrl: LOGOS.openai },

  // ===== IMAGE MODELS =====
  { id: 'flux-kontext-pro', name: 'Flux Kontext Pro', provider: 'Kie AI', description: 'High-quality generation', category: 'image', tier: 'MID', logoUrl: LOGOS.kieai },
  { id: '4o-image', name: 'GPT-4o Image', provider: 'OpenAI', description: 'GPT-4o image generation', category: 'image', tier: 'PREMIUM', logoUrl: LOGOS.openai },
  { id: 'google/nano-banana', name: 'Nano Banana', provider: 'Google', description: 'Efficient image gen', category: 'image', tier: 'BUDGET', logoUrl: LOGOS.google },
  { id: 'google/imagen4-ultra', name: 'Imagen 4 Ultra', provider: 'Google', description: 'Ultra-realistic images', category: 'image', tier: 'PREMIUM', logoUrl: LOGOS.google },
  { id: 'seedream/4.5-text-to-image', name: 'Seedream 4.5', provider: 'Seedream', description: 'Artistic generation', category: 'image', tier: 'MID' },
  { id: 'grok-imagine/text-to-image', name: 'Grok Imagine', provider: 'xAI', description: 'Grok image generation', category: 'image', tier: 'MID', logoUrl: LOGOS.xai },

  // ===== VIDEO MODELS =====
  { id: 'veo3_fast', name: 'Veo 3.1 Fast', provider: 'Google', description: 'Fast video generation', category: 'video', tier: 'PREMIUM', logoUrl: LOGOS.google },
  { id: 'veo3', name: 'Veo 3.1 Quality', provider: 'Google', description: 'High quality video', category: 'video', tier: 'PREMIUM', logoUrl: LOGOS.google },
  { id: 'sora-2-text-to-video', name: 'Sora 2', provider: 'OpenAI', description: 'Cinematic video', category: 'video', tier: 'ULTRA_PREMIUM', paidOnly: true, logoUrl: LOGOS.openai },
  { id: 'wan/2-5-text-to-video', name: 'Wan 2.5', provider: 'Wan', description: 'Creative video', category: 'video', tier: 'PREMIUM' },
  { id: 'kling-2.6/text-to-video', name: 'Kling 2.6', provider: 'Kling', description: 'Realistic video', category: 'video', tier: 'PREMIUM' },
  { id: 'runway-gen3', name: 'Runway Gen-3', provider: 'Runway', description: 'Professional video', category: 'video', tier: 'PREMIUM' },

  // ===== AUDIO MODELS =====
  { id: 'suno-v3.5', name: 'Suno v3.5', provider: 'Kie AI', description: 'Music generation', category: 'audio', tier: 'MID', logoUrl: LOGOS.kieai },
  { id: 'eleven-labs', name: 'ElevenLabs TTS', provider: 'ElevenLabs', description: 'Natural voice synthesis', category: 'audio', tier: 'MID', logoUrl: LOGOS.elevenlabs },
];

export const getModelsByCategory = (category: 'chat' | 'code' | 'image' | 'video' | 'audio') => {
  return AI_MODELS.filter(m => m.category === category);
};

export const getModelById = (id: string) => {
  return AI_MODELS.find(m => m.id === id);
};

export const getModelLogoUrl = (modelId: string): string | undefined => {
  const model = getModelById(modelId);
  if (model?.logoUrl) return model.logoUrl;

  // Fallback based on provider in model ID
  if (modelId.includes('anthropic')) return LOGOS.anthropic;
  if (modelId.includes('openai')) return LOGOS.openai;
  if (modelId.includes('google')) return LOGOS.google;
  if (modelId.includes('meta-llama')) return LOGOS.meta;
  if (modelId.includes('deepseek')) return LOGOS.deepseek;
  if (modelId.includes('mistral')) return LOGOS.mistral;
  if (modelId.includes('qwen')) return LOGOS.qwen;
  if (modelId.includes('x-ai')) return LOGOS.xai;
  if (modelId.includes('perplexity')) return LOGOS.perplexity;
  if (modelId.includes('cohere')) return LOGOS.cohere;
  if (modelId.includes('nvidia')) return LOGOS.nvidia;

  return undefined;
};

export const searchModels = (query: string, category?: 'chat' | 'code' | 'image' | 'video' | 'audio') => {
  const lowerQuery = query.toLowerCase();
  let models = AI_MODELS;

  if (category) {
    models = models.filter(m => m.category === category);
  }

  return models.filter(m =>
    m.name.toLowerCase().includes(lowerQuery) ||
    m.provider.toLowerCase().includes(lowerQuery) ||
    m.description.toLowerCase().includes(lowerQuery)
  );
};
