import { auth, db } from './firebase';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { getUserTier } from './userTierService';

export type GenerationType = 'image' | 'video' | 'song' | 'tts' | 'ppt';

export interface GenerationLimitInfo {
  canGenerate: boolean;
  current: number;
  limit: number;
  isPaid: boolean;
  message: string;
}

// Free tier daily limits
const FREE_TIER_LIMITS: Record<GenerationType, number> = {
  image: 7,
  video: 2,
  song: 2,
  tts: 10,
  ppt: 1
};

// Paid tier has unlimited usage (just token deduction)
const PAID_TIER_LIMITS: Record<GenerationType, number> = {
  image: 999999,
  video: 999999,
  song: 999999,
  tts: 999999,
  ppt: 999999
};

/**
 * Check if user can generate content of a specific type
 */
export async function checkGenerationLimit(
  userId: string,
  generationType: GenerationType
): Promise<GenerationLimitInfo> {
  try {
    const tierInfo = await getUserTier(userId);
    const isPaid = tierInfo.isPremium;
    const limits = isPaid ? PAID_TIER_LIMITS : FREE_TIER_LIMITS;
    const limit = limits[generationType];

    // Get current generation count from Firestore daily_usage
    // Matches the incrementUsage logic in firestoreService.ts
    const today = new Date().toISOString().split('T')[0];
    const dailyRef = doc(db, 'daily_usage', `${userId}_${today}`);
    const dailyDoc = await getDoc(dailyRef);

    let current = 0;
    if (dailyDoc.exists()) {
      const data = dailyDoc.data();

      // Map GenerationType to field names used in firestoreService.ts
      const fieldMap: Record<GenerationType, string> = {
        image: 'imagesGenerated',
        video: 'videosGenerated',
        song: 'musicGenerated',
        tts: 'ttsGenerated',
        ppt: 'pptGenerated'
      };

      const fieldName = fieldMap[generationType];
      current = data[fieldName] || 0;
    }

    const canGenerate = isPaid || current < limit;
    const message = canGenerate
      ? `${current}/${limit} used`
      : `Daily limit reached (${limit}). Upgrade to premium for unlimited access.`;

    return {
      canGenerate,
      current,
      limit,
      isPaid,
      message
    };
  } catch (error) {
    console.error('❌ Exception checking generation limit:', error);
    // On error, allow generation but log it
    return {
      canGenerate: true,
      current: 0,
      limit: FREE_TIER_LIMITS[generationType],
      isPaid: false,
      message: 'Unable to check limit, allowing generation'
    };
  }
}

/**
 * Increment the generation count for a user
 */
export async function incrementGenerationCount(
  userId: string,
  generationType: GenerationType
): Promise<boolean> {
  try {

    const countDocRef = doc(db, 'generationCounts', `${userId}_${generationType}`);
    const countDoc = await getDoc(countDocRef);

    if (countDoc.exists()) {
      await updateDoc(countDocRef, {
        count: increment(1),
        lastUpdated: serverTimestamp()
      });
    } else {
      await setDoc(countDocRef, {
        userId,
        generationType,
        count: 1,
        lastReset: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
    }

    return true;
  } catch (error) {
    console.error('❌ Exception incrementing generation count:', error);
    return false;
  }
}

export function getGenerationLimitText(type: GenerationType, userType: 'free' | 'paid'): string {
  if (userType === 'paid') {
    return 'Unlimited (token-based)';
  }

  switch (type) {
    case 'image':
      return '7 images per day';
    case 'video':
      return '2 videos per day';
    case 'song':
      return '2 songs per day';
    case 'tts':
      return '10 TTS per day';
    case 'ppt':
      return '1 PPT per day';
    default:
      return 'Unknown limit';
  }
}

/**
 * Get all generation limits for a user
 */
export async function getAllGenerationLimits(userId: string): Promise<Record<GenerationType, GenerationLimitInfo>> {
  const types: GenerationType[] = ['image', 'video', 'song', 'tts', 'ppt'];
  const result: Record<GenerationType, GenerationLimitInfo> = {} as any;

  for (const type of types) {
    result[type] = await checkGenerationLimit(userId, type);
  }

  return result;
}
