/**
 * Subscription Management Service
 * Handles recurring billing for token packs
 */

import { supabase } from './supabase';

export interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  packId: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  tokensPerRefill: number;
  pricePerCycle: number;
  packName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionRenewal {
  id: string;
  subscriptionId: string;
  userId: string;
  tokensAdded: number;
  amountPaid: number;
  stripeInvoiceId?: string;
  renewedAt: string;
}

export interface TokenPack {
  id: string;
  name: string;
  tokens: number;
  priceUsd: number;
  recurringPriceUsd: number;
  stripePriceId?: string;
  stripeRecurringPriceId?: string;
  popular: boolean;
  bonusTokens: number;
  active: boolean;
}

/**
 * Get all available token packs
 */
export async function getTokenPacks(): Promise<TokenPack[]> {
  try {
    const { data, error } = await supabase
      .from('token_packs')
      .select('*')
      .eq('active', true)
      .order('price_usd', { ascending: true });

    if (error) {
      console.error('Error fetching token packs:', error);
      return [];
    }

    return (data || []).map(pack => ({
      id: pack.id,
      name: pack.name,
      tokens: pack.tokens,
      priceUsd: pack.price_usd,
      recurringPriceUsd: pack.price_usd * 0.9,
      stripePriceId: pack.stripe_price_id,
      stripeRecurringPriceId: null,
      popular: pack.popular,
      bonusTokens: pack.bonus_tokens || 0,
      active: pack.active,
    }));
  } catch (error) {
    console.error('Error in getTokenPacks:', error);
    return [];
  }
}

/**
 * Get user's active subscription
 */
export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  try {
    const { data, error } = await supabase.rpc('get_active_subscription', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error fetching active subscription:', error);
      return null;
    }

    if (!data || data.active === false) {
      return null;
    }

    return {
      id: data.id,
      userId: userId,
      stripeSubscriptionId: data.stripe_subscription_id || '',
      stripeCustomerId: data.stripe_customer_id || '',
      packId: data.pack_id || '',
      status: data.status,
      currentPeriodStart: data.current_period_start,
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end,
      tokensPerRefill: data.tokens_per_refill,
      pricePerCycle: data.price_per_cycle,
      packName: data.pack_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at || data.created_at,
    };
  } catch (error) {
    console.error('Error in getActiveSubscription:', error);
    return null;
  }
}

/**
 * Get all subscriptions for a user
 */
export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        token_packs (
          name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return [];
    }

    return (data || []).map(sub => ({
      id: sub.id,
      userId: sub.user_id,
      stripeSubscriptionId: sub.stripe_subscription_id,
      stripeCustomerId: sub.stripe_customer_id,
      packId: sub.pack_id,
      status: sub.status,
      currentPeriodStart: sub.current_period_start,
      currentPeriodEnd: sub.current_period_end,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      tokensPerRefill: sub.tokens_per_refill,
      pricePerCycle: sub.price_per_cycle,
      packName: (sub.token_packs as any)?.name,
      createdAt: sub.created_at,
      updatedAt: sub.updated_at,
    }));
  } catch (error) {
    console.error('Error in getUserSubscriptions:', error);
    return [];
  }
}

/**
 * Get subscription renewal history
 */
export async function getSubscriptionRenewals(userId: string): Promise<SubscriptionRenewal[]> {
  try {
    const { data, error } = await supabase
      .from('subscription_renewals')
      .select('*')
      .eq('user_id', userId)
      .order('renewed_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching renewals:', error);
      return [];
    }

    return (data || []).map(renewal => ({
      id: renewal.id,
      subscriptionId: renewal.subscription_id,
      userId: renewal.user_id,
      tokensAdded: renewal.tokens_added,
      amountPaid: renewal.amount_paid,
      stripeInvoiceId: renewal.stripe_invoice_id,
      renewedAt: renewal.renewed_at,
    }));
  } catch (error) {
    console.error('Error in getSubscriptionRenewals:', error);
    return [];
  }
}

/**
 * Cancel subscription (at end of period)
 */
export async function cancelSubscription(
  userId: string,
  subscriptionId: string
): Promise<{ success: boolean; error?: string; stripeSubscriptionId?: string }> {
  try {
    const { data, error } = await supabase.rpc('cancel_subscription', {
      p_user_id: userId,
      p_subscription_id: subscriptionId,
    });

    if (error) {
      console.error('Error canceling subscription:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error,
      };
    }

    return {
      success: true,
      stripeSubscriptionId: data.stripe_subscription_id,
    };
  } catch (error: any) {
    console.error('Error in cancelSubscription:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Create or update subscription in database
 */
export async function upsertSubscription(subscription: Partial<Subscription>): Promise<boolean> {
  try {
    const { error } = await supabase.from('subscriptions').upsert(
      {
        id: subscription.id,
        user_id: subscription.userId,
        stripe_subscription_id: subscription.stripeSubscriptionId,
        stripe_customer_id: subscription.stripeCustomerId,
        pack_id: subscription.packId,
        status: subscription.status,
        current_period_start: subscription.currentPeriodStart,
        current_period_end: subscription.currentPeriodEnd,
        cancel_at_period_end: subscription.cancelAtPeriodEnd,
        tokens_per_refill: subscription.tokensPerRefill,
        price_per_cycle: subscription.pricePerCycle,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'stripe_subscription_id',
      }
    );

    if (error) {
      console.error('Error upserting subscription:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in upsertSubscription:', error);
    return false;
  }
}

/**
 * Format next billing date
 */
export function formatNextBillingDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Calculate savings for recurring vs one-time
 */
export function calculateSavings(oneTimePrice: number): number {
  return Math.round(oneTimePrice * 0.1 * 100) / 100;
}

/**
 * Calculate total tokens including bonus
 */
export function getTotalTokens(baseTokens: number, bonusTokens: number): number {
  return baseTokens + bonusTokens;
}
