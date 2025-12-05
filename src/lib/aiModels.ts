export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  category: 'chat' | 'code' | 'image' | 'video' | 'audio';
  tokensPerMessage?: number; // Cost in tokens per message/request
  tier?: 'FREE' | 'BUDGET' | 'MID' | 'PREMIUM'; // Tier classification
}

export const AI_MODELS: AIModel[] = [
  // Mistral Models (26)
  { id: 'mistralai/mistral-large', name: 'Mistral Large', provider: 'Mistral AI', description: 'Most powerful Mistral model', category: 'chat', tokensPerMessage: 10000, tier: 'MID' },
  { id: 'mistralai/mistral-medium', name: 'Mistral Medium', provider: 'Mistral AI', description: 'Balanced performance', category: 'chat', tokensPerMessage: 5000, tier: 'BUDGET' },
  { id: 'mistralai/mistral-small', name: 'Mistral Small', provider: 'Mistral AI', description: 'Fast and efficient', category: 'chat', tokensPerMessage: 2000, tier: 'BUDGET' },
  { id: 'mistralai/mistral-tiny', name: 'Mistral Tiny', provider: 'Mistral AI', description: 'Ultra-fast model', category: 'chat', tokensPerMessage: 1000, tier: 'FREE' },
  { id: 'mistralai/mistral-nemo', name: 'Mistral Nemo', provider: 'Mistral AI', description: '12B parameter model', category: 'chat', tokensPerMessage: 3000, tier: 'BUDGET' },
  { id: 'mistralai/pixtral-large', name: 'Pixtral Large', provider: 'Mistral AI', description: 'Vision + text model', category: 'chat', tokensPerMessage: 12000, tier: 'MID' },
  { id: 'mistralai/pixtral-12b', name: 'Pixtral 12B', provider: 'Mistral AI', description: '12B vision model', category: 'chat', tokensPerMessage: 8000, tier: 'MID' },
  { id: 'mistralai/codestral', name: 'Codestral', provider: 'Mistral AI', description: 'Code-specialized model', category: 'code', tokensPerMessage: 6000, tier: 'MID' },
  { id: 'mistralai/codestral-mamba', name: 'Codestral Mamba', provider: 'Mistral AI', description: 'Fast code model', category: 'code', tokensPerMessage: 4000, tier: 'BUDGET' },
  { id: 'mistralai/mistral-7b-instruct', name: 'Mistral 7B Instruct', provider: 'Mistral AI', description: '7B instruction model', category: 'chat', tokensPerMessage: 1500, tier: 'FREE' },
  { id: 'mistralai/mixtral-8x7b', name: 'Mixtral 8x7B', provider: 'Mistral AI', description: 'MoE 8x7B model', category: 'chat', tokensPerMessage: 4000, tier: 'BUDGET' },
  { id: 'mistralai/mixtral-8x22b', name: 'Mixtral 8x22B', provider: 'Mistral AI', description: 'Large MoE model', category: 'chat', tokensPerMessage: 8000, tier: 'MID' },
  { id: 'mistralai/mistral-large-2407', name: 'Mistral Large 2407', provider: 'Mistral AI', description: 'July 2024 release', category: 'chat', tokensPerMessage: 10000, tier: 'MID' },
  { id: 'mistralai/mistral-large-2411', name: 'Mistral Large 2411', provider: 'Mistral AI', description: 'November 2024 release', category: 'chat', tokensPerMessage: 10000, tier: 'MID' },
  { id: 'mistralai/mistral-medium-2312', name: 'Mistral Medium 2312', provider: 'Mistral AI', description: 'December 2023 release', category: 'chat', tokensPerMessage: 5000, tier: 'BUDGET' },
  { id: 'mistralai/mistral-small-2402', name: 'Mistral Small 2402', provider: 'Mistral AI', description: 'February 2024 release', category: 'chat', tokensPerMessage: 2000, tier: 'BUDGET' },
  { id: 'mistralai/mistral-small-2409', name: 'Mistral Small 2409', provider: 'Mistral AI', description: 'September 2024 release', category: 'chat', tokensPerMessage: 2000, tier: 'BUDGET' },
  { id: 'mistralai/open-mistral-7b', name: 'Open Mistral 7B', provider: 'Mistral AI', description: 'Open-source 7B', category: 'chat', tokensPerMessage: 1200, tier: 'FREE' },
  { id: 'mistralai/open-mixtral-8x7b', name: 'Open Mixtral 8x7B', provider: 'Mistral AI', description: 'Open-source MoE', category: 'chat', tokensPerMessage: 3500, tier: 'BUDGET' },
  { id: 'mistralai/open-mixtral-8x22b', name: 'Open Mixtral 8x22B', provider: 'Mistral AI', description: 'Large open MoE', category: 'chat', tokensPerMessage: 7000, tier: 'MID' },
  { id: 'mistralai/ministral-3b', name: 'Ministral 3B', provider: 'Mistral AI', description: 'Edge-optimized 3B', category: 'chat', tokensPerMessage: 800, tier: 'FREE' },
  { id: 'mistralai/ministral-8b', name: 'Ministral 8B', provider: 'Mistral AI', description: 'Edge-optimized 8B', category: 'chat', tokensPerMessage: 1500, tier: 'FREE' },
  { id: 'mistralai/mistral-embed', name: 'Mistral Embed', provider: 'Mistral AI', description: 'Embedding model', category: 'chat', tokensPerMessage: 500, tier: 'FREE' },
  { id: 'mistralai/mistral-moderation', name: 'Mistral Moderation', provider: 'Mistral AI', description: 'Content moderation', category: 'chat', tokensPerMessage: 600, tier: 'FREE' },
  { id: 'mistralai/mistral-large-free', name: 'Mistral Large Free', provider: 'Mistral AI', description: 'Free tier large model', category: 'chat', tokensPerMessage: 1200, tier: 'FREE' },
  { id: 'mistralai/pixtral-free', name: 'Pixtral Free', provider: 'Mistral AI', description: 'Free vision model', category: 'chat', tokensPerMessage: 1500, tier: 'FREE' },

  // Microsoft Models (8)
  { id: 'microsoft/phi-3-medium', name: 'Phi-3 Medium', provider: 'Microsoft', description: '14B parameter model', category: 'chat', tokensPerMessage: 3000, tier: 'BUDGET' },
  { id: 'microsoft/phi-3-mini', name: 'Phi-3 Mini', provider: 'Microsoft', description: '3.8B parameter model', category: 'chat', tokensPerMessage: 1000, tier: 'FREE' },
  { id: 'microsoft/phi-3-small', name: 'Phi-3 Small', provider: 'Microsoft', description: '7B parameter model', category: 'chat', tokensPerMessage: 1500, tier: 'FREE' },
  { id: 'microsoft/phi-3.5-mini', name: 'Phi-3.5 Mini', provider: 'Microsoft', description: 'Updated 3.8B model', category: 'chat', tokensPerMessage: 1200, tier: 'FREE' },
  { id: 'microsoft/phi-3.5-moe', name: 'Phi-3.5 MoE', provider: 'Microsoft', description: '16x3.8B MoE model', category: 'chat', tokensPerMessage: 5000, tier: 'BUDGET' },
  { id: 'microsoft/phi-3.5-vision', name: 'Phi-3.5 Vision', provider: 'Microsoft', description: '4.2B multimodal', category: 'chat', tokensPerMessage: 4000, tier: 'BUDGET' },
  { id: 'microsoft/wizardlm-2-8x22b', name: 'WizardLM 2 8x22B', provider: 'Microsoft', description: 'Large reasoning model', category: 'chat', tokensPerMessage: 8000, tier: 'MID' },
  { id: 'microsoft/wizardlm-2-7b', name: 'WizardLM 2 7B', provider: 'Microsoft', description: 'Compact reasoning', category: 'chat', tokensPerMessage: 2000, tier: 'BUDGET' },

  // Qwen Models (30+)
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B Instruct', provider: 'Qwen', description: 'Large instruction model', category: 'chat', tokensPerMessage: 9000, tier: 'MID' },
  { id: 'qwen/qwen-2.5-32b-instruct', name: 'Qwen 2.5 32B Instruct', provider: 'Qwen', description: 'Mid-size instruction', category: 'chat', tokensPerMessage: 5000, tier: 'BUDGET' },
  { id: 'qwen/qwen-2.5-14b-instruct', name: 'Qwen 2.5 14B Instruct', provider: 'Qwen', description: 'Balanced instruction', category: 'chat', tokensPerMessage: 3000, tier: 'BUDGET' },
  { id: 'qwen/qwen-2.5-7b-instruct', name: 'Qwen 2.5 7B Instruct', provider: 'Qwen', description: 'Compact instruction', category: 'chat', tokensPerMessage: 1500, tier: 'FREE' },
  { id: 'qwen/qwen-2.5-3b-instruct', name: 'Qwen 2.5 3B Instruct', provider: 'Qwen', description: 'Small instruction', category: 'chat', tokensPerMessage: 800, tier: 'FREE' },
  { id: 'qwen/qwen-2.5-1.5b-instruct', name: 'Qwen 2.5 1.5B Instruct', provider: 'Qwen', description: 'Tiny instruction', category: 'chat', tokensPerMessage: 500, tier: 'FREE' },
  { id: 'qwen/qwen-2.5-0.5b-instruct', name: 'Qwen 2.5 0.5B Instruct', provider: 'Qwen', description: 'Ultra-small model', category: 'chat', tokensPerMessage: 300, tier: 'FREE' },
  { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder 32B', provider: 'Qwen', description: 'Large code model', category: 'code', tokensPerMessage: 6000, tier: 'MID' },
  { id: 'qwen/qwen-2.5-coder-7b-instruct', name: 'Qwen 2.5 Coder 7B', provider: 'Qwen', description: 'Compact code model', category: 'code', tokensPerMessage: 2000, tier: 'BUDGET' },
  { id: 'qwen/qwen-2.5-coder-1.5b-instruct', name: 'Qwen 2.5 Coder 1.5B', provider: 'Qwen', description: 'Small code model', category: 'code', tokensPerMessage: 800, tier: 'FREE' },
  { id: 'qwen/qwen-2.5-math-72b-instruct', name: 'Qwen 2.5 Math 72B', provider: 'Qwen', description: 'Math-specialized', category: 'chat', tokensPerMessage: 9000, tier: 'MID' },
  { id: 'qwen/qwen-2.5-math-7b-instruct', name: 'Qwen 2.5 Math 7B', provider: 'Qwen', description: 'Compact math', category: 'chat', tokensPerMessage: 2000, tier: 'BUDGET' },
  { id: 'qwen/qwq-32b-preview', name: 'QwQ 32B Preview', provider: 'Qwen', description: 'Reasoning preview', category: 'chat', tokensPerMessage: 6000, tier: 'MID' },
  { id: 'qwen/qwen-2-vl-72b-instruct', name: 'Qwen 2 VL 72B', provider: 'Qwen', description: 'Large vision model', category: 'chat', tokensPerMessage: 12000, tier: 'PREMIUM' },
  { id: 'qwen/qwen-2-vl-7b-instruct', name: 'Qwen 2 VL 7B', provider: 'Qwen', description: 'Compact vision', category: 'chat', tokensPerMessage: 4000, tier: 'BUDGET' },
  { id: 'qwen/qwen-2-vl-2b-instruct', name: 'Qwen 2 VL 2B', provider: 'Qwen', description: 'Small vision', category: 'chat', tokensPerMessage: 1500, tier: 'FREE' },
  { id: 'qwen/qwen-plus', name: 'Qwen Plus', provider: 'Qwen', description: 'Enhanced model', category: 'chat', tokensPerMessage: 4000, tier: 'BUDGET' },
  { id: 'qwen/qwen-turbo', name: 'Qwen Turbo', provider: 'Qwen', description: 'Fast inference', category: 'chat', tokensPerMessage: 2000, tier: 'BUDGET' },
  { id: 'qwen/qwen-max', name: 'Qwen Max', provider: 'Qwen', description: 'Maximum performance', category: 'chat', tokensPerMessage: 10000, tier: 'MID' },
  { id: 'qwen/qwen-long', name: 'Qwen Long', provider: 'Qwen', description: 'Extended context', category: 'chat', tokensPerMessage: 7000, tier: 'MID' },
  { id: 'qwen/qwen-2-72b', name: 'Qwen 2 72B', provider: 'Qwen', description: 'Previous gen large', category: 'chat', tokensPerMessage: 8000, tier: 'MID' },
  { id: 'qwen/qwen-2-57b-a14b', name: 'Qwen 2 57B A14B', provider: 'Qwen', description: 'MoE model', category: 'chat', tokensPerMessage: 7000, tier: 'MID' },
  { id: 'qwen/qwen-2-7b', name: 'Qwen 2 7B', provider: 'Qwen', description: 'Previous gen compact', category: 'chat', tokensPerMessage: 1500, tier: 'FREE' },
  { id: 'qwen/qwen-1.5-110b', name: 'Qwen 1.5 110B', provider: 'Qwen', description: 'Legacy large model', category: 'chat', tokensPerMessage: 9000, tier: 'MID' },
  { id: 'qwen/qwen-1.5-72b', name: 'Qwen 1.5 72B', provider: 'Qwen', description: 'Legacy 72B', category: 'chat', tokensPerMessage: 7000, tier: 'MID' },
  { id: 'qwen/qwen-1.5-32b', name: 'Qwen 1.5 32B', provider: 'Qwen', description: 'Legacy 32B', category: 'chat', tokensPerMessage: 4000, tier: 'BUDGET' },
  { id: 'qwen/qwen-1.5-14b', name: 'Qwen 1.5 14B', provider: 'Qwen', description: 'Legacy 14B', category: 'chat', tokensPerMessage: 2500, tier: 'BUDGET' },
  { id: 'qwen/qwen-1.5-7b', name: 'Qwen 1.5 7B', provider: 'Qwen', description: 'Legacy 7B', category: 'chat', tokensPerMessage: 1200, tier: 'FREE' },
  { id: 'qwen/qwen-vl-plus', name: 'Qwen VL Plus', provider: 'Qwen', description: 'Enhanced vision', category: 'chat', tokensPerMessage: 8000, tier: 'MID' },
  { id: 'qwen/qwen-vl-max', name: 'Qwen VL Max', provider: 'Qwen', description: 'Maximum vision', category: 'chat', tokensPerMessage: 15000, tier: 'PREMIUM' },
  { id: 'qwen3-vl-30b-free', name: 'Qwen3 VL 30B Free', provider: 'Qwen', description: 'Free vision model', category: 'chat', tokensPerMessage: 2000, tier: 'FREE' },

  // Meta Llama Models (8)
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', provider: 'Meta', description: 'Latest large model', category: 'chat', tokensPerMessage: 8000, tier: 'MID' },
  { id: 'meta-llama/llama-3.2-90b-vision-instruct', name: 'Llama 3.2 90B Vision', provider: 'Meta', description: 'Large vision model', category: 'chat', tokensPerMessage: 12000, tier: 'PREMIUM' },
  { id: 'meta-llama/llama-3.2-11b-vision-instruct', name: 'Llama 3.2 11B Vision', provider: 'Meta', description: 'Mid vision model', category: 'chat', tokensPerMessage: 4000, tier: 'BUDGET' },
  { id: 'meta-llama/llama-3.2-3b-instruct', name: 'Llama 3.2 3B', provider: 'Meta', description: 'Compact model', category: 'chat', tokensPerMessage: 800, tier: 'FREE' },
  { id: 'meta-llama/llama-3.2-1b-instruct', name: 'Llama 3.2 1B', provider: 'Meta', description: 'Small model', category: 'chat', tokensPerMessage: 400, tier: 'FREE' },
  { id: 'meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', provider: 'Meta', description: 'Massive model', category: 'chat', tokensPerMessage: 18000, tier: 'PREMIUM' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'Meta', description: 'Large 3.1 model', category: 'chat', tokensPerMessage: 7000, tier: 'MID' },
  { id: 'llama-4-maverick-free', name: 'Llama 4 Maverick Free', provider: 'Meta', description: 'Free latest Llama', category: 'chat', tokensPerMessage: 1500, tier: 'FREE' },

  // Kimi/MoonshotAI Models (6)
  { id: 'moonshotai/kimi-k2-thinking', name: 'Kimi K2 Thinking', provider: 'MoonshotAI', description: 'Advanced reasoning', category: 'chat', tokensPerMessage: 12000, tier: 'PREMIUM' },
  { id: 'moonshotai/kimi-k2-0905', name: 'Kimi K2 0905', provider: 'MoonshotAI', description: 'September release', category: 'chat', tokensPerMessage: 10000, tier: 'MID' },
  { id: 'moonshotai/kimi-linear-48b-a3b-instruct', name: 'Kimi Linear 48B', provider: 'MoonshotAI', description: 'Linear attention', category: 'chat', tokensPerMessage: 8000, tier: 'MID' },
  { id: 'moonshotai/moonshot-v1-8k', name: 'Moonshot v1 8K', provider: 'MoonshotAI', description: '8K context', category: 'chat', tokensPerMessage: 3000, tier: 'BUDGET' },
  { id: 'moonshotai/moonshot-v1-32k', name: 'Moonshot v1 32K', provider: 'MoonshotAI', description: '32K context', category: 'chat', tokensPerMessage: 6000, tier: 'MID' },
  { id: 'kimi-k2-free', name: 'Kimi K2 Free', provider: 'MoonshotAI', description: 'Free long context', category: 'chat', tokensPerMessage: 1200, tier: 'FREE' },

  // GLM Models (6)
  { id: 'zhipuai/glm-4-plus', name: 'GLM-4 Plus', provider: 'Z.AI', description: 'Enhanced GLM-4', category: 'chat', tokensPerMessage: 8000, tier: 'MID' },
  { id: 'zhipuai/glm-4-air', name: 'GLM-4 Air', provider: 'Z.AI', description: 'Lightweight GLM-4', category: 'chat', tokensPerMessage: 2000, tier: 'BUDGET' },
  { id: 'zhipuai/glm-4-flash', name: 'GLM-4 Flash', provider: 'Z.AI', description: 'Fast GLM-4', category: 'chat', tokensPerMessage: 1500, tier: 'FREE' },
  { id: 'zhipuai/glm-4v-plus', name: 'GLM-4V Plus', provider: 'Z.AI', description: 'Vision enhanced', category: 'chat', tokensPerMessage: 10000, tier: 'MID' },
  { id: 'zhipuai/glm-4-long', name: 'GLM-4 Long', provider: 'Z.AI', description: 'Extended context', category: 'chat', tokensPerMessage: 5000, tier: 'BUDGET' },
  { id: 'glm-4.6', name: 'GLM 4.6', provider: 'Z.AI', description: 'Latest GLM', category: 'chat', tokensPerMessage: 6000, tier: 'MID' },


  // Perplexity Models (6)
  { id: 'perplexity/llama-3.1-sonar-small-128k-online', name: 'Sonar Small Online', provider: 'Perplexity', description: 'Small web search', category: 'chat', tokensPerMessage: 3000, tier: 'BUDGET' },
  { id: 'perplexity/llama-3.1-sonar-large-128k-online', name: 'Sonar Large Online', provider: 'Perplexity', description: 'Large web search', category: 'chat', tokensPerMessage: 6000, tier: 'MID' },
  { id: 'perplexity/llama-3.1-sonar-huge-128k-online', name: 'Sonar Huge Online', provider: 'Perplexity', description: 'Huge web search', category: 'chat', tokensPerMessage: 12000, tier: 'PREMIUM' },
  { id: 'perplexity-sonar', name: 'Perplexity Sonar', provider: 'Perplexity', description: 'Web search enabled', category: 'chat', tokensPerMessage: 4000, tier: 'BUDGET' },
  { id: 'perplexity-sonar-pro', name: 'Perplexity Sonar Pro', provider: 'Perplexity', description: 'Pro web search with vision', category: 'chat', tokensPerMessage: 10000, tier: 'MID' },
  { id: 'perplexity-sonar-reasoning', name: 'Sonar Reasoning Pro', provider: 'Perplexity', description: 'Advanced reasoning + search', category: 'chat', tokensPerMessage: 15000, tier: 'PREMIUM' },

  // Claude Models (10)
  { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic', description: 'Latest Sonnet', category: 'chat', tokensPerMessage: 12000, tier: 'PREMIUM' },
  { id: 'anthropic/claude-3.5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', description: 'October 2024 Sonnet', category: 'chat', tokensPerMessage: 10000, tier: 'MID' },
  { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic', description: 'Latest Haiku', category: 'chat', tokensPerMessage: 3000, tier: 'BUDGET' },
  { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', description: 'Most powerful Claude 3', category: 'chat', tokensPerMessage: 15000, tier: 'PREMIUM' },
  { id: 'anthropic/claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic', description: 'Balanced Claude 3', category: 'chat', tokensPerMessage: 8000, tier: 'MID' },
  { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', description: 'Fast Claude 3', category: 'chat', tokensPerMessage: 2000, tier: 'BUDGET' },
  { id: 'claude-haiku-4.5', name: 'Claude Haiku 4.5', provider: 'Anthropic', description: 'Fast Claude 4.5', category: 'chat', tokensPerMessage: 4000, tier: 'BUDGET' },
  { id: 'claude-sonnet', name: 'Claude Sonnet 4.5', provider: 'Anthropic', description: 'Advanced reasoning', category: 'chat', tokensPerMessage: 14000, tier: 'PREMIUM' },
  { id: 'claude-opus-4', name: 'Claude Opus 4', provider: 'Anthropic', description: 'Powerful Opus', category: 'chat', tokensPerMessage: 18000, tier: 'PREMIUM' },
  { id: 'claude-opus-4.1', name: 'Claude Opus 4.1', provider: 'Anthropic', description: 'Ultimate AI model', category: 'chat', tokensPerMessage: 20000, tier: 'PREMIUM' },

  // Google Gemini Models (10)
  { id: 'google/gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp', provider: 'Google', description: 'Experimental flash', category: 'chat', tokensPerMessage: 6000, tier: 'MID' },
  { id: 'google/gemini-2.0-flash-thinking-exp-1219', name: 'Gemini 2.0 Flash Thinking', provider: 'Google', description: 'Thinking mode', category: 'chat', tokensPerMessage: 8000, tier: 'MID' },
  { id: 'google/gemini-exp-1206', name: 'Gemini Exp 1206', provider: 'Google', description: 'December experiment', category: 'chat', tokensPerMessage: 7000, tier: 'MID' },
  { id: 'google/gemini-exp-1121', name: 'Gemini Exp 1121', provider: 'Google', description: 'November experiment', category: 'chat', tokensPerMessage: 6500, tier: 'MID' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'Google', description: 'Professional model', category: 'chat', tokensPerMessage: 8000, tier: 'MID' },
  { id: 'google/gemini-flash-1.5', name: 'Gemini Flash 1.5', provider: 'Google', description: 'Fast model', category: 'chat', tokensPerMessage: 3000, tier: 'BUDGET' },
  { id: 'google/gemini-flash-1.5-8b', name: 'Gemini Flash 1.5 8B', provider: 'Google', description: 'Compact flash', category: 'chat', tokensPerMessage: 1500, tier: 'FREE' },
  { id: 'google/gemini-pro', name: 'Gemini Pro', provider: 'Google', description: 'Original pro', category: 'chat', tokensPerMessage: 5000, tier: 'BUDGET' },
  { id: 'gemini-flash-lite-free', name: 'Gemini 2.5 Flash Lite', provider: 'Google', description: 'Free multimodal AI', category: 'chat', tokensPerMessage: 1000, tier: 'FREE' },
  { id: 'gemini-flash-image', name: 'Gemini 2.5 Flash Image', provider: 'Google', description: 'Image focused', category: 'chat', tokensPerMessage: 5000, tier: 'BUDGET' },

  // OpenAI Models (11)
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Omni model', category: 'chat', tokensPerMessage: 12000, tier: 'PREMIUM' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Compact omni', category: 'chat', tokensPerMessage: 4000, tier: 'BUDGET' },
  { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI', description: 'Fast GPT-4', category: 'chat', tokensPerMessage: 10000, tier: 'MID' },
  { id: 'openai/gpt-4', name: 'GPT-4', provider: 'OpenAI', description: 'Original GPT-4', category: 'chat', tokensPerMessage: 8000, tier: 'MID' },
  { id: 'openai/gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI', description: 'Fast and efficient', category: 'chat', tokensPerMessage: 1500, tier: 'FREE' },
  { id: 'openai/o1', name: 'o1', provider: 'OpenAI', description: 'Reasoning model', category: 'chat', tokensPerMessage: 15000, tier: 'PREMIUM' },
  { id: 'openai/o1-mini', name: 'o1-mini', provider: 'OpenAI', description: 'Compact reasoning', category: 'chat', tokensPerMessage: 6000, tier: 'MID' },
  { id: 'openai/o1-preview', name: 'o1-preview', provider: 'OpenAI', description: 'Preview reasoning', category: 'chat', tokensPerMessage: 12000, tier: 'PREMIUM' },
  { id: 'openai/gpt-5.1', name: 'GPT-5.1', provider: 'OpenAI', description: 'Latest GPT with reasoning', category: 'chat', tokensPerMessage: 20000, tier: 'PREMIUM' },
  { id: 'openai/gpt-5.1-chat', name: 'GPT-5.1 Chat', provider: 'OpenAI', description: 'Chat-optimized GPT-5.1', category: 'chat', tokensPerMessage: 18000, tier: 'PREMIUM' },
  { id: 'gpt-5-chat', name: 'GPT-5 Chat', provider: 'OpenAI', description: 'Latest ChatGPT', category: 'chat', tokensPerMessage: 16000, tier: 'PREMIUM' },

  // DeepSeek Models (6)
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', description: 'Chat model', category: 'chat', tokensPerMessage: 2000, tier: 'BUDGET' },
  { id: 'deepseek/deepseek-coder', name: 'DeepSeek Coder', provider: 'DeepSeek', description: 'Code model', category: 'code', tokensPerMessage: 3000, tier: 'BUDGET' },
  { id: 'deepseek/deepseek-reasoner', name: 'DeepSeek Reasoner', provider: 'DeepSeek', description: 'Reasoning model', category: 'chat', tokensPerMessage: 5000, tier: 'BUDGET' },
  { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2', provider: 'DeepSeek', description: 'Latest with reasoning tokens', category: 'chat', tokensPerMessage: 6000, tier: 'MID' },
  { id: 'deepseek-v3.1-free', name: 'DeepSeek V3.1 Free', provider: 'DeepSeek', description: 'Free efficient model', category: 'chat', tokensPerMessage: 1000, tier: 'FREE' },
  { id: 'deepseek-v3.2', name: 'DeepSeek V3.2', provider: 'DeepSeek', description: 'Most advanced DeepSeek', category: 'chat', tokensPerMessage: 6000, tier: 'MID' },

  // NVIDIA Models (3)
  { id: 'nvidia/nemotron-4-340b-instruct', name: 'Nemotron 4 340B', provider: 'NVIDIA', description: 'Large reasoning', category: 'chat', tokensPerMessage: 16000, tier: 'PREMIUM' },
  { id: 'nemotron-nano-free', name: 'Nemotron Nano 9B V2', provider: 'NVIDIA', description: 'Fast nano model', category: 'chat', tokensPerMessage: 1500, tier: 'FREE' },
  { id: 'nemotron-super', name: 'Nemotron Super 49B', provider: 'NVIDIA', description: 'Powerful reasoning', category: 'chat', tokensPerMessage: 8000, tier: 'MID' },

  // Amazon Models (6)
  { id: 'amazon/nova-2-lite-v1:free', name: 'Nova 2 Lite (free)', provider: 'Amazon', description: 'Free fast multimodal with reasoning', category: 'chat', tokensPerMessage: 1000, tier: 'FREE' },
  { id: 'amazon/nova-2-lite-v1', name: 'Nova 2 Lite', provider: 'Amazon', description: 'Fast multimodal with reasoning tokens', category: 'chat', tokensPerMessage: 2500, tier: 'BUDGET' },
  { id: 'amazon/nova-lite-v1', name: 'Nova Lite 1.0', provider: 'Amazon', description: 'Fast multimodal', category: 'chat', tokensPerMessage: 2000, tier: 'BUDGET' },
  { id: 'amazon/nova-micro-v1', name: 'Nova Micro 1.0', provider: 'Amazon', description: 'Ultra-fast text', category: 'chat', tokensPerMessage: 1200, tier: 'FREE' },
  { id: 'amazon/nova-pro-v1', name: 'Nova Pro 1.0', provider: 'Amazon', description: 'Professional multimodal', category: 'chat', tokensPerMessage: 8000, tier: 'MID' },
  { id: 'amazon/nova-premier-v1', name: 'Nova Premier 1.0', provider: 'Amazon', description: 'Premier multimodal AI', category: 'chat', tokensPerMessage: 18000, tier: 'PREMIUM' },

  // Cohere Models (5)
  { id: 'cohere/command-r-plus', name: 'Command R+', provider: 'Cohere', description: 'Enhanced reasoning', category: 'chat', tokensPerMessage: 8000, tier: 'MID' },
  { id: 'cohere/command-r', name: 'Command R', provider: 'Cohere', description: 'Balanced reasoning', category: 'chat', tokensPerMessage: 5000, tier: 'BUDGET' },
  { id: 'cohere/command', name: 'Command', provider: 'Cohere', description: 'General purpose', category: 'chat', tokensPerMessage: 3000, tier: 'BUDGET' },
  { id: 'cohere/command-light', name: 'Command Light', provider: 'Cohere', description: 'Fast and efficient', category: 'chat', tokensPerMessage: 1500, tier: 'FREE' },
  { id: 'cohere/command-nightly', name: 'Command Nightly', provider: 'Cohere', description: 'Latest features', category: 'chat', tokensPerMessage: 4000, tier: 'BUDGET' },

  // Baidu Models (5)
  { id: 'baidu/ernie-4.5-21b-a3b', name: 'ERNIE 4.5 21B A3B', provider: 'Baidu', description: 'Efficient reasoning', category: 'chat', tokensPerMessage: 5000, tier: 'BUDGET' },
  { id: 'baidu/ernie-4.5-vl-28b-a3b', name: 'ERNIE 4.5 VL 28B A3B', provider: 'Baidu', description: 'Vision-language', category: 'chat', tokensPerMessage: 8000, tier: 'MID' },
  { id: 'baidu/ernie-4.5-vl-424b-a47b', name: 'ERNIE 4.5 VL 424B A47B', provider: 'Baidu', description: 'Large vision-language', category: 'chat', tokensPerMessage: 20000, tier: 'PREMIUM' },
  { id: 'baidu/ernie-4.5-300b-a47b', name: 'ERNIE 4.5 300B A47B', provider: 'Baidu', description: 'Massive reasoning', category: 'chat', tokensPerMessage: 18000, tier: 'PREMIUM' },
  { id: 'ernie-4.5', name: 'ERNIE 4.5 21B Thinking', provider: 'Baidu', description: 'Thinking model', category: 'chat', tokensPerMessage: 6000, tier: 'MID' },

  // MiniMax Models (3)
  { id: 'minimax/minimax-01', name: 'MiniMax-01', provider: 'MiniMax', description: 'Multimodal with vision', category: 'chat', tokensPerMessage: 10000, tier: 'MID' },
  { id: 'minimax/minimax-m2', name: 'MiniMax M2', provider: 'MiniMax', description: 'Advanced reasoning', category: 'chat', tokensPerMessage: 8000, tier: 'MID' },
  { id: 'minimax/minimax-m1', name: 'MiniMax M1', provider: 'MiniMax', description: 'General purpose', category: 'chat', tokensPerMessage: 5000, tier: 'BUDGET' },

  // Sherlock AI Models (2)
  { id: 'openrouter/sherlock-dash-alpha', name: 'Sherlock Dash Alpha', provider: 'Sherlock AI', description: 'Fast multimodal with vision', category: 'chat', tokensPerMessage: 7000, tier: 'MID' },
  { id: 'openrouter/sherlock-think-alpha', name: 'Sherlock Think Alpha', provider: 'Sherlock AI', description: 'Advanced reasoning model', category: 'chat', tokensPerMessage: 12000, tier: 'PREMIUM' },

  // Prime Intellect Models (1)
  { id: 'prime-intellect/intellect-3', name: 'INTELLECT-3', provider: 'Prime Intellect', description: 'Advanced reasoning model with extended thinking capabilities and reasoning tokens', category: 'chat', tokensPerMessage: 12000, tier: 'PREMIUM' },

  // Anthropic Claude Models (1)
  { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5', provider: 'Anthropic', description: 'Most capable Claude with vision support', category: 'chat', tokensPerMessage: 25000, tier: 'PREMIUM' },

  // OpenRouter Proprietary Models (1)
  { id: 'openrouter/bert-nebulon-alpha', name: 'Bert-Nebulon Alpha', provider: 'OpenRouter', description: 'Fast multimodal with vision capabilities', category: 'chat', tokensPerMessage: 8000, tier: 'MID' },

  // AllenAI Olmo Models (3)
  { id: 'allenai/olmo-3-32b-think', name: 'Olmo 3 32B Think', provider: 'AllenAI', description: 'Advanced reasoning with thinking tokens', category: 'chat', tokensPerMessage: 7000, tier: 'MID' },
  { id: 'allenai/olmo-3-7b-instruct', name: 'Olmo 3 7B Instruct', provider: 'AllenAI', description: 'Instruction-following model', category: 'chat', tokensPerMessage: 1500, tier: 'FREE' },
  { id: 'allenai/olmo-3-7b-think', name: 'Olmo 3 7B Think', provider: 'AllenAI', description: 'Reasoning model with thinking process', category: 'chat', tokensPerMessage: 2000, tier: 'BUDGET' },

  // Google Gemini Models (1)
  { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', provider: 'Google', description: 'Latest Gemini with reasoning tokens', category: 'chat', tokensPerMessage: 15000, tier: 'PREMIUM' },

  // xAI Grok Models (2)
  { id: 'x-ai/grok-4.1-fast', name: 'Grok 4.1 Fast', provider: 'xAI', description: 'Fast reasoning with thinking tokens', category: 'chat', tokensPerMessage: 9000, tier: 'MID' },
  { id: 'x-ai/grok-4.1-fast:free', name: 'Grok 4.1 Fast (Free)', provider: 'xAI', description: 'Free tier Grok with basic features', category: 'chat', tokensPerMessage: 1200, tier: 'FREE' },

  // Other Models (3)
  { id: 'openrouter/auto', name: 'Auto Router', provider: 'OpenRouter', description: 'Auto-selects best model', category: 'chat', tokensPerMessage: 5000, tier: 'BUDGET' },
  { id: 'codex-mini', name: 'Codex Mini', provider: 'OpenAI', description: 'Lightweight coding', category: 'code', tokensPerMessage: 2000, tier: 'BUDGET' },
  { id: 'granite-4.0', name: 'Granite 4.0 Micro', provider: 'IBM', description: 'IBM micro model', category: 'chat', tokensPerMessage: 1500, tier: 'FREE' },

  // Code Models (3)
  { id: 'gpt-5-codex', name: 'GPT-5 Codex', provider: 'OpenAI', description: 'Best for coding', category: 'code', tokensPerMessage: 16000, tier: 'PREMIUM' },
  { id: 'openai/gpt-5.1-codex', name: 'GPT-5.1 Codex', provider: 'OpenAI', description: 'Code-specialized GPT-5.1', category: 'code', tokensPerMessage: 18000, tier: 'PREMIUM' },
  { id: 'openai/gpt-5.1-codex-mini', name: 'GPT-5.1 Codex Mini', provider: 'OpenAI', description: 'Fast code model', category: 'code', tokensPerMessage: 8000, tier: 'MID' },

  // Image Models via Kie AI (4)
  { id: 'flux-pro', name: 'Flux Pro', provider: 'Kie AI', description: 'High-quality image generation', category: 'image', tokensPerMessage: 30000, tier: 'MID' },
  { id: 'flux-dev', name: 'Flux Dev', provider: 'Kie AI', description: 'Fast development model', category: 'image', tokensPerMessage: 20000, tier: 'BUDGET' },
  { id: 'sdxl', name: 'Stable Diffusion XL', provider: 'Kie AI', description: 'Popular open-source model', category: 'image', tokensPerMessage: 15000, tier: 'BUDGET' },
  { id: 'dalle-3', name: 'DALL-E 3', provider: 'Kie AI', description: 'OpenAI image model', category: 'image', tokensPerMessage: 50000, tier: 'PREMIUM' },

  // Video Models via Kie AI (3)
  { id: 'kling-video', name: 'Kling Video', provider: 'Kie AI', description: 'High-quality video generation', category: 'video', tokensPerMessage: 100000, tier: 'PREMIUM' },
  { id: 'runway-gen3', name: 'Runway Gen-3', provider: 'Kie AI', description: 'Professional video generation', category: 'video', tokensPerMessage: 120000, tier: 'PREMIUM' },
  { id: 'luma-dream-machine', name: 'Luma Dream Machine', provider: 'Kie AI', description: 'Cinematic video generation', category: 'video', tokensPerMessage: 110000, tier: 'PREMIUM' },

  // Music Models via Kie AI (2)
  { id: 'suno-v3.5', name: 'Suno v3.5', provider: 'Kie AI', description: 'Latest Suno music model', category: 'audio', tokensPerMessage: 40000, tier: 'MID' },
  { id: 'suno-v3', name: 'Suno v3', provider: 'Kie AI', description: 'Stable music generation', category: 'audio', tokensPerMessage: 35000, tier: 'MID' },

  // Voice Models (1)
  { id: 'eleven-labs', name: 'ElevenLabs', provider: 'ElevenLabs', description: 'Natural voice synthesis', category: 'audio', tokensPerMessage: 10000, tier: 'MID' },
];

export const getModelsByCategory = (category: 'chat' | 'code' | 'image' | 'video' | 'audio') => {
  return AI_MODELS.filter(m => m.category === category);
};

export const getModelById = (id: string) => {
  return AI_MODELS.find(m => m.id === id);
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
