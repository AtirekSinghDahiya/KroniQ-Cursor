import { supabase } from './supabaseClient';

export async function isPremiumUser(userId: string): Promise<boolean> {
  if (!userId) return false;

  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('paid_tokens_balance, tokens_balance, free_tokens_balance, is_premium, current_tier')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error checking premium status from profiles:', profileError);
      return false;
    }

    if (profileData) {
      const totalTokens = (profileData.paid_tokens_balance || 0) +
                         (profileData.tokens_balance || 0);

      const hasPaidTokens = totalTokens > 0;
      const isPremiumFlag = profileData.is_premium === true;
      const isPremiumTier = profileData.current_tier === 'premium';

      const isPremium = hasPaidTokens || isPremiumFlag || isPremiumTier;

      console.log(`✅ User ${userId} premium check:`, {
        paid_tokens: profileData.paid_tokens_balance,
        tokens_balance: profileData.tokens_balance,
        total_tokens: totalTokens,
        is_premium: profileData.is_premium,
        tier: profileData.current_tier,
        result: isPremium ? 'PREMIUM' : 'FREE'
      });

      return isPremium;
    }

    const { data: paidTierData, error: paidTierError } = await supabase
      .from('paid_tier_users')
      .select('tier_level, tokens_balance')
      .eq('id', userId)
      .maybeSingle();

    if (paidTierError) {
      console.error('Error checking paid_tier_users:', paidTierError);
      return false;
    }

    if (paidTierData) {
      const hasTokens = (paidTierData.tokens_balance || 0) > 0;
      const isPremiumTier = ['premium', 'ultra-premium'].includes(paidTierData.tier_level);

      const isPremium = hasTokens || isPremiumTier;
      console.log(`✅ User ${userId} (fallback check) is ${isPremium ? 'PREMIUM' : 'FREE'}`);
      return isPremium;
    }

    console.log(`⚠️ User ${userId} not found in either table, defaulting to FREE`);
    return false;
  } catch (err) {
    console.error('Exception checking premium:', err);
    return false;
  }
}
