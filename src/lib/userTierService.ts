import { supabase } from './supabase';

export interface UserTierInfo {
  tier: 'free' | 'premium';
  isPremium: boolean;
  hasPaidTokens: boolean;
  tokenBalance: number;
  freeTokens: number;
  paidTokens: number;
}

export async function getUserTier(userId: string): Promise<UserTierInfo> {
  try {
    console.log('🔍 [TierService] Getting user tier for:', userId);

    const { data, error } = await supabase
      .rpc('get_user_tier', { p_user_id: userId })
      .maybeSingle();

    if (error) {
      console.error('❌ [TierService] Error getting user tier:', error);
      return {
        tier: 'free',
        isPremium: false,
        hasPaidTokens: false,
        tokenBalance: 0,
        freeTokens: 0,
        paidTokens: 0
      };
    }

    if (!data) {
      console.warn('⚠️ [TierService] No tier data found for user');
      return {
        tier: 'free',
        isPremium: false,
        hasPaidTokens: false,
        tokenBalance: 0,
        freeTokens: 0,
        paidTokens: 0
      };
    }

    const tierInfo: UserTierInfo = {
      tier: data.tier as 'free' | 'premium',
      isPremium: data.is_premium,
      hasPaidTokens: data.has_paid_tokens,
      tokenBalance: data.token_balance,
      freeTokens: data.free_tokens,
      paidTokens: data.paid_tokens
    };

    console.log('✅ [TierService] User tier info:', tierInfo);

    return tierInfo;
  } catch (err) {
    console.error('❌ [TierService] Exception getting user tier:', err);
    return {
      tier: 'free',
      isPremium: false,
      hasPaidTokens: false,
      tokenBalance: 0,
      freeTokens: 0,
      paidTokens: 0
    };
  }
}

export async function isUserPremium(userId: string): Promise<boolean> {
  const tierInfo = await getUserTier(userId);
  return tierInfo.isPremium;
}

export async function getUserTokenBalance(userId: string): Promise<number> {
  const tierInfo = await getUserTier(userId);
  return tierInfo.tokenBalance;
}
