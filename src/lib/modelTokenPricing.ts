import { getPricePerMillionTokens } from './modelPricing';
import { getModelById } from './aiModels';


export interface ModelTokenCost {
  id: string;
  name: string;
  provider: string;
  tokensPerMessage: number;
  costPerMessage: number;
  pricePerMillion?: string; // Actual price per 1M tokens with our margin
  tier: 'free' | 'budget' | 'mid' | 'premium' | 'ultra-premium';
  description: string;
  icon: string;
  logoUrl?: string;
  paidOnly?: boolean;
}

export const MODEL_TOKEN_COSTS: Record<string, ModelTokenCost> = {
  'gemini-flash-lite-free': {
    id: 'gemini-flash-lite-free',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'Google',
    tokensPerMessage: 800,
    costPerMessage: 0.0,
    tier: 'free',
    description: 'Fast multimodal AI',
    icon: '✨',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg'
  },
  'deepseek-v3.1-free': {
    id: 'deepseek-v3.1-free',
    name: 'DeepSeek V3.1 Free',
    provider: 'DeepSeek',
    tokensPerMessage: 800,
    costPerMessage: 0.0,
    tier: 'free',
    description: 'Efficient and smart',
    icon: '🧠',
    logoUrl: 'https://github.com/deepseek-ai.png'
  },
  'llama-4-maverick-free': {
    id: 'llama-4-maverick-free',
    name: 'Llama 4 Maverick Free',
    provider: 'Meta',
    tokensPerMessage: 1000,
    costPerMessage: 0.0,
    tier: 'free',
    description: 'Latest Llama, free tier',
    icon: '🦙',
    logoUrl: 'https://github.com/meta-llama.png'
  },
  'nemotron-nano-free': {
    id: 'nemotron-nano-free',
    name: 'Nemotron Nano 9B V2',
    provider: 'NVIDIA',
    tokensPerMessage: 700,
    costPerMessage: 0.0,
    tier: 'free',
    description: 'Fast nano model',
    icon: '🚀',
    logoUrl: 'https://www.nvidia.com/content/dam/en-zz/Solutions/about-nvidia/logo-and-brand/02-nvidia-logo-color-blk-500x200-4c25-p@2x.png'
  },
  'qwen-vl-30b-free': {
    id: 'qwen-vl-30b-free',
    name: 'Qwen3 VL 30B Thinking',
    provider: 'Qwen',
    tokensPerMessage: 900,
    costPerMessage: 0.0,
    tier: 'free',
    description: 'Visual & thinking model',
    icon: '👁️',
    logoUrl: 'https://avatars.githubusercontent.com/u/135470043'
  },
  'claude-3-haiku': {
    id: 'claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    tokensPerMessage: 1200,
    costPerMessage: 0.00068,
    tier: 'free',
    description: 'Fast Claude 3 model',
    icon: '📝',
    logoUrl: 'https://github.com/anthropics.png'
  },
  'perplexity-sonar': {
    id: 'perplexity-sonar',
    name: 'Perplexity Sonar',
    provider: 'Perplexity',
    tokensPerMessage: 2000,
    costPerMessage: 0.006,
    tier: 'free',
    description: 'Web search enabled AI',
    icon: '🔍',
    logoUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/perplexity-ai-icon.png'
  },
  'kimi-k2-free': {
    id: 'kimi-k2-free',
    name: 'Kimi K2 Free',
    provider: 'Moonshot',
    tokensPerMessage: 1000,
    costPerMessage: 0.0,
    tier: 'free',
    description: 'Long context support',
    icon: '🌙',
    logoUrl: 'https://github.com/moonshot-ai.png'
  },
  'codex-mini': {
    id: 'codex-mini',
    name: 'Codex Mini',
    provider: 'OpenAI',
    tokensPerMessage: 600,
    costPerMessage: 0.00018,
    tier: 'free',
    description: 'Lightweight coding',
    icon: '💻',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg'
  },
  'lfm2-8b': {
    id: 'lfm2-8b',
    name: 'LiquidAI LFM2-8B',
    provider: 'LiquidAI',
    tokensPerMessage: 500,
    costPerMessage: 0.00009,
    tier: 'free',
    description: 'Efficient model',
    icon: '💧',
    logoUrl: 'https://github.com/liquid-ai.png'
  },
  'granite-4.0': {
    id: 'granite-4.0',
    name: 'Granite 4.0 Micro',
    provider: 'IBM',
    tokensPerMessage: 600,
    costPerMessage: 0.00014,
    tier: 'free',
    description: 'Micro model',
    icon: '🪨',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg'
  },
  'ernie-4.5': {
    id: 'ernie-4.5',
    name: 'ERNIE 4.5 21B Thinking',
    provider: 'Baidu',
    tokensPerMessage: 850,
    costPerMessage: 0.00022,
    tier: 'free',
    description: 'Thinking model',
    icon: '🧩',
    logoUrl: 'https://github.com/PaddlePaddle.png'
  },
  'kimi-k2': {
    id: 'kimi-k2',
    name: 'Kimi K2',
    provider: 'Moonshot',
    tokensPerMessage: 5000,
    costPerMessage: 0.015,
    tier: 'budget',
    description: 'Long context, paid tier',
    icon: '🌙',
    logoUrl: 'https://github.com/moonshot-ai.png'
  },
  'deepseek-v3.2': {
    id: 'deepseek-v3.2',
    name: 'DeepSeek V3.2',
    provider: 'DeepSeek',
    tokensPerMessage: 6000,
    costPerMessage: 0.018,
    tier: 'budget',
    description: 'Advanced DeepSeek',
    icon: '🧠',
    logoUrl: 'https://github.com/deepseek-ai.png'
  },
  'gemini-flash-image': {
    id: 'gemini-flash-image',
    name: 'Gemini 2.5 Flash Image',
    provider: 'Google',
    tokensPerMessage: 8000,
    costPerMessage: 0.02,
    tier: 'mid',
    description: 'Image focused',
    icon: '🖼️',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg'
  },
  'qwen-vl-32b': {
    id: 'qwen-vl-32b',
    name: 'Qwen3 VL 32B Instruct',
    provider: 'Qwen',
    tokensPerMessage: 10000,
    costPerMessage: 0.025,
    tier: 'mid',
    description: 'Advanced visual model',
    icon: '👁️',
    logoUrl: 'https://avatars.githubusercontent.com/u/135470043'
  },
  'gpt-5-chat': {
    id: 'gpt-5-chat',
    name: 'GPT-5 Chat',
    provider: 'OpenAI',
    tokensPerMessage: 16000,
    costPerMessage: 0.04,
    tier: 'mid',
    description: 'Latest ChatGPT with images',
    icon: '🤖',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg'
  },
  'nemotron-super': {
    id: 'nemotron-super',
    name: 'Nemotron Super 49B',
    provider: 'NVIDIA',
    tokensPerMessage: 14000,
    costPerMessage: 0.035,
    tier: 'mid',
    description: 'Powerful reasoning',
    icon: '🚀',
    logoUrl: 'https://www.nvidia.com/content/dam/en-zz/Solutions/about-nvidia/logo-and-brand/02-nvidia-logo-color-blk-500x200-4c25-p@2x.png'
  },
  'llama-4-maverick': {
    id: 'llama-4-maverick',
    name: 'Llama 4 Maverick',
    provider: 'Meta',
    tokensPerMessage: 15000,
    costPerMessage: 0.038,
    tier: 'mid',
    description: 'Latest Llama, paid tier',
    icon: '🦙',
    logoUrl: 'https://github.com/meta-llama.png'
  },
  'glm-4.6': {
    id: 'glm-4.6',
    name: 'GLM 4.6',
    provider: 'Z.AI',
    tokensPerMessage: 16500,
    costPerMessage: 0.042,
    tier: 'mid',
    description: 'Advanced model',
    icon: '⚙️',
    logoUrl: 'https://avatars.githubusercontent.com/u/48584855'
  },
  'gpt-5-codex': {
    id: 'gpt-5-codex',
    name: 'GPT-5 Codex',
    provider: 'OpenAI',
    tokensPerMessage: 24000,
    costPerMessage: 0.06,
    tier: 'premium',
    description: 'Best for coding',
    icon: '💻',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg'
  },
  'prime-intellect/intellect-3': {
    id: 'prime-intellect/intellect-3',
    name: 'INTELLECT-3',
    provider: 'Prime Intellect',
    tokensPerMessage: 18000,
    costPerMessage: 0.05,
    tier: 'premium',
    description: 'Advanced reasoning with thinking tokens',
    icon: '🧠',
    paidOnly: true
  },
  'claude-haiku-4.5': {
    id: 'claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    tokensPerMessage: 8000,
    costPerMessage: 0.02,
    tier: 'mid',
    description: 'Fast Claude 4.5',
    icon: '📝',
    logoUrl: 'https://github.com/anthropics.png'
  },
  'claude-sonnet': {
    id: 'claude-sonnet',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    tokensPerMessage: 120000,
    costPerMessage: 0.30,
    tier: 'premium',
    description: 'Advanced reasoning',
    icon: '🎵',
    logoUrl: 'https://github.com/anthropics.png'
  },
  'kimi-k2-0905': {
    id: 'kimi-k2-0905',
    name: 'Kimi K2 0905',
    provider: 'MoonshotAI',
    tokensPerMessage: 7000,
    costPerMessage: 0.018,
    tier: 'budget',
    description: 'Latest Kimi model',
    icon: '🌙',
    logoUrl: 'https://github.com/moonshot-ai.png'
  },
  'perplexity-sonar-pro': {
    id: 'perplexity-sonar-pro',
    name: 'Perplexity Sonar Pro',
    provider: 'Perplexity',
    tokensPerMessage: 18000,
    costPerMessage: 0.045,
    tier: 'mid',
    description: 'Pro web search with vision',
    icon: '🔍',
    logoUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/perplexity-ai-icon.png'
  },
  'perplexity-sonar-reasoning': {
    id: 'perplexity-sonar-reasoning',
    name: 'Perplexity Sonar Reasoning Pro',
    provider: 'Perplexity',
    tokensPerMessage: 32000,
    costPerMessage: 0.08,
    tier: 'premium',
    description: 'Advanced reasoning with search',
    icon: '🧠',
    logoUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/perplexity-ai-icon.png'
  },
  'perplexity-sonar-deep': {
    id: 'perplexity-sonar-deep',
    name: 'Perplexity Sonar Deep Research',
    provider: 'Perplexity',
    tokensPerMessage: 60000,
    costPerMessage: 0.15,
    tier: 'premium',
    description: 'Deep research capabilities',
    icon: '🔬',
    logoUrl: 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/perplexity-ai-icon.png'
  },
  'claude-opus-4': {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    tokensPerMessage: 200000,
    costPerMessage: 0.50,
    tier: 'ultra-premium',
    description: 'Powerful Opus model',
    icon: '👑',
    logoUrl: 'https://github.com/anthropics.png'
  },
  'claude-opus-4.1': {
    id: 'claude-opus-4.1',
    name: 'Claude Opus 4.1',
    provider: 'Anthropic',
    tokensPerMessage: 220000,
    costPerMessage: 0.55,
    tier: 'ultra-premium',
    description: 'Ultimate AI model',
    icon: '👑',
    logoUrl: 'https://github.com/anthropics.png'
  },
  'dall-e-3': {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    provider: 'OpenAI',
    tokensPerMessage: 32000,
    costPerMessage: 0.08,
    tier: 'premium',
    description: 'High quality images',
    icon: '🎨',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg'
  },
  'stable-diffusion-xl': {
    id: 'stable-diffusion-xl',
    name: 'Stable Diffusion XL',
    provider: 'Stability AI',
    tokensPerMessage: 20000,
    costPerMessage: 0.05,
    tier: 'mid',
    description: 'Open source image gen',
    icon: '🎨',
    logoUrl: 'https://github.com/Stability-AI.png'
  },
  'firefly': {
    id: 'firefly',
    name: 'Firefly',
    provider: 'Adobe',
    tokensPerMessage: 28000,
    costPerMessage: 0.07,
    tier: 'premium',
    description: 'Commercial safe images',
    icon: '🔥',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Adobe_Systems_logo_and_wordmark.svg'
  },
  'sora': {
    id: 'sora',
    name: 'Sora 2',
    provider: 'OpenAI',
    tokensPerMessage: 600000,
    costPerMessage: 0.45,
    tier: 'ultra-premium',
    description: 'Premium text to video (Paid users only)',
    icon: '🎬',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
    paidOnly: true
  },
  'eleven-labs': {
    id: 'eleven-labs',
    name: 'ElevenLabs',
    provider: 'ElevenLabs',
    tokensPerMessage: 12000,
    costPerMessage: 0.03,
    tier: 'mid',
    description: 'Natural voice synthesis',
    icon: '🎙️',
    logoUrl: 'https://github.com/elevenlabs.png'
  },
  // Studio-specific models
  'ppt-generator': {
    id: 'ppt-generator',
    name: 'PPT Generator',
    provider: 'KroniQ',
    tokensPerMessage: 5000,  // Base tokens for PPT generation
    costPerMessage: 0.015,
    tier: 'mid',
    description: 'AI-powered presentation generation',
    icon: '📊'
  },
  'kling': {
    id: 'kling',
    name: 'Kling 2.6',
    provider: 'Kling',
    tokensPerMessage: 20000,
    costPerMessage: 0.05,
    tier: 'mid',
    description: 'Realistic video generation',
    icon: '🎥'
  },
  'wan': {
    id: 'wan',
    name: 'Wan 2.5',
    provider: 'Wan',
    tokensPerMessage: 18000,
    costPerMessage: 0.045,
    tier: 'mid',
    description: 'Creative video generation',
    icon: '🎬'
  },
  'sora-2': {
    id: 'sora-2',
    name: 'Sora 2',
    provider: 'OpenAI',
    tokensPerMessage: 25000,
    costPerMessage: 0.06,
    tier: 'premium',
    description: 'Cinematic video generation',
    icon: '🎥',
    paidOnly: true
  },

  'suno-ai': {
    id: 'suno-ai',
    name: 'Suno AI Music',
    provider: 'Suno',
    tokensPerMessage: 10000,
    costPerMessage: 0.025,
    tier: 'mid',
    description: 'AI music generation',
    icon: '🎵'
  },
  'grok': { // Grok Video
    id: 'grok',
    name: 'Grok Video',
    provider: 'xAI',
    tokensPerMessage: 18000,
    costPerMessage: 0.045,
    tier: 'mid',
    description: 'Grok video generation',
    icon: '⚡'
  },
  'music-generation': {
    id: 'music-generation',
    name: 'Music Generation',
    provider: 'KroniQ',
    tokensPerMessage: 25000,  // Music takes significant compute
    costPerMessage: 0.06,
    tier: 'premium',
    description: 'AI music generation',
    icon: '🎵'
  },
  'elevenlabs': {
    id: 'elevenlabs',
    name: 'ElevenLabs TTS',
    provider: 'ElevenLabs',
    tokensPerMessage: 10000,  // Base for TTS
    costPerMessage: 0.025,
    tier: 'mid',
    description: 'Text to speech synthesis',
    icon: '🗣️',
    logoUrl: 'https://github.com/elevenlabs.png'
  },
  // New OpenAI GPT-5 Models
  'openai/gpt-5.1': {
    id: 'openai/gpt-5.1',
    name: 'GPT-5.1',
    provider: 'OpenAI',
    tokensPerMessage: 28000,
    costPerMessage: 0.07,
    tier: 'premium',
    description: 'Latest GPT with reasoning',
    icon: '🤖',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg'
  },
  'openai/gpt-5.1-chat': {
    id: 'openai/gpt-5.1-chat',
    name: 'GPT-5.1 Chat',
    provider: 'OpenAI',
    tokensPerMessage: 24000,
    costPerMessage: 0.06,
    tier: 'premium',
    description: 'Chat-optimized GPT-5.1 with vision',
    icon: '💬',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg'
  },
  'openai/gpt-5.1-codex': {
    id: 'openai/gpt-5.1-codex',
    name: 'GPT-5.1 Codex',
    provider: 'OpenAI',
    tokensPerMessage: 30000,
    costPerMessage: 0.075,
    tier: 'premium',
    description: 'Code-specialized GPT-5.1 with reasoning',
    icon: '💻',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg'
  },
  'openai/gpt-5.1-codex-mini': {
    id: 'openai/gpt-5.1-codex-mini',
    name: 'GPT-5.1 Codex Mini',
    provider: 'OpenAI',
    tokensPerMessage: 12000,
    costPerMessage: 0.03,
    tier: 'mid',
    description: 'Fast code model with vision',
    icon: '⚡',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg'
  },
  // Amazon Nova Premier
  'amazon/nova-premier-v1': {
    id: 'amazon/nova-premier-v1',
    name: 'Nova Premier 1.0',
    provider: 'Amazon',
    tokensPerMessage: 18000,
    costPerMessage: 0.045,
    tier: 'mid',
    description: 'Amazon\'s multimodal AI with vision',
    icon: '🌟',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'
  },
  // MoonshotAI Kimi Models
  'moonshotai/kimi-linear-48b-a3b-instruct': {
    id: 'moonshotai/kimi-linear-48b-a3b-instruct',
    name: 'Kimi Linear 48B',
    provider: 'MoonshotAI',
    tokensPerMessage: 14000,
    costPerMessage: 0.035,
    tier: 'mid',
    description: 'Long context linear model',
    icon: '🌙',
    logoUrl: 'https://github.com/moonshot-ai.png'
  },
  'moonshotai/kimi-k2-thinking': {
    id: 'moonshotai/kimi-k2-thinking',
    name: 'Kimi K2 Thinking',
    provider: 'MoonshotAI',
    tokensPerMessage: 32000,
    costPerMessage: 0.08,
    tier: 'premium',
    description: 'Advanced reasoning model',
    icon: '🧠',
    logoUrl: 'https://github.com/moonshot-ai.png'
  },

  // MiniMax Models
  'minimax/minimax-01': {
    id: 'minimax/minimax-01',
    name: 'MiniMax-01',
    provider: 'MiniMax',
    tokensPerMessage: 2500,
    costPerMessage: 0.008,
    tier: 'budget',
    description: 'Multimodal model with vision',
    icon: '🎯',
    logoUrl: 'https://avatars.githubusercontent.com/u/149157846'
  },
  'minimax/minimax-m2': {
    id: 'minimax/minimax-m2',
    name: 'MiniMax M2',
    provider: 'MiniMax',
    tokensPerMessage: 4500,
    costPerMessage: 0.012,
    tier: 'mid',
    description: 'Advanced reasoning model',
    icon: '🧠',
    logoUrl: 'https://avatars.githubusercontent.com/u/149157846'
  },
  'minimax/minimax-m1': {
    id: 'minimax/minimax-m1',
    name: 'MiniMax M1',
    provider: 'MiniMax',
    tokensPerMessage: 3000,
    costPerMessage: 0.009,
    tier: 'budget',
    description: 'General purpose model',
    icon: '⚡',
    logoUrl: 'https://avatars.githubusercontent.com/u/149157846'
  },

  // Amazon Nova Additional Models
  'amazon/nova-lite-v1': {
    id: 'amazon/nova-lite-v1',
    name: 'Nova Lite 1.0',
    provider: 'Amazon',
    tokensPerMessage: 2000,
    costPerMessage: 0.006,
    tier: 'budget',
    description: 'Fast multimodal with vision',
    icon: '🚀',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'
  },
  'amazon/nova-micro-v1': {
    id: 'amazon/nova-micro-v1',
    name: 'Nova Micro 1.0',
    provider: 'Amazon',
    tokensPerMessage: 1200,
    costPerMessage: 0.004,
    tier: 'free',
    description: 'Ultra-fast text model',
    icon: '⚡',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'
  },
  'amazon/nova-pro-v1': {
    id: 'amazon/nova-pro-v1',
    name: 'Nova Pro 1.0',
    provider: 'Amazon',
    tokensPerMessage: 8000,
    costPerMessage: 0.02,
    tier: 'mid',
    description: 'Professional multimodal AI',
    icon: '💼',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg'
  },

  // Baidu ERNIE Models
  'baidu/ernie-4.5-21b-a3b': {
    id: 'baidu/ernie-4.5-21b-a3b',
    name: 'ERNIE 4.5 21B A3B',
    provider: 'Baidu',
    tokensPerMessage: 3500,
    costPerMessage: 0.01,
    tier: 'budget',
    description: 'Efficient reasoning model',
    icon: '🧠',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Baidu_logo.svg'
  },
  'baidu/ernie-4.5-vl-28b-a3b': {
    id: 'baidu/ernie-4.5-vl-28b-a3b',
    name: 'ERNIE 4.5 VL 28B A3B',
    provider: 'Baidu',
    tokensPerMessage: 4500,
    costPerMessage: 0.012,
    tier: 'mid',
    description: 'Vision-language model',
    icon: '👁️',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Baidu_logo.svg'
  },
  'baidu/ernie-4.5-vl-424b-a47b': {
    id: 'baidu/ernie-4.5-vl-424b-a47b',
    name: 'ERNIE 4.5 VL 424B A47B',
    provider: 'Baidu',
    tokensPerMessage: 12000,
    costPerMessage: 0.03,
    tier: 'premium',
    description: 'Large vision-language model',
    icon: '🎯',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Baidu_logo.svg'
  },
  'baidu/ernie-4.5-300b-a47b': {
    id: 'baidu/ernie-4.5-300b-a47b',
    name: 'ERNIE 4.5 300B A47B',
    provider: 'Baidu',
    tokensPerMessage: 15000,
    costPerMessage: 0.038,
    tier: 'premium',
    description: 'Massive reasoning model',
    icon: '🚀',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Baidu_logo.svg'
  },

  // OpenRouter Auto
  'openrouter/auto': {
    id: 'openrouter/auto',
    name: 'Auto Router',
    provider: 'OpenRouter',
    tokensPerMessage: 2000,
    costPerMessage: 0.006,
    tier: 'budget',
    description: 'Automatically picks best model',
    icon: '🎛️',
    logoUrl: 'https://openrouter.ai/favicon-32x32.png'
  },

  // ===== NEW GROK MODELS =====
  'x-ai/grok-4': {
    id: 'x-ai/grok-4',
    name: 'Grok 4',
    provider: 'xAI',
    tokensPerMessage: 1000, // Dynamic from OpenRouter
    costPerMessage: 0.09,
    tier: 'premium',
    description: 'Latest Grok flagship model',
    icon: '⚡',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/X_logo_2023.svg'
  },
  'x-ai/grok-4.1': {
    id: 'x-ai/grok-4.1',
    name: 'Grok 4.1',
    provider: 'xAI',
    tokensPerMessage: 1000, // Dynamic from OpenRouter
    costPerMessage: 0.09,
    tier: 'premium',
    description: 'Enhanced Grok 4 model',
    icon: '⚡',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/X_logo_2023.svg'
  },
  'x-ai/grok-4-fast': {
    id: 'x-ai/grok-4-fast',
    name: 'Grok 4 Fast',
    provider: 'xAI',
    tokensPerMessage: 1000, // Dynamic from OpenRouter
    costPerMessage: 0.0035,
    tier: 'budget',
    description: 'Ultra-fast Grok model',
    icon: '⚡',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/X_logo_2023.svg'
  },
  'x-ai/grok-4.1-fast': {
    id: 'x-ai/grok-4.1-fast',
    name: 'Grok 4.1 Fast',
    provider: 'xAI',
    tokensPerMessage: 1000, // Dynamic from OpenRouter
    costPerMessage: 0.0035,
    tier: 'budget',
    description: 'Latest fast Grok model',
    icon: '⚡',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/X_logo_2023.svg'
  },

  // ===== NEW GPT MODELS =====
  'openai/gpt-5': {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    provider: 'OpenAI',
    tokensPerMessage: 1000, // Dynamic from OpenRouter
    costPerMessage: 0.056,
    tier: 'premium',
    description: 'Latest flagship GPT model',
    icon: '🤖',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg'
  },

  // ===== NEW CLAUDE MODELS =====
  'anthropic/claude-opus-4.5': {
    id: 'anthropic/claude-opus-4.5',
    name: 'Claude Opus 4.5',
    provider: 'Anthropic',
    tokensPerMessage: 1000, // Dynamic from OpenRouter
    costPerMessage: 0.15,
    tier: 'ultra-premium',
    description: 'Latest Claude flagship',
    icon: '👑',
    logoUrl: 'https://github.com/anthropics.png'
  },

  // ===== NEW GEMINI MODELS =====
  'google/gemini-3-pro': {
    id: 'google/gemini-3-pro',
    name: 'Gemini 3 Pro',
    provider: 'Google',
    tokensPerMessage: 1000, // Dynamic from OpenRouter
    costPerMessage: 0.07,
    tier: 'ultra-premium',
    description: 'Latest Gemini flagship',
    icon: '✨',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg'
  },
  'google/gemini-3-pro-extended': {
    id: 'google/gemini-3-pro-extended',
    name: 'Gemini 3 Pro Extended',
    provider: 'Google',
    tokensPerMessage: 1000, // Dynamic from OpenRouter
    costPerMessage: 0.11,
    tier: 'ultra-premium',
    description: 'Extended context Gemini 3',
    icon: '✨',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg'
  },

  // ===== IMAGE GENERATION MODELS =====
  'flux-kontext-pro': {
    id: 'flux-kontext-pro',
    name: 'Flux Kontext Pro',
    provider: 'Kie AI',
    tokensPerMessage: 5000,
    costPerMessage: 0.015,
    tier: 'mid',
    description: 'High-quality image generation',
    icon: '🖼️'
  },
  'gpt-4o-image': {
    id: 'gpt-4o-image',
    name: 'GPT-4o Image',
    provider: 'OpenAI',
    tokensPerMessage: 8000,
    costPerMessage: 0.02,
    tier: 'premium',
    description: 'OpenAI GPT-4o image generation',
    icon: '🎨',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg'
  },
  'nano-banana': {
    id: 'nano-banana',
    name: 'Nano Banana',
    provider: 'Kie AI',
    tokensPerMessage: 3000,
    costPerMessage: 0.008,
    tier: 'budget',
    description: 'Fast image generation',
    icon: '🍌'
  },
  'imagen-4-ultra': {
    id: 'imagen-4-ultra',
    name: 'Imagen 4 Ultra',
    provider: 'Google',
    tokensPerMessage: 10000,
    costPerMessage: 0.025,
    tier: 'premium',
    description: 'Google Imagen 4 Ultra',
    icon: '✨',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg'
  },
  'seekdream-4.5': {
    id: 'seekdream-4.5',
    name: 'SeekDream 4.5',
    provider: 'Kie AI',
    tokensPerMessage: 4000,
    costPerMessage: 0.01,
    tier: 'budget',
    description: 'Fast creative images',
    icon: '💭'
  },
  'grok-imagine': {
    id: 'grok-imagine',
    name: 'Grok Imagine',
    provider: 'xAI',
    tokensPerMessage: 6000,
    costPerMessage: 0.018,
    tier: 'mid',
    description: 'Grok image generation',
    icon: '⚡',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/X_logo_2023.svg'
  },

  // ===== IMAGE MODELS (Exact IDs from ImageStudio) =====
  '4o-image': {
    id: '4o-image',
    name: 'GPT-4o Image',
    provider: 'OpenAI',
    tokensPerMessage: 8000,
    costPerMessage: 0.02,
    tier: 'premium',
    description: 'OpenAI GPT-4o image generation',
    icon: '🎨',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg'
  },
  'google/nano-banana': {
    id: 'google/nano-banana',
    name: 'Nano Banana',
    provider: 'Google',
    tokensPerMessage: 3000,
    costPerMessage: 0.008,
    tier: 'budget',
    description: 'Fast Gemini-powered generation',
    icon: '🍌',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg'
  },
  'google/imagen4-ultra': {
    id: 'google/imagen4-ultra',
    name: 'Imagen 4 Ultra',
    provider: 'Google',
    tokensPerMessage: 10000,
    costPerMessage: 0.025,
    tier: 'premium',
    description: 'Ultra-realistic Google Imagen 4',
    icon: '✨',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg'
  },
  'seedream/4.5': {
    id: 'seedream/4.5',
    name: 'Seedream 4.5',
    provider: 'Kie AI',
    tokensPerMessage: 4000,
    costPerMessage: 0.01,
    tier: 'budget',
    description: 'Artistic and creative generation',
    icon: '💭'
  },
  'grok-imagine/text-to-image': {
    id: 'grok-imagine/text-to-image',
    name: 'Grok Imagine',
    provider: 'xAI',
    tokensPerMessage: 6000,
    costPerMessage: 0.018,
    tier: 'mid',
    description: 'Grok-powered image generation',
    icon: '⚡',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/X_logo_2023.svg'
  },

  // ===== VIDEO MODELS (Reasonable pricing: 15K-30K tokens per video) =====
  'runway-generate-5s-720p': {
    id: 'runway-generate-5s-720p',
    name: 'Runway Gen3 5s 720p',
    provider: 'Runway',
    tokensPerMessage: 15000,
    costPerMessage: 0.04,
    tier: 'mid',
    description: '5 second 720p video generation',
    icon: '🎬'
  },
  'runway-generate-10s-720p': {
    id: 'runway-generate-10s-720p',
    name: 'Runway Gen3 10s 720p',
    provider: 'Runway',
    tokensPerMessage: 25000,
    costPerMessage: 0.06,
    tier: 'premium',
    description: '10 second 720p video generation',
    icon: '🎬'
  },
  'runway-gen3': {
    id: 'runway-gen3',
    name: 'Runway Gen-3',
    provider: 'Runway',
    tokensPerMessage: 20000,
    costPerMessage: 0.05,
    tier: 'mid',
    description: 'Professional video generation',
    icon: '🎞️'
  },
  'veo3_fast': {
    id: 'veo3_fast',
    name: 'Veo 3.1 Fast',
    provider: 'Google',
    tokensPerMessage: 15000,
    costPerMessage: 0.04,
    tier: 'budget',
    description: 'Fast video generation',
    icon: '⚡',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg'
  },
  'veo3': {
    id: 'veo3',
    name: 'Veo 3.1 Quality',
    provider: 'Google',
    tokensPerMessage: 20000,
    costPerMessage: 0.05,
    tier: 'mid',
    description: 'High quality video generation',
    icon: '✨',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Google_Gemini_logo.svg'
  },
  'sora-2-text-to-video': {
    id: 'sora-2-text-to-video',
    name: 'Sora 2',
    provider: 'OpenAI',
    tokensPerMessage: 25000,
    costPerMessage: 0.06,
    tier: 'premium',
    description: 'Cinematic video generation',
    icon: '🎬',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg',
    paidOnly: true
  },
  'wan/2-5-text-to-video': {
    id: 'wan/2-5-text-to-video',
    name: 'Wan 2.5',
    provider: 'Wan',
    tokensPerMessage: 18000,
    costPerMessage: 0.045,
    tier: 'mid',
    description: 'Creative video generation',
    icon: '🎬'
  },
  'kling-2.6/text-to-video': {
    id: 'kling-2.6/text-to-video',
    name: 'Kling 2.6',
    provider: 'Kling',
    tokensPerMessage: 20000,
    costPerMessage: 0.05,
    tier: 'mid',
    description: 'Realistic video generation',
    icon: '🎥'
  },
  'grok-imagine/text-to-video': {
    id: 'grok-imagine/text-to-video',
    name: 'Grok Video',
    provider: 'xAI',
    tokensPerMessage: 18000,
    costPerMessage: 0.045,
    tier: 'mid',
    description: 'Grok video generation',
    icon: '⚡',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/X_logo_2023.svg'
  }
};


export function getModelCost(modelId: string): ModelTokenCost {
  // First check MODEL_TOKEN_COSTS
  let cost = MODEL_TOKEN_COSTS[modelId];

  // If not found, fallback to AI_MODELS
  if (!cost) {
    const aiModel = getModelById(modelId);
    if (aiModel) {
      // NOTE: tokensPerMessage is now dynamic from OpenRouter (usage.total_cost * 2 * 1000000)
      // This is just a fallback for display purposes
      cost = {
        id: aiModel.id,
        name: aiModel.name,
        provider: aiModel.provider,
        tokensPerMessage: 1000, // Fallback - actual cost comes from OpenRouter
        costPerMessage: 0.01,
        tier: (aiModel.tier?.toLowerCase() || 'mid') as 'free' | 'budget' | 'mid' | 'premium' | 'ultra-premium',
        description: aiModel.description,
        icon: getProviderIcon(aiModel.provider),
        logoUrl: aiModel.logoUrl,
      };
    } else {
      // Ultimate fallback
      cost = {
        id: modelId,
        name: modelId,
        provider: 'Unknown',
        tokensPerMessage: 1000, // Fallback - actual cost comes from OpenRouter
        costPerMessage: 0.01,
        tier: 'mid',
        description: 'Unknown model',
        icon: '❓',
      };
    }
  }

  // Add actual pricing from OpenRouter with our margin
  cost.pricePerMillion = getPricePerMillionTokens(modelId);

  return cost;
}


function getProviderIcon(provider: string): string {
  const icons: Record<string, string> = {
    'OpenAI': '🤖',
    'Anthropic': '🔮',
    'Google': '🌟',
    'xAI': '⚡',
    'X.AI': '⚡',
    'DeepSeek': '🧠',
    'Meta': '🦙',
    'NVIDIA': '🚀',
    'Qwen': '👁️',
    'Moonshot': '🌙',
    'MoonshotAI': '🌙',
    'Amazon': '📦',
    'Perplexity': '🔍',
    'LiquidAI': '💧',
    'IBM': '🪨',
    'Baidu': '🧩',
    'Z.AI': '⚙️',
    'AllenAI': '🧪',
    'OpenRouter': '🔀',
    'Sherlock AI': '🔎',
    'Stability AI': '🎨',
    'Adobe': '🔥',
    'ElevenLabs': '🎙️',
    'Cohere': '💬',
    'MiniMax': '🔢',
    'Microsoft': '🪟'
  };
  return icons[provider] || '🤖';
}

export function getTierBadgeColor(tier: ModelTokenCost['tier']): string {
  const colors = {
    'free': 'bg-green-500/20 text-green-300 border-green-500/30',
    'budget': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'mid': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'premium': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'ultra-premium': 'bg-red-500/20 text-red-300 border-red-500/30'
  };
  return colors[tier] || colors.mid;
}

export function formatTokenDisplay(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

export function isModelFree(modelId: string): boolean {
  const model = MODEL_TOKEN_COSTS[modelId];
  return model?.tier === 'free';
}

export function isModelPaidOnly(modelId: string): boolean {
  const model = MODEL_TOKEN_COSTS[modelId];
  return model?.paidOnly === true;
}

export function estimateMixedUsage(chatMessages: number, imageGenerations: number, videoSeconds: number): number {
  const chatTokens = chatMessages * 1000;
  const imageTokens = imageGenerations * 10000;
  const videoTokens = videoSeconds * 1000;
  return chatTokens + imageTokens + videoTokens;
}

export function calculateTokensForMessage(message: string, modelId: string): number {
  const model = getModelCost(modelId);
  const baseTokens = Math.ceil(message.length / 4);
  return baseTokens + (model.tokensPerMessage * 0.1);
}
