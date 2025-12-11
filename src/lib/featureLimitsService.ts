import { supabase } from './supabaseClient';
import { auth } from './firebase';
import { getUserAccessInfo } from './modelAccessControl';

export type FeatureType =
  | 'chat_message'
  | 'image_generation'
  | 'video_generation'
  | 'music_generation'
  | 'tts_request'
  | 'code_generation'
  | 'ppt_generation';

export interface FeatureLimits {
  chat_messages_daily: number;
  images_daily: number;
  videos_daily: number;
  music_daily: number;
  tts_daily: number;
  code_generations_daily: number;
  ppt_daily: number;
}

export interface FeatureUsage {
  chat_messages: number;
  images: number;
  videos: number;
  music: number;
  tts: number;
  code_generations: number;
  ppt: number;
  last_reset: Date;
}

export interface FeatureAccessResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  requiresUpgrade: boolean;
  message?: string;
}

const FREE_USER_LIMITS: FeatureLimits = {
  chat_messages_daily: 100,
  images_daily: 10,
  videos_daily: 2,
  music_daily: 5,
  tts_daily: 10,
  code_generations_daily: 50,
  ppt_daily: 5
};

const PAID_USER_LIMITS: FeatureLimits = {
  chat_messages_daily: -1,
  images_daily: -1,
  videos_daily: -1,
  music_daily: -1,
  tts_daily: -1,
  code_generations_daily: -1,
  ppt_daily: -1
};

export function getFeatureLimits(isPremium: boolean): FeatureLimits {
  return isPremium ? PAID_USER_LIMITS : FREE_USER_LIMITS;
}

export async function getCurrentUsage(userId?: string): Promise<FeatureUsage | null> {
  const uid = userId || auth.currentUser?.uid;
  if (!uid) return null;

  try {
    const { data, error } = await supabase
      .from('daily_usage_limits')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching usage:', error);
      return null;
    }

    if (!data) {
      await initializeUsageRecord(uid);
      return {
        chat_messages: 0,
        images: 0,
        videos: 0,
        music: 0,
        tts: 0,
        code_generations: 0,
        ppt: 0,
        last_reset: new Date()
      };
    }

    const lastReset = new Date(data.last_reset);
    const now = new Date();
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      await resetDailyUsage(uid);
      return {
        chat_messages: 0,
        images: 0,
        videos: 0,
        music: 0,
        tts: 0,
        code_generations: 0,
        ppt: 0,
        last_reset: now
      };
    }

    return {
      chat_messages: data.chat_messages || 0,
      images: data.images_used || 0,
      videos: data.videos_used || 0,
      music: data.music_used || 0,
      tts: data.tts_used || 0,
      code_generations: data.code_generations || 0,
      ppt: data.ppt_used || 0,
      last_reset: lastReset
    };
  } catch (error) {
    console.error('Exception in getCurrentUsage:', error);
    return null;
  }
}

async function initializeUsageRecord(userId: string): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type, is_paid')
      .eq('id', userId)
      .maybeSingle();

    const userType = profile?.user_type || (profile?.is_paid ? 'paid' : 'free');

    await supabase
      .from('daily_usage_limits')
      .insert({
        user_id: userId,
        user_type: userType,
        chat_messages: 0,
        images_used: 0,
        videos_used: 0,
        music_used: 0,
        tts_used: 0,
        code_generations: 0,
        last_reset: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error initializing usage record:', error);
  }
}

async function resetDailyUsage(userId: string): Promise<void> {
  try {
    await supabase
      .from('daily_usage_limits')
      .update({
        chat_messages: 0,
        images_used: 0,
        videos_used: 0,
        music_used: 0,
        tts_used: 0,
        code_generations: 0,
        last_reset: new Date().toISOString()
      })
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error resetting daily usage:', error);
  }
}

export async function checkFeatureAccess(
  featureType: FeatureType,
  amount: number = 1,
  userId?: string
): Promise<FeatureAccessResult> {
  const uid = userId || auth.currentUser?.uid;

  if (!uid) {
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      requiresUpgrade: true,
      message: 'User not authenticated'
    };
  }

  const accessInfo = await getUserAccessInfo(uid);

  if (!accessInfo) {
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      requiresUpgrade: true,
      message: 'Could not fetch user information'
    };
  }

  if (accessInfo.isPremium || accessInfo.userType === 'paid') {
    return {
      allowed: true,
      remaining: -1,
      limit: -1,
      requiresUpgrade: false
    };
  }

  const usage = await getCurrentUsage(uid);
  const limits = getFeatureLimits(false);

  if (!usage) {
    return {
      allowed: true,
      remaining: 0,
      limit: 0,
      requiresUpgrade: false
    };
  }

  const featureMap: Record<FeatureType, { used: number; limit: number }> = {
    chat_message: { used: usage.chat_messages, limit: limits.chat_messages_daily },
    image_generation: { used: usage.images, limit: limits.images_daily },
    video_generation: { used: usage.videos, limit: limits.videos_daily },
    music_generation: { used: usage.music, limit: limits.music_daily },
    tts_request: { used: usage.tts, limit: limits.tts_daily },
    code_generation: { used: usage.code_generations, limit: limits.code_generations_daily },
    ppt_generation: { used: usage.ppt, limit: limits.ppt_daily }
  };

  const feature = featureMap[featureType];
  const remaining = feature.limit - feature.used;
  const allowed = remaining >= amount;

  return {
    allowed,
    remaining: Math.max(0, remaining),
    limit: feature.limit,
    requiresUpgrade: !allowed,
    message: allowed
      ? undefined
      : `Daily limit reached (${feature.limit}). Upgrade to Premium for unlimited access.`
  };
}

export async function incrementUsage(
  featureType: FeatureType,
  amount: number = 1,
  userId?: string
): Promise<boolean> {
  const uid = userId || auth.currentUser?.uid;
  if (!uid) return false;

  const accessInfo = await getUserAccessInfo(uid);

  if (accessInfo && (accessInfo.isPremium || accessInfo.userType === 'paid')) {
    return true;
  }

  try {
    const columnMap: Record<FeatureType, string> = {
      chat_message: 'chat_messages',
      image_generation: 'images_used',
      video_generation: 'videos_used',
      music_generation: 'music_used',
      tts_request: 'tts_used',
      code_generation: 'code_generations',
      ppt_generation: 'ppt_used'
    };

    const column = columnMap[featureType];

    const { data: existing } = await supabase
      .from('daily_usage_limits')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (!existing) {
      await initializeUsageRecord(uid);
    }

    const { error } = await supabase.rpc('increment_usage', {
      p_user_id: uid,
      p_column: column,
      p_amount: amount
    });

    if (error) {
      console.error('Error incrementing usage:', error);

      const { error: updateError } = await supabase
        .from('daily_usage_limits')
        .update({
          [column]: supabase.raw(`${column} + ${amount}`)
        })
        .eq('user_id', uid);

      return !updateError;
    }

    return true;
  } catch (error) {
    console.error('Exception in incrementUsage:', error);
    return false;
  }
}

export async function getUsagePercentage(
  featureType: FeatureType,
  userId?: string
): Promise<number> {
  const accessResult = await checkFeatureAccess(featureType, 0, userId);

  if (accessResult.limit === -1) {
    return 0;
  }

  const used = accessResult.limit - accessResult.remaining;
  return (used / accessResult.limit) * 100;
}

export async function getAllUsageStats(userId?: string): Promise<Record<FeatureType, FeatureAccessResult>> {
  const features: FeatureType[] = [
    'chat_message',
    'image_generation',
    'video_generation',
    'music_generation',
    'tts_request',
    'code_generation',
    'ppt_generation'
  ];

  const stats: Record<string, FeatureAccessResult> = {};

  for (const feature of features) {
    stats[feature] = await checkFeatureAccess(feature, 0, userId);
  }

  return stats as Record<FeatureType, FeatureAccessResult>;
}
