import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface UserTierInfo {
  tier: 'free' | 'premium';
  isPremium: boolean;
  hasPaidTokens: boolean;
  tokenBalance: number;
  freeTokens: number;
  paidTokens: number;
}

/**
 * Get user tier information from Firebase Firestore
 */
export async function getUserTier(userId: string): Promise<UserTierInfo> {
  try {

    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return getDefaultTierInfo();
    }

    const userData = userDoc.data();
    const tokensLimit = userData.tokensLimit || 0;
    const tokensUsed = userData.tokensUsed || 0;
    const tokenBalance = tokensLimit - tokensUsed;
    const plan = userData.plan || 'free';
    const isPremium = plan === 'premium' || plan === 'paid' || tokenBalance > 500000;

    const tierInfo: UserTierInfo = {
      tier: isPremium ? 'premium' : 'free',
      isPremium,
      hasPaidTokens: tokenBalance > 100000,
      tokenBalance,
      freeTokens: isPremium ? 0 : tokenBalance,
      paidTokens: isPremium ? tokenBalance : 0
    };

    return tierInfo;
  } catch (err) {
    console.error('❌ [TierService] Exception getting user tier:', err);
    return getDefaultTierInfo();
  }
}

function getDefaultTierInfo(): UserTierInfo {
  return {
    tier: 'free',
    isPremium: false,
    hasPaidTokens: false,
    tokenBalance: 0,
    freeTokens: 0,
    paidTokens: 0
  };
}

export async function isUserPremium(userId: string): Promise<boolean> {
  const tierInfo = await getUserTier(userId);
  return tierInfo.isPremium;
}

export async function getUserTokenBalance(userId: string): Promise<number> {
  const tierInfo = await getUserTier(userId);
  return tierInfo.tokenBalance;
}
