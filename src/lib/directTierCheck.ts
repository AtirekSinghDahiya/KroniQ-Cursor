import { supabase } from './supabaseClient';

export interface DirectTierResult {
  isPremium: boolean;
  tierSource: 'paid_tier_users' | 'free_tier_users' | 'profiles' | 'unknown';
  userId: string;
  details: any;
}

export async function checkUserTierDirect(userId: string): Promise<DirectTierResult> {
  console.log('═══════════════════════════════════════════════════');
  console.log('🔍 DIRECT TIER CHECK - STARTING');
  console.log('═══════════════════════════════════════════════════');
  console.log('User ID:', userId);

  if (!userId) {
    console.error('❌ No user ID provided!');
    console.log('═══════════════════════════════════════════════════');
    return {
      isPremium: false,
      tierSource: 'unknown',
      userId: '',
      details: null
    };
  }

  try {
    console.log('\n📋 STEP 1: Checking paid_tier_users table...');
    const { data: paidUser, error: paidError } = await supabase
      .from('paid_tier_users')
      .select('id, email, tier_level, tokens_remaining')
      .eq('id', userId)
      .maybeSingle();

    console.log('   Result:', paidUser ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('   Error:', paidError || 'none');
    console.log('   Data:', JSON.stringify(paidUser));

    if (paidUser) {
      console.log('\n🎉🎉🎉 USER IS IN PAID TIER! 🎉🎉🎉');
      console.log('   Tier Level:', paidUser.tier_level);
      console.log('   Tokens Remaining:', paidUser.tokens_remaining);
      console.log('   PREMIUM ACCESS: ✅ GRANTED');
      console.log('═══════════════════════════════════════════════════\n');
      return {
        isPremium: true,
        tierSource: 'paid_tier_users',
        userId,
        details: paidUser
      };
    }

    console.log('\n📋 STEP 2: Checking free_tier_users table...');
    const { data: freeUser, error: freeError } = await supabase
      .from('free_tier_users')
      .select('id, email, daily_tokens_remaining')
      .eq('id', userId)
      .maybeSingle();

    console.log('   Result:', freeUser ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('   Error:', freeError || 'none');
    console.log('   Data:', JSON.stringify(freeUser));

    if (freeUser) {
      console.log('\n🔒 USER IS IN FREE TIER');
      console.log('   Daily Tokens:', freeUser.daily_tokens_remaining);
      console.log('   PREMIUM ACCESS: ❌ DENIED');
      console.log('═══════════════════════════════════════════════════\n');
      return {
        isPremium: false,
        tierSource: 'free_tier_users',
        userId,
        details: freeUser
      };
    }

    console.log('\n📋 STEP 3: Checking profiles table as fallback...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, paid_tokens_balance, is_premium, current_tier')
      .eq('id', userId)
      .maybeSingle();

    console.log('   Result:', profile ? '✅ FOUND' : '❌ NOT FOUND');
    console.log('   Error:', profileError || 'none');
    console.log('   Data:', JSON.stringify(profile));

    if (profile) {
      const hasPaidTokens = (profile.paid_tokens_balance || 0) > 0;
      const isPremiumFlag = profile.is_premium === true;
      const isPremiumTier = profile.current_tier === 'premium';
      const isPremium = hasPaidTokens || isPremiumFlag || isPremiumTier;

      if (isPremium) {
        console.log('\n🎉 USER HAS PREMIUM ACCESS (via profiles)');
        console.log('   Paid Tokens:', profile.paid_tokens_balance);
        console.log('   Is Premium Flag:', isPremiumFlag);
        console.log('   Current Tier:', profile.current_tier);
        console.log('   PREMIUM ACCESS: ✅ GRANTED');
      } else {
        console.log('\n🔒 USER IS FREE (via profiles)');
        console.log('   PREMIUM ACCESS: ❌ DENIED');
      }
      console.log('═══════════════════════════════════════════════════\n');

      return {
        isPremium,
        tierSource: 'profiles',
        userId,
        details: profile
      };
    }

    console.log('\n⚠️ USER NOT FOUND IN ANY TABLE!');
    console.log('═══════════════════════════════════════════════════\n');
    return {
      isPremium: false,
      tierSource: 'unknown',
      userId,
      details: null
    };

  } catch (error) {
    console.error('\n❌❌❌ EXCEPTION IN DIRECT TIER CHECK ❌❌❌');
    console.error('Error:', error);
    console.error('═══════════════════════════════════════════════════\n');
    return {
      isPremium: false,
      tierSource: 'unknown',
      userId,
      details: null
    };
  }
}
