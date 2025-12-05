import { supabase } from './supabaseClient';
import { auth } from './firebase';
import { AI_MODELS, AIModel } from './aiModels';
import { getUnifiedPremiumStatus } from './unifiedPremiumAccess';

export interface UserAccessInfo {
  userId: string;
  userType: 'free' | 'paid';
  isPremium: boolean;
  paidTokens: number;
  totalTokens: number;
  tier: string;
}

export interface ModelAccessResult {
  canAccess: boolean;
  reason?: string;
  requiresPremium: boolean;
  suggestedAlternatives?: AIModel[];
}

export async function getUserAccessInfo(userId?: string): Promise<UserAccessInfo | null> {
  const uid = userId || auth.currentUser?.uid;
  if (!uid) return null;

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, user_type, paid_tokens_balance, tokens_balance, is_paid, is_premium, current_tier')
      .eq('id', uid)
      .maybeSingle();

    if (error || !profile) {
      console.error('Error fetching user access info:', error);
      return null;
    }

    const paidTokens = profile.paid_tokens_balance || 0;
    const userType = profile.user_type || 'free';
    // ONLY user_type determines premium access (single source of truth)
    const isPremium = (userType === 'paid');

    return {
      userId: uid,
      userType: userType as 'free' | 'paid',
      isPremium,
      paidTokens,
      totalTokens: profile.tokens_balance || 0,
      tier: profile.current_tier || 'free'
    };
  } catch (error) {
    console.error('Exception in getUserAccessInfo:', error);
    return null;
  }
}

export async function canAccessModel(
  modelId: string,
  userId?: string
): Promise<ModelAccessResult> {
  const model = AI_MODELS.find(m => m.id === modelId);

  if (!model) {
    return {
      canAccess: false,
      reason: 'Model not found',
      requiresPremium: false
    };
  }

  const accessInfo = await getUserAccessInfo(userId);

  if (!accessInfo) {
    return {
      canAccess: false,
      reason: 'User not authenticated',
      requiresPremium: model.tier !== 'FREE'
    };
  }

  if (accessInfo.isPremium || accessInfo.userType === 'paid') {
    return {
      canAccess: true,
      requiresPremium: false
    };
  }

  if (model.tier === 'FREE') {
    return {
      canAccess: true,
      requiresPremium: false
    };
  }

  const alternatives = AI_MODELS.filter(m =>
    m.tier === 'FREE' &&
    m.category === model.category &&
    m.id !== modelId
  ).slice(0, 3);

  return {
    canAccess: false,
    reason: `This ${model.tier} tier model requires a premium subscription`,
    requiresPremium: true,
    suggestedAlternatives: alternatives
  };
}

export async function getAvailableModelsForUser(
  userId?: string,
  category?: 'chat' | 'code' | 'image' | 'video' | 'audio'
): Promise<AIModel[]> {
  const accessInfo = await getUserAccessInfo(userId);

  if (!accessInfo) {
    let models = AI_MODELS.filter(m => m.tier === 'FREE');
    if (category) {
      models = models.filter(m => m.category === category);
    }
    return models;
  }

  if (accessInfo.isPremium || accessInfo.userType === 'paid') {
    let models = AI_MODELS;
    if (category) {
      models = models.filter(m => m.category === category);
    }
    return models;
  }

  let models = AI_MODELS.filter(m => m.tier === 'FREE');
  if (category) {
    models = models.filter(m => m.category === category);
  }
  return models;
}

export function getModelsByTier(tier: 'FREE' | 'BUDGET' | 'MID' | 'PREMIUM'): AIModel[] {
  return AI_MODELS.filter(m => m.tier === tier);
}

export async function getRecommendedModelsForUser(
  userId?: string,
  category: 'chat' | 'code' | 'image' | 'video' | 'audio' = 'chat'
): Promise<AIModel[]> {
  const accessInfo = await getUserAccessInfo(userId);

  if (!accessInfo || accessInfo.userType === 'free') {
    return AI_MODELS
      .filter(m => m.tier === 'FREE' && m.category === category)
      .sort((a, b) => (b.tokensPerMessage || 0) - (a.tokensPerMessage || 0))
      .slice(0, 5);
  }

  return AI_MODELS
    .filter(m => m.category === category)
    .sort((a, b) => {
      const tierOrder = { FREE: 0, BUDGET: 1, MID: 2, PREMIUM: 3 };
      const tierDiff = tierOrder[b.tier || 'FREE'] - tierOrder[a.tier || 'FREE'];
      if (tierDiff !== 0) return tierDiff;
      return (b.tokensPerMessage || 0) - (a.tokensPerMessage || 0);
    })
    .slice(0, 10);
}

export function filterModelsByAccess(
  models: AIModel[],
  isPremium: boolean
): AIModel[] {
  if (isPremium) {
    return models;
  }
  return models.filter(m => m.tier === 'FREE');
}

export function getModelTierBadge(tier?: 'FREE' | 'BUDGET' | 'MID' | 'PREMIUM'): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
} {
  switch (tier) {
    case 'FREE':
      return {
        label: 'FREE',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30'
      };
    case 'BUDGET':
      return {
        label: 'BUDGET',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30'
      };
    case 'MID':
      return {
        label: 'MID',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30'
      };
    case 'PREMIUM':
      return {
        label: 'PREMIUM',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30'
      };
    default:
      return {
        label: 'STANDARD',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
        borderColor: 'border-gray-500/30'
      };
  }
}

export function isModelLocked(model: AIModel, isPremium: boolean): boolean {
  if (isPremium) return false;
  return model.tier !== 'FREE';
}
