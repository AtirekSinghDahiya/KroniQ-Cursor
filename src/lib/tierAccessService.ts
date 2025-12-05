import { supabase } from './supabaseClient';

export interface TierAccess {
  isPremium: boolean;
  hasPaidTokens: boolean;
  paidTokensBalance: number;
  totalTokensBalance: number;
  tier: string;
  canAccessPremiumModels: boolean;
  canAccessVideoGeneration: boolean;
}

const CACHE_DURATION = 5000;
let accessCache: Map<string, { data: TierAccess; timestamp: number }> = new Map();

export async function getUserTierAccess(userId: string): Promise<TierAccess> {
  console.log('==================================================');
  console.log('🎯 [TIER ACCESS] STARTING PREMIUM CHECK');
  console.log('==================================================');
  console.log('📝 User ID:', userId);
  console.log('📝 User ID Type:', typeof userId);
  console.log('📝 User ID Length:', userId?.length);
  console.log('📝 Timestamp:', new Date().toISOString());

  if (!userId) {
    console.warn('⚠️ [TIER ACCESS] ❌ NO USER ID PROVIDED!');
    console.log('==================================================');
    return createFreeAccess();
  }

  const cached = accessCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('✅ [TIER ACCESS] Using cached data');
    console.log('📊 Cached Result:', cached.data.isPremium ? '✅ PREMIUM' : '❌ FREE');
    console.log('==================================================');
    return cached.data;
  }

  try {
    console.log('🔍 [TIER ACCESS] Fetching from database...');
    console.log('🌐 Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ SET' : '❌ NOT SET');
    console.log('🔑 Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ SET' : '❌ NOT SET');

    const queryStart = Date.now();
    const { data, error } = await supabase
      .from('profiles')
      .select('paid_tokens_balance, tokens_balance, free_tokens_balance, is_premium, current_tier, is_paid')
      .eq('id', userId)
      .maybeSingle();
    const queryTime = Date.now() - queryStart;

    console.log(`⏱️ [TIER ACCESS] Query completed in ${queryTime}ms`);
    console.log('📦 [TIER ACCESS] Error:', error ? JSON.stringify(error) : 'null');
    console.log('📦 [TIER ACCESS] Data:', data ? JSON.stringify(data) : 'null');

    if (error) {
      console.error('==================================================');
      console.error('❌ [TIER ACCESS] SUPABASE ERROR!');
      console.error('==================================================');
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.details);
      console.error('Error Hint:', error.hint);
      console.error('==================================================');
      return createFreeAccess();
    }

    if (!data) {
      console.warn('==================================================');
      console.warn('⚠️ [TIER ACCESS] NO PROFILE DATA RETURNED!');
      console.warn('==================================================');
      console.warn('User ID:', userId);
      console.warn('This means the user profile does not exist in the database');
      console.warn('==================================================');
      return createFreeAccess();
    }

    console.log('==================================================');
    console.log('📊 [TIER ACCESS] PROFILE DATA RETRIEVED');
    console.log('==================================================');

    const paidTokens = data.paid_tokens_balance || 0;
    const tokensBalance = data.tokens_balance || 0;
    const totalTokens = paidTokens + tokensBalance;
    const hasPaidTokens = paidTokens > 0;
    const isPremiumFlag = data.is_premium === true;
    const isPremiumTier = data.current_tier === 'premium';
    const isPaid = data.is_paid === true;

    console.log('💰 Paid Tokens Balance:', paidTokens.toLocaleString());
    console.log('💰 Regular Tokens Balance:', tokensBalance.toLocaleString());
    console.log('💰 Total Tokens:', totalTokens.toLocaleString());
    console.log('🏷️ Is Premium Flag:', isPremiumFlag ? '✅ TRUE' : '❌ FALSE');
    console.log('🏷️ Current Tier:', data.current_tier);
    console.log('🏷️ Is Paid Flag:', isPaid ? '✅ TRUE' : '❌ FALSE');
    console.log('--------------------------------------------------');
    console.log('🧮 Logic Checks:');
    console.log('  - hasPaidTokens (paid_tokens > 0):', hasPaidTokens ? '✅ TRUE' : '❌ FALSE');
    console.log('  - isPremiumFlag (is_premium = true):', isPremiumFlag ? '✅ TRUE' : '❌ FALSE');
    console.log('  - isPremiumTier (tier = premium):', isPremiumTier ? '✅ TRUE' : '❌ FALSE');
    console.log('  - isPaid (is_paid = true):', isPaid ? '✅ TRUE' : '❌ FALSE');
    console.log('--------------------------------------------------');

    const isPremium = hasPaidTokens || isPremiumFlag || isPremiumTier || isPaid;

    console.log('🎯 FINAL RESULT (OR logic):');
    console.log(`  isPremium = ${hasPaidTokens} OR ${isPremiumFlag} OR ${isPremiumTier} OR ${isPaid}`);
    console.log(`  isPremium = ${isPremium}`);
    console.log('==================================================');

    if (isPremium) {
      console.log('✅✅✅ PREMIUM ACCESS GRANTED ✅✅✅');
    } else {
      console.log('❌❌❌ FREE ACCESS ONLY ❌❌❌');
    }
    console.log('==================================================');

    const access: TierAccess = {
      isPremium,
      hasPaidTokens,
      paidTokensBalance: paidTokens,
      totalTokensBalance: totalTokens,
      tier: data.current_tier || 'free',
      canAccessPremiumModels: isPremium,
      canAccessVideoGeneration: isPremium,
    };

    accessCache.set(userId, { data: access, timestamp: Date.now() });

    console.log('💾 Cached for future requests');
    console.log('==================================================\n');

    return access;
  } catch (error) {
    console.error('==================================================');
    console.error('❌ [TIER ACCESS] EXCEPTION CAUGHT!');
    console.error('==================================================');
    console.error('Exception:', error);
    console.error('Exception Type:', typeof error);
    console.error('Exception String:', String(error));
    if (error instanceof Error) {
      console.error('Error Name:', error.name);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
    }
    console.error('==================================================');
    return createFreeAccess();
  }
}

export function clearTierCache(userId?: string) {
  if (userId) {
    accessCache.delete(userId);
    console.log('🗑️ [TIER ACCESS] Cache cleared for user:', userId);
  } else {
    accessCache.clear();
    console.log('🗑️ [TIER ACCESS] All cache cleared');
  }
}

function createFreeAccess(): TierAccess {
  console.log('🆓 [TIER ACCESS] Returning FREE access object');
  return {
    isPremium: false,
    hasPaidTokens: false,
    paidTokensBalance: 0,
    totalTokensBalance: 0,
    tier: 'free',
    canAccessPremiumModels: false,
    canAccessVideoGeneration: false,
  };
}

export async function checkModelAccess(userId: string, modelId: string, isPremiumModel: boolean): Promise<boolean> {
  if (!isPremiumModel) {
    console.log(`🔓 [MODEL ACCESS] ${modelId} is FREE - access granted`);
    return true;
  }

  const access = await getUserTierAccess(userId);
  const hasAccess = access.canAccessPremiumModels;

  console.log(`🔑 [MODEL ACCESS] Premium Model Check:`);
  console.log(`   Model: ${modelId}`);
  console.log(`   User Premium Status: ${access.isPremium}`);
  console.log(`   Access: ${hasAccess ? '✅ GRANTED' : '❌ DENIED'}`);

  return hasAccess;
}
