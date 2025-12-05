import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CheckoutRequest {
  planName?: string;
  packId?: string;
  userId: string;
  userEmail: string;
  mode?: 'subscription' | 'payment';
  amount?: number;
}

const PRICE_IDS: Record<string, string> = {
  'creator': 'price_1QJdG22KHMGXb21kp2p2p2p2',
  'pro': 'price_1QJdG22KHMGXb21kp3p3p3p3',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { planName, packId, userId, userEmail, mode = 'subscription', amount }: CheckoutRequest = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing user ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sessionConfig: any = {
      mode,
      payment_method_types: ['card'],
      success_url: `${req.headers.get('origin') || 'http://localhost:5173'}/?success=true`,
      cancel_url: `${req.headers.get('origin') || 'http://localhost:5173'}/?canceled=true`,
      client_reference_id: userId,
      customer_email: userEmail,
    };

    if (mode === 'payment' && packId && amount) {
      sessionConfig.line_items = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Message Credits Pack',
              description: 'Purchase message credits for AI chat',
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ];
      sessionConfig.metadata = {
        user_id: userId,
        pack_id: packId,
        purchase_type: 'message_pack',
      };
    } else if (mode === 'subscription' && planName) {
      const priceId = PRICE_IDS[planName.toLowerCase()];
      if (!priceId) {
        return new Response(
          JSON.stringify({ error: 'Invalid plan name' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      sessionConfig.line_items = [
        {
          price: priceId,
          quantity: 1,
        },
      ];
      sessionConfig.metadata = {
        user_id: userId,
        plan_name: planName,
      };
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid checkout configuration' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(
      JSON.stringify({ url: session.url }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Checkout error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});