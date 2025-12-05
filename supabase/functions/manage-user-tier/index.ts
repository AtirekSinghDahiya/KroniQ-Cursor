import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface UpgradeRequest {
  action: 'upgrade' | 'downgrade' | 'check_grace_periods';
  userId?: string;
  tokensPurchased?: number;
  stripeCustomerId?: string;
  reason?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { action, userId, tokensPurchased, stripeCustomerId, reason }: UpgradeRequest = await req.json();

    if (action === 'upgrade') {
      if (!userId || !tokensPurchased) {
        return new Response(
          JSON.stringify({ error: 'userId and tokensPurchased required for upgrade' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await upgradeUserToPaidTier(userId, tokensPurchased, stripeCustomerId);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'downgrade') {
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'userId required for downgrade' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await downgradeUserToFreeTier(userId, reason || 'manual', 24);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'check_grace_periods') {
      const result = await checkExpiredGracePeriods();
      return new Response(
        JSON.stringify({ success: true, usersTransitioned: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error managing tier:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function upgradeUserToPaidTier(
  userId: string,
  tokensPurchased: number,
  stripeCustomerId?: string
) {
  console.log('🔄 Upgrading user to paid tier:', { userId, tokensPurchased });

  try {
    const { data, error } = await supabase.rpc('upgrade_user_to_paid_tier', {
      p_user_id: userId,
      p_tokens_added: tokensPurchased
    });

    if (error) {
      console.error('Error calling upgrade function:', error);
      throw error;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('paid_tokens_balance')
      .eq('id', userId)
      .maybeSingle();

    const newBalance = profile?.paid_tokens_balance || tokensPurchased;

    await queueNotification(
      userId,
      'upgraded_to_paid',
      'Welcome to Premium!',
      `You now have full access to all premium AI models. Token balance: ${newBalance.toLocaleString()}`
    );

    console.log('✅ User successfully upgraded to paid tier');

    return {
      success: true,
      message: 'Upgraded to paid tier',
      newTier: 'paid',
      tokensBalance: newBalance
    };
  } catch (error: any) {
    console.error('Failed to upgrade user:', error);
    throw error;
  }
}

async function downgradeUserToFreeTier(
  userId: string,
  reason: string,
  gracePeriodHours: number
) {
  console.log('🔽 Downgrading user to free tier:', { userId, reason, gracePeriodHours });

  try {
    const { data, error } = await supabase.rpc('downgrade_user_to_free_tier', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error calling downgrade function:', error);
      throw error;
    }

    await queueNotification(
      userId,
      'downgraded_to_free',
      'Account Moved to Free Tier',
      'Your token balance has been depleted. Purchase tokens to regain premium access.'
    );

    console.log('✅ User successfully downgraded to free tier');

    return { success: true, message: 'Downgraded to free tier', newTier: 'free' };
  } catch (error: any) {
    console.error('Failed to downgrade user:', error);
    throw error;
  }
}

async function checkExpiredGracePeriods() {
  const { data: expiredUsers } = await supabase
    .from('profiles')
    .select('id')
    .eq('in_grace_period', true)
    .lt('grace_period_ends_at', new Date().toISOString());

  if (!expiredUsers) return 0;

  let count = 0;
  for (const user of expiredUsers) {
    await downgradeUserToFreeTier(user.id, 'grace_period_expired', 0);
    count++;
  }

  return count;
}

async function queueNotification(
  userId: string,
  type: string,
  subject: string,
  message: string
) {
  await supabase.from('notification_queue').insert({
    user_id: userId,
    notification_type: type,
    subject,
    message,
    status: 'pending'
  });
}
