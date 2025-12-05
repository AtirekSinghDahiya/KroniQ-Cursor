import { supabase } from './supabaseClient';
import { auth } from './firebase';
import { clearUnifiedCache } from './unifiedPremiumAccess';

export interface TokenPurchaseResult {
  success: boolean;
  message: string;
  newBalance: number;
  isPremium: boolean;
}

export async function handleTokenPurchase(
  tokenAmount: number,
  purchaseId: string,
  amountUSD: number = 0
): Promise<TokenPurchaseResult> {
  const userId = auth.currentUser?.uid;

  console.log('💳 [TOKEN PURCHASE] Starting token purchase handler...');
  console.log('   User ID:', userId);
  console.log('   Token Amount:', tokenAmount);
  console.log('   Amount USD:', amountUSD);
  console.log('   Purchase ID:', purchaseId);

  if (!userId) {
    console.error('❌ [TOKEN PURCHASE] No authenticated user');
    return {
      success: false,
      message: 'No authenticated user',
      newBalance: 0,
      isPremium: false
    };
  }

  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('paid_tokens_balance, can_purchase_tokens, email, display_name')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ [TOKEN PURCHASE] Failed to fetch profile:', fetchError);
      return {
        success: false,
        message: 'Failed to fetch user profile',
        newBalance: 0,
        isPremium: false
      };
    }

    if (!profile) {
      console.error('❌ [TOKEN PURCHASE] Profile not found');
      return {
        success: false,
        message: 'User profile not found',
        newBalance: 0,
        isPremium: false
      };
    }

    const currentPaidTokens = profile.paid_tokens_balance || 0;

    console.log('📊 [TOKEN PURCHASE] Current state:');
    console.log('   Current Paid Tokens:', currentPaidTokens);
    console.log('   Can Purchase:', profile.can_purchase_tokens);

    if (currentPaidTokens > 0 && profile.can_purchase_tokens === false) {
      console.warn('⚠️ [TOKEN PURCHASE] User already has paid tokens');
      return {
        success: false,
        message: 'Please use your existing tokens before purchasing more',
        newBalance: currentPaidTokens,
        isPremium: true
      };
    }

    console.log('🔄 [TOKEN PURCHASE] Calling upgrade_to_paid function...');

    const { data: upgradeResult, error: upgradeError } = await supabase.rpc('upgrade_to_paid', {
      p_user_id: userId,
      p_tokens: tokenAmount,
      p_amount_usd: amountUSD
    });

    if (upgradeError) {
      console.error('❌ [TOKEN PURCHASE] upgrade_to_paid failed:', upgradeError);
      return {
        success: false,
        message: upgradeError.message || 'Failed to upgrade account',
        newBalance: currentPaidTokens,
        isPremium: false
      };
    }

    const result = upgradeResult as { success: boolean; new_balance?: number; tier?: string; error?: string };

    if (!result.success) {
      console.error('❌ [TOKEN PURCHASE] Upgrade returned failure:', result.error);
      return {
        success: false,
        message: result.error || 'Upgrade failed',
        newBalance: currentPaidTokens,
        isPremium: false
      };
    }

    console.log('✅ [TOKEN PURCHASE] Upgrade successful!');

    await syncToPaidTierUsers(userId, profile.email, profile.display_name, 'premium', tokenAmount);

    const { error: purchaseError } = await supabase
      .from('token_purchases')
      .insert({
        user_id: userId,
        pack_id: purchaseId,
        tokens_purchased: tokenAmount,
        amount_paid_usd: amountUSD,
        purchase_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      });

    if (purchaseError) {
      console.warn('⚠️ [TOKEN PURCHASE] Failed to record purchase (non-critical):', purchaseError);
    }

    clearUnifiedCache(userId);

    console.log('✅✅✅ [TOKEN PURCHASE] Purchase completed successfully!');
    console.log('   New Paid Token Balance:', result.new_balance);
    console.log('   Tier:', result.tier);
    console.log('   Premium Status: TRUE');

    return {
      success: true,
      message: 'Welcome to Premium! You now have full access to all AI models.',
      newBalance: result.new_balance || tokenAmount,
      isPremium: true
    };

  } catch (error) {
    console.error('❌ [TOKEN PURCHASE] Exception:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      newBalance: 0,
      isPremium: false
    };
  }
}

async function syncToPaidTierUsers(
  userId: string,
  email: string,
  displayName: string | null,
  tier: string,
  tokens: number
): Promise<void> {
  console.log('🔄 [TOKEN PURCHASE] Syncing to paid_tier_users table...');

  try {
    const { error } = await supabase
      .from('paid_tier_users')
      .upsert({
        id: userId,
        email: email,
        display_name: displayName,
        tier_level: tier,
        tokens_remaining: tokens,
        total_tokens_purchased: tokens,
        upgraded_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('❌ [TOKEN PURCHASE] Failed to sync paid_tier_users:', error);
    } else {
      console.log('✅ [TOKEN PURCHASE] Synced to paid_tier_users table');
    }

    const { error: deleteError } = await supabase
      .from('free_tier_users')
      .delete()
      .eq('id', userId);

    if (deleteError && deleteError.code !== 'PGRST116') {
      console.warn('⚠️ [TOKEN PURCHASE] Failed to remove from free_tier_users:', deleteError);
    } else {
      console.log('✅ [TOKEN PURCHASE] Removed from free_tier_users table');
    }

  } catch (error) {
    console.error('❌ [TOKEN PURCHASE] Exception syncing tier tables:', error);
  }
}

export async function deductTokens(
  userId: string,
  tokenAmount: number
): Promise<boolean> {
  console.log('💸 [TOKEN DEDUCTION] Deducting tokens...');
  console.log('   User ID:', userId);
  console.log('   Amount:', tokenAmount);

  try {
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('paid_tokens_balance, daily_tokens_remaining, is_paid')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError || !profile) {
      console.error('❌ [TOKEN DEDUCTION] Failed to fetch profile');
      return false;
    }

    const isPaidUser = profile.is_paid === true;
    const paidTokens = profile.paid_tokens_balance || 0;
    const dailyTokens = profile.daily_tokens_remaining || 0;

    console.log('📊 [TOKEN DEDUCTION] Current balances:');
    console.log('   Paid Tokens:', paidTokens);
    console.log('   Daily Free:', dailyTokens);
    console.log('   Is Paid User:', isPaidUser);

    if (isPaidUser && paidTokens >= tokenAmount) {
      const { error } = await supabase
        .from('profiles')
        .update({
          paid_tokens_balance: paidTokens - tokenAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ [TOKEN DEDUCTION] Failed to deduct paid tokens:', error);
        return false;
      }

      console.log('✅ [TOKEN DEDUCTION] Deducted from paid tokens');
      return true;

    } else if (dailyTokens >= tokenAmount) {
      const { error } = await supabase
        .from('profiles')
        .update({
          daily_tokens_remaining: dailyTokens - tokenAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ [TOKEN DEDUCTION] Failed to deduct daily tokens:', error);
        return false;
      }

      console.log('✅ [TOKEN DEDUCTION] Deducted from daily free tokens');
      return true;

    } else {
      console.warn('⚠️ [TOKEN DEDUCTION] Insufficient tokens');
      return false;
    }

  } catch (error) {
    console.error('❌ [TOKEN DEDUCTION] Exception:', error);
    return false;
  }
}
