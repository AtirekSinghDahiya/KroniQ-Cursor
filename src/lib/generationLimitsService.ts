import { supabase } from './supabase';
import { getUserAccessInfo } from './modelAccessControl';
import { getUserTier } from './userTierService';

export type GenerationType = 'image' | 'video' | 'song' | 'tts' | 'ppt';

export interface GenerationLimitInfo {
  canGenerate: boolean;
  current: number;
  limit: number;
  isPaid: boolean;
  message: string;
}

export async function checkGenerationLimit(
  userId: string,
  generationType: GenerationType
): Promise<GenerationLimitInfo> {
  try {
    console.log('📊 Checking generation limit:', { userId, generationType });

    const tierInfo = await getUserTier(userId);
    const userType = tierInfo.isPremium ? 'paid' : 'free';
    console.log('👤 User type from tier service:', userType, 'isPremium:', tierInfo.isPremium);

    const { data, error } = await supabase.rpc('check_generation_limit', {
      p_user_id: userId,
      p_generation_type: generationType,
      p_user_type: userType
    });

    if (error) {
      console.error('❌ Error checking generation limit:', error);
      return {
        canGenerate: false,
        current: 0,
        limit: 0,
        isPaid: false,
        message: 'Error checking limit'
      };
    }

    console.log('✅ Generation limit check result:', data);

    return {
      canGenerate: data.can_generate,
      current: data.current,
      limit: data.limit,
      isPaid: data.is_paid,
      message: data.message
    };
  } catch (error) {
    console.error('❌ Exception checking generation limit:', error);
    return {
      canGenerate: false,
      current: 0,
      limit: 0,
      isPaid: false,
      message: 'Error checking limit'
    };
  }
}

export async function incrementGenerationCount(
  userId: string,
  generationType: GenerationType
): Promise<boolean> {
  try {
    console.log('➕ Incrementing generation count:', { userId, generationType });

    const { data, error } = await supabase.rpc('increment_generation', {
      p_user_id: userId,
      p_generation_type: generationType
    });

    if (error) {
      console.error('❌ Error incrementing generation count:', error);
      return false;
    }

    console.log('✅ Successfully incremented generation count:', data);
    return data === true;
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
      return '3 images per month';
    case 'video':
      return '1 video per month';
    case 'song':
      return '2 songs per month';
    case 'tts':
      return '3 TTS per month';
    case 'ppt':
      return '1 PPT per month';
    default:
      return 'Unknown limit';
  }
}
