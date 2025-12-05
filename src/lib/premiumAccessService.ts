import { supabase } from './supabaseClient';

export interface PremiumAccessResult {
  isPremium: boolean;
  tierSource: string;
  paidTokens: number;
  tierLevel: string;
  timestamp: number;
}

const CACHE_DURATION = 30000;
const cache = new Map<string, PremiumAccessResult>();

export async function checkPremiumAccess(userId: string): Promise<PremiumAccessResult> {
  console.log('🔐 [PREMIUM ACCESS] Checking premium status for user:', userId);
  console.log('📅 Timestamp:', new Date().toISOString());

  if (!userId) {
    console.error('❌ [PREMIUM ACCESS] No user ID provided');
    return createFreeResult('no_user_id');
  }

  const cached = cache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('✅ [PREMIUM ACCESS] Using cached result:', cached.isPremium ? 'PREMIUM' : 'FREE');
    return cached;
  }

  try {
    console.log('🔍 [PREMIUM ACCESS] Calling database function check_user_is_premium...');

    const { data, error } = await supabase
      .rpc('check_user_is_premium', { p_user_id: userId });

    if (error) {
      console.error('❌ [PREMIUM ACCESS] Database error:', error);
      return createFreeResult('database_error');
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ [PREMIUM ACCESS] No data returned from database');
      return createFreeResult('no_data');
    }

    const result = data[0];
    console.log('📊 [PREMIUM ACCESS] Database result:', result);
    console.log('   Is Premium:', result.is_premium);
    console.log('   Tier Source:', result.tier_source);
    console.log('   Paid Tokens:', result.paid_tokens);
    console.log('   Tier Level:', result.tier_level);

    const premiumResult: PremiumAccessResult = {
      isPremium: result.is_premium === true,
      tierSource: result.tier_source || 'unknown',
      paidTokens: Number(result.paid_tokens) || 0,
      tierLevel: result.tier_level || 'free',
      timestamp: Date.now()
    };

    cache.set(userId, premiumResult);

    if (premiumResult.isPremium) {
      console.log('✅✅✅ [PREMIUM ACCESS] USER IS PREMIUM ✅✅✅');
      console.log(`   Source: ${premiumResult.tierSource}`);
      console.log(`   Tokens: ${premiumResult.paidTokens.toLocaleString()}`);
    } else {
      console.log('🔒🔒🔒 [PREMIUM ACCESS] USER IS FREE 🔒🔒🔒');
    }

    return premiumResult;

  } catch (error) {
    console.error('❌ [PREMIUM ACCESS] Exception:', error);
    return createFreeResult('exception');
  }
}

export function clearPremiumCache(userId?: string): void {
  if (userId) {
    cache.delete(userId);
    console.log('🗑️ [PREMIUM ACCESS] Cache cleared for user:', userId);
  } else {
    cache.clear();
    console.log('🗑️ [PREMIUM ACCESS] All cache cleared');
  }
}

export function getCachedPremiumStatus(userId: string): PremiumAccessResult | null {
  const cached = cache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached;
  }
  return null;
}

function createFreeResult(reason: string): PremiumAccessResult {
  console.log('🆓 [PREMIUM ACCESS] Returning FREE result, reason:', reason);
  return {
    isPremium: false,
    tierSource: reason,
    paidTokens: 0,
    tierLevel: 'free',
    timestamp: Date.now()
  };
}

export async function syncUserToTierTables(userId: string): Promise<string> {
  console.log('🔄 [PREMIUM ACCESS] Syncing user to tier tables:', userId);

  try {
    const { data, error } = await supabase
      .rpc('sync_user_to_tier_tables', { p_user_id: userId });

    if (error) {
      console.error('❌ [PREMIUM ACCESS] Sync error:', error);
      return `Error: ${error.message}`;
    }

    console.log('✅ [PREMIUM ACCESS] Sync result:', data);
    clearPremiumCache(userId);

    return data || 'Synced successfully';
  } catch (error) {
    console.error('❌ [PREMIUM ACCESS] Sync exception:', error);
    return `Exception: ${error}`;
  }
}

export async function verifyTierSystem(): Promise<Record<string, number>> {
  console.log('🔍 [PREMIUM ACCESS] Verifying tier system...');

  try {
    const { data, error } = await supabase.rpc('verify_tier_system');

    if (error) {
      console.error('❌ [PREMIUM ACCESS] Verification error:', error);
      return {};
    }

    const stats: Record<string, number> = {};
    data?.forEach((row: any) => {
      stats[row.metric] = Number(row.count);
    });

    console.log('📊 [PREMIUM ACCESS] System stats:', stats);
    return stats;
  } catch (error) {
    console.error('❌ [PREMIUM ACCESS] Verification exception:', error);
    return {};
  }
}
