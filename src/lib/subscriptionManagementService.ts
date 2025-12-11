/**
 * Subscription Management Service
 * Uses Firestore for token pack management
 */

import { getTokenPacks as getFirestoreTokenPacks, getTotalTokens as getTotal, type TokenPack } from './firestoreService';

export type { TokenPack };

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

/**
 * Get all available token packs
 */
export async function getTokenPacks(): Promise<TokenPack[]> {
  return getFirestoreTokenPacks();
}

/**
 * Calculate total tokens including bonus
 */
export function getTotalTokens(baseTokens: number, bonusTokens: number): number {
  return getTotal(baseTokens, bonusTokens);
}

/**
 * Calculate savings for recurring vs one-time
 */
export function calculateSavings(oneTimePrice: number): number {
  return Math.round(oneTimePrice * 0.1 * 100) / 100;
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
 * Get user's active subscription (placeholder for Stripe integration)
 */
export async function getActiveSubscription(userId: string): Promise<Subscription | null> {
  // TODO: Implement with Stripe + Firestore when needed
  console.log('getActiveSubscription called for:', userId);
  return null;
}

/**
 * Get all subscriptions for a user (placeholder)
 */
export async function getUserSubscriptions(userId: string): Promise<Subscription[]> {
  // TODO: Implement with Stripe + Firestore when needed
  console.log('getUserSubscriptions called for:', userId);
  return [];
}

/**
 * Cancel subscription (placeholder)
 */
export async function cancelSubscription(
  userId: string,
  subscriptionId: string
): Promise<{ success: boolean; error?: string; stripeSubscriptionId?: string }> {
  // TODO: Implement with Stripe + Firestore when needed
  console.log('cancelSubscription called:', userId, subscriptionId);
  return { success: false, error: 'Not implemented' };
}

/**
 * Get subscription renewal history (placeholder)
 */
export async function getSubscriptionRenewals(userId: string): Promise<SubscriptionRenewal[]> {
  // TODO: Implement with Firestore when needed
  console.log('getSubscriptionRenewals called for:', userId);
  return [];
}

/**
 * Create or update subscription in database (placeholder)
 */
export async function upsertSubscription(subscription: Partial<Subscription>): Promise<boolean> {
  // TODO: Implement with Firestore when needed
  console.log('upsertSubscription called:', subscription);
  return false;
}
