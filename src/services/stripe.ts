import { supabase } from '../lib/supabase'

export interface CreateCheckoutSessionParams {
  priceId: string
  mode: 'subscription' | 'payment'
  successUrl?: string
  cancelUrl?: string
}

export async function createCheckoutSession({
  priceId,
  mode,
  successUrl = `${window.location.origin}/success`,
  cancelUrl = `${window.location.origin}/pricing`,
}: CreateCheckoutSessionParams) {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session?.access_token) {
    throw new Error('No authentication token found')
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      price_id: priceId,
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create checkout session')
  }

  const { url } = await response.json()
  return url
}