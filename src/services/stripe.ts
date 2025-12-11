/**
 * Stripe Service
 * Uses Firebase Auth for authentication
 * 
 * Note: Stripe checkout functionality is currently disabled since
 * the Supabase backend is no longer available. This needs to be
 * re-implemented with a Firebase Cloud Function or external backend.
 */

import { auth } from '../lib/firebase';

export interface CreateCheckoutSessionParams {
  priceId: string;
  mode: 'subscription' | 'payment';
  successUrl?: string;
  cancelUrl?: string;
}

export async function createCheckoutSession({
  priceId,
  mode,
  successUrl = `${window.location.origin}/success`,
  cancelUrl = `${window.location.origin}/pricing`,
}: CreateCheckoutSessionParams): Promise<string> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error('No authenticated user found');
  }

  // Get Firebase ID token for authentication
  const idToken = await user.getIdToken();

  // TODO: Implement Stripe checkout with Firebase Cloud Function
  // For now, throw an error since the Supabase function is no longer available
  console.warn('Stripe checkout needs to be re-implemented with Firebase Cloud Functions');
  console.log('Would create checkout session:', {
    priceId,
    mode,
    successUrl,
    cancelUrl,
    userId: user.uid,
  });

  throw new Error(
    'Stripe checkout is temporarily unavailable. Please contact support for payment options.'
  );

  // When implementing with Firebase Cloud Functions, use this pattern:
  /*
  const response = await fetch('YOUR_CLOUD_FUNCTION_URL/stripe-checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      price_id: priceId,
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }

  const { url } = await response.json();
  return url;
  */
}