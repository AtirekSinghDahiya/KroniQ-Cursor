import { supabase } from './supabase';

export interface UsageLimitCheck {
  canProceed: boolean;
  isPaid: boolean;
  currentUsage: number;
  limit: number;
  remaining: number;
}

export class UsageLimitsService {
  static async checkAndIncrementUsage(
    userId: string,
    usageType: 'ppt' | 'image' | 'video'
  ): Promise<UsageLimitCheck> {
    try {
      const { data, error } = await supabase.rpc('increment_usage', {
        p_user_id: userId,
        p_usage_type: usageType,
      });

      if (error) {
        console.error('Error checking usage limits:', error);
        return {
          canProceed: false,
          isPaid: false,
          currentUsage: 0,
          limit: 0,
          remaining: 0,
        };
      }

      const result = data as {
        success: boolean;
        can_proceed: boolean;
        is_paid: boolean;
        usage: number;
        limit: number;
      };

      return {
        canProceed: result.can_proceed,
        isPaid: result.is_paid,
        currentUsage: result.usage,
        limit: result.limit,
        remaining: result.is_paid ? -1 : Math.max(0, result.limit - result.usage),
      };
    } catch (error) {
      console.error('Error in checkAndIncrementUsage:', error);
      return {
        canProceed: false,
        isPaid: false,
        currentUsage: 0,
        limit: 0,
        remaining: 0,
      };
    }
  }

  static async getCurrentUsage(
    userId: string
  ): Promise<{
    ppt: number;
    images: number;
    videos: number;
    isPaid: boolean;
  }> {
    try {
      const monthYear = new Date().toISOString().slice(0, 7);

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_paid')
        .eq('id', userId)
        .maybeSingle();

      const isPaid = profile?.is_paid || false;

      if (isPaid) {
        return { ppt: 0, images: 0, videos: 0, isPaid: true };
      }

      const { data, error } = await supabase
        .from('usage_limits')
        .select('ppt_generated, images_generated, videos_generated')
        .eq('user_id', userId)
        .eq('month_year', monthYear)
        .maybeSingle();

      if (error || !data) {
        return { ppt: 0, images: 0, videos: 0, isPaid: false };
      }

      return {
        ppt: data.ppt_generated || 0,
        images: data.images_generated || 0,
        videos: data.videos_generated || 0,
        isPaid: false,
      };
    } catch (error) {
      console.error('Error getting current usage:', error);
      return { ppt: 0, images: 0, videos: 0, isPaid: false };
    }
  }

  static getLimitText(type: 'ppt' | 'image' | 'video', isPaid: boolean): string {
    if (isPaid) {
      return 'Unlimited (token-based)';
    }

    const limits = {
      ppt: '3 per month',
      image: '6 per month',
      video: '1 per month',
    };

    return limits[type];
  }

  static getUpgradeMessage(type: 'ppt' | 'image' | 'video'): string {
    const messages = {
      ppt: 'Monthly limit of 3 PPTs reached. Upgrade to premium for unlimited PPT generation.',
      image: 'Monthly limit of 6 images reached. Upgrade to premium for unlimited image generation.',
      video: 'Monthly limit of 1 video reached. Upgrade to premium for unlimited video generation.',
    };

    return messages[type];
  }
}
