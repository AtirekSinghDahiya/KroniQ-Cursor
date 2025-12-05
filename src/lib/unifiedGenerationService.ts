import { checkGenerationLimit, incrementGenerationCount, GenerationType } from './generationLimitsService';
import { deductTokensForRequest } from './tokenService';
import { getModelCost } from './modelTokenPricing';
import { getUserTier } from './userTierService';

export interface GenerationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  limitReached?: boolean;
  insufficientTokens?: boolean;
}

export interface GenerationOptions {
  userId: string;
  generationType: GenerationType;
  modelId: string;
  provider: string;
  onProgress?: (message: string) => void;
}

export async function executeGeneration<T>(
  options: GenerationOptions,
  generationFn: () => Promise<T>
): Promise<GenerationResult<T>> {
  const { userId, generationType, modelId, provider, onProgress } = options;

  try {
    onProgress?.('Checking generation limits...');

    const limitCheck = await checkGenerationLimit(userId, generationType);
    if (!limitCheck.canGenerate) {
      return {
        success: false,
        error: limitCheck.message,
        limitReached: true
      };
    }

    onProgress?.('Verifying token balance...');

    const tierInfo = await getUserTier(userId);
    const modelCost = getModelCost(modelId);

    if (tierInfo.isPremium && tierInfo.totalTokens < modelCost.costPerMessage) {
      return {
        success: false,
        error: `Insufficient tokens. This generation requires ${modelCost.costPerMessage.toLocaleString()} tokens, but you have ${tierInfo.totalTokens.toLocaleString()} tokens remaining.`,
        insufficientTokens: true
      };
    }

    onProgress?.('Generating content...');

    const result = await generationFn();

    onProgress?.('Updating usage...');

    await deductTokensForRequest(
      userId,
      modelId,
      provider,
      modelCost.costPerMessage,
      generationType
    );

    await incrementGenerationCount(userId, generationType);

    onProgress?.('Complete!');

    return {
      success: true,
      data: result
    };

  } catch (error: any) {
    console.error(`Generation failed for ${generationType}:`, error);

    let errorMessage = 'An unexpected error occurred. Please try again.';

    if (error.message) {
      if (error.message.includes('API key')) {
        errorMessage = 'API configuration error. Please contact support.';
      } else if (error.message.includes('rate limit')) {
        errorMessage = 'Rate limit reached. Please wait a moment and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again with a simpler prompt.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = error.message;
      }
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

export function getGenerationLimitMessage(
  generationType: GenerationType,
  isPaid: boolean,
  current: number,
  limit: number
): string {
  if (isPaid) {
    return 'Unlimited generations (token-based billing)';
  }

  const remaining = Math.max(0, limit - current);
  const typeNames = {
    image: 'image',
    video: 'video',
    song: 'song',
    tts: 'text-to-speech conversion',
    ppt: 'presentation'
  };

  return `${remaining} of ${limit} free ${typeNames[generationType]}${remaining !== 1 ? 's' : ''} remaining this month`;
}
