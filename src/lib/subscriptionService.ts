import { supabase } from './supabaseClient';
import { auth } from './firebase';

export interface PlanLimits {
  chat_messages_daily: number;
  code_projects: number;
  code_lines_per_project: number;
  images_monthly: number;
  videos_monthly: number;
  storage_mb: number;
}

export interface UserSubscription {
  plan_name: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  auto_renew: boolean;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  starter: {
    chat_messages_daily: 30,
    code_projects: 2,
    code_lines_per_project: 500,
    images_monthly: 10,
    videos_monthly: 2,
    storage_mb: 200,
  },
  creator: {
    chat_messages_daily: -1,
    code_projects: 10,
    code_lines_per_project: 2000,
    images_monthly: 50,
    videos_monthly: 10,
    storage_mb: 2048,
  },
  pro: {
    chat_messages_daily: -1,
    code_projects: -1,
    code_lines_per_project: -1,
    images_monthly: -1,
    videos_monthly: 25,
    storage_mb: 10240,
  },
  enterprise: {
    chat_messages_daily: -1,
    code_projects: -1,
    code_lines_per_project: -1,
    images_monthly: -1,
    videos_monthly: -1,
    storage_mb: 102400,
  },
};

export async function getUserPlan(): Promise<string> {
  const user = auth.currentUser;
  if (!user) return 'starter';

  try {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('plan_name, status, expires_at')
      .eq('user_id', user.uid)
      .maybeSingle();

    if (!subscription || subscription.status !== 'active') {
      return 'starter';
    }

    if (subscription.expires_at) {
      const expiresAt = new Date(subscription.expires_at);
      if (expiresAt < new Date()) {
        await downgradeExpiredSubscription(user.uid);
        return 'starter';
      }
    }

    return subscription.plan_name;
  } catch (error) {
    console.error('Error getting user plan:', error);
    return 'starter';
  }
}

export async function getUserSubscription(): Promise<UserSubscription | null> {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.uid)
      .maybeSingle();

    return subscription;
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return null;
  }
}

export async function getPlanLimits(planName?: string): Promise<PlanLimits> {
  const plan = planName || (await getUserPlan());
  return PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
}

export async function checkFeatureAccess(feature: keyof PlanLimits): Promise<{ allowed: boolean; limit: number; usage: number }> {
  const user = auth.currentUser;
  if (!user) {
    return { allowed: false, limit: 0, usage: 0 };
  }

  const plan = await getUserPlan();
  const limits = await getPlanLimits(plan);
  const limit = limits[feature];

  if (limit === -1) {
    return { allowed: true, limit: -1, usage: 0 };
  }

  const usage = await getCurrentUsage(feature);

  return {
    allowed: usage < limit,
    limit,
    usage,
  };
}

export async function getCurrentUsage(resourceType: keyof PlanLimits): Promise<number> {
  const user = auth.currentUser;
  if (!user) return 0;

  try {
    const now = new Date();
    const periodStart = new Date(now);

    if (resourceType === 'chat_messages_daily') {
      periodStart.setHours(0, 0, 0, 0);
    } else if (resourceType.includes('monthly')) {
      periodStart.setDate(1);
      periodStart.setHours(0, 0, 0, 0);
    } else {
      periodStart.setFullYear(2000);
    }

    const { data, error } = await supabase
      .from('usage_tracking')
      .select('amount')
      .eq('user_id', user.uid)
      .eq('resource_type', resourceType)
      .gte('period_start', periodStart.toISOString())
      .maybeSingle();

    if (error) {
      console.error('Error fetching usage:', error);
      return 0;
    }

    return data?.amount || 0;
  } catch (error) {
    console.error('Error getting current usage:', error);
    return 0;
  }
}

export async function incrementUsage(resourceType: keyof PlanLimits, amount: number = 1): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const now = new Date();
    const periodStart = new Date(now);
    const periodEnd = new Date(now);

    if (resourceType === 'chat_messages_daily') {
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setDate(periodEnd.getDate() + 1);
      periodEnd.setHours(0, 0, 0, 0);
    } else if (resourceType.includes('monthly')) {
      periodStart.setDate(1);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(1);
      periodEnd.setHours(0, 0, 0, 0);
    } else {
      periodStart.setFullYear(2000);
      periodEnd.setFullYear(2100);
    }

    const { data: existing } = await supabase
      .from('usage_tracking')
      .select('id, amount')
      .eq('user_id', user.uid)
      .eq('resource_type', resourceType)
      .gte('period_start', periodStart.toISOString())
      .lte('period_start', periodEnd.toISOString())
      .maybeSingle();

    if (existing) {
      await supabase
        .from('usage_tracking')
        .update({
          amount: existing.amount + amount,
          updated_at: now.toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('usage_tracking')
        .insert({
          user_id: user.uid,
          resource_type: resourceType,
          amount: amount,
          period_start: periodStart.toISOString(),
          period_end: periodEnd.toISOString(),
        });
    }
  } catch (error) {
    console.error('Error incrementing usage:', error);
  }
}

export async function downgradeExpiredSubscription(userId: string): Promise<void> {
  try {
    await supabase
      .from('user_subscriptions')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    await supabase
      .from('profiles')
      .update({
        plan: 'starter',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    console.log(`Subscription downgraded for user: ${userId}`);
  } catch (error) {
    console.error('Error downgrading subscription:', error);
  }
}

export async function cancelSubscription(): Promise<{ success: boolean; message: string }> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, message: 'User not authenticated' };
  }

  try {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.uid)
      .maybeSingle();

    if (!subscription) {
      return { success: false, message: 'No active subscription found' };
    }

    await supabase
      .from('user_subscriptions')
      .update({
        auto_renew: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.uid);

    return {
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period',
    };
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return { success: false, message: error.message || 'Failed to cancel subscription' };
  }
}

export async function checkSubscriptionExpiration(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.uid)
      .eq('status', 'active')
      .maybeSingle();

    if (!subscription || !subscription.expires_at) return;

    const expiresAt = new Date(subscription.expires_at);
    const now = new Date();

    if (expiresAt < now) {
      await downgradeExpiredSubscription(user.uid);
    }
  } catch (error) {
    console.error('Error checking subscription expiration:', error);
  }
}
