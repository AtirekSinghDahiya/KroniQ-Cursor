import { checkGenerationLimit, GenerationType } from './generationLimitsService';
// import { deductTokensForRequest } from './tokenService';
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
  customCost?: number; // Optional override for dynamic pricing
  onProgress?: (message: string) => void;
}

export async function executeGeneration<T>(
  options: GenerationOptions,
  generationFn: () => Promise<T>
): Promise<GenerationResult<T>> {
  const { userId, generationType, modelId, provider, customCost, onProgress } = options;

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

    // Use custom cost if provided, otherwise fallback to model default (tokens)
    const finalCost = customCost !== undefined ? customCost : (modelCost.tokensPerMessage || 1000);

    if (tierInfo.isPremium && tierInfo.tokenBalance < finalCost) {
      return {
        success: false,
        error: `Insufficient tokens. This generation requires ${finalCost.toLocaleString()} tokens, but you have ${tierInfo.tokenBalance.toLocaleString()} tokens remaining.`,
        insufficientTokens: true
      };
    }

    onProgress?.('Generating content...');

    const result = await generationFn();

    // Token deduction and count increment should not fail the generation
    // since the content was already generated successfully
    try {
      onProgress?.('Updating usage...');

      // Use Firebase for token deduction and usage tracking
      const { deductTokens, incrementUsage } = await import('./firestoreService');

      console.log(`💰 [Token Deduction] Deducting ${finalCost} tokens for user ${userId}`);
      const deductSuccess = await deductTokens(userId, finalCost);
      console.log(`💰 [Token Deduction] Result: ${deductSuccess ? 'SUCCESS' : 'FAILED'}`);

      // Map generation type to feature type
      const featureTypeMap: Record<GenerationType, 'image' | 'video' | 'music' | 'tts' | 'ppt'> = {
        image: 'image',
        video: 'video',
        song: 'music',
        tts: 'tts',
        ppt: 'ppt'
      };
      const featureType = featureTypeMap[generationType];

      console.log(`📊 [Usage Increment] Incrementing ${featureType} usage for user ${userId}`);
      const incrementSuccess = await incrementUsage(userId, featureType, 1);
      console.log(`📊 [Usage Increment] Result: ${incrementSuccess ? 'SUCCESS' : 'FAILED'}`);
    } catch (usageError) {
      // Log the error but don't fail the generation since content was created
      console.error('❌ [Usage Tracking] Failed but generation succeeded:', usageError);
    }

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
