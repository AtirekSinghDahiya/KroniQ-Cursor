import { supabase } from './supabase';
import { getModelCost, calculateTokensForMessage } from './modelTokenPricing';

const TOKEN_CONVERSION_RATE = 1000000;
const PROFIT_MARGIN_PERCENTAGE = 0.35;

export interface TokenCostEstimate {
  estimatedTokens: number;
  providerCostUSD: number;
  profitMarginUSD: number;
  totalCostUSD: number;
  hasEnoughBalance: boolean;
  currentBalance: number;
}

export interface TokenDeductionResult {
  success: boolean;
  balance: number;
  transactionId?: string;
  error?: string;
}



export async function getUserTokenBalance(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('tokens_balance')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    const balance = data?.tokens_balance || 0;
    console.log(`💰 Token balance for user ${userId}:`, balance);

    return balance;
  } catch (error) {
    console.error('Error fetching token balance:', error);
    return 0;
  }
}

export async function checkAndRefreshDailyTokens(userId: string): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('last_token_refresh, daily_free_tokens, is_token_user')
      .eq('id', userId)
      .maybeSingle();

    if (!profile || !profile.is_token_user) return;

    const lastRefresh = profile.last_token_refresh
      ? new Date(profile.last_token_refresh)
      : new Date(0);

    const now = new Date();
    const hoursSinceRefresh = (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);

    if (hoursSinceRefresh >= 24) {
      const { error } = await supabase.rpc('refresh_daily_tokens');
      if (error) console.error('Error refreshing daily tokens:', error);
    }
  } catch (error) {
    console.error('Error in checkAndRefreshDailyTokens:', error);
  }
}

export function estimateTokenCost(
  modelId: string,
  inputText: string,
  estimatedOutputTokens: number = 500
): { providerCostUSD: number; tokens: number } {
  const modelCost = getModelCost(modelId);
  const tokens = calculateTokensForMessage(modelId, inputText.length);

  const providerCostUSD = modelCost.costPerMessage;
  const totalCostUSD = providerCostUSD * (1 + PROFIT_MARGIN_PERCENTAGE);

  return { providerCostUSD, tokens };
}

export async function estimateRequestCost(
  userId: string,
  modelId: string,
  inputText: string,
  estimatedOutputTokens: number = 500
): Promise<TokenCostEstimate> {
  const { providerCostUSD, tokens } = estimateTokenCost(modelId, inputText, estimatedOutputTokens);
  const currentBalance = await getUserTokenBalance(userId);
  const profitMarginUSD = providerCostUSD * PROFIT_MARGIN_PERCENTAGE;

  return {
    estimatedTokens: tokens,
    providerCostUSD,
    profitMarginUSD,
    totalCostUSD: providerCostUSD * (1 + PROFIT_MARGIN_PERCENTAGE),
    hasEnoughBalance: currentBalance >= tokens,
    currentBalance,
  };
}

export async function deductTokensForRequest(
  userId: string,
  modelId: string,
  provider: string,
  providerCostUSD: number,
  requestType: string = 'chat'
): Promise<TokenDeductionResult> {
  try {
    const modelCost = getModelCost(modelId);
    const baseTokens = modelCost.tokensPerMessage;

    const tokensToDeduct = baseTokens;

    const { data, error } = await supabase.rpc('deduct_tokens_v2', {
      p_user_id: userId,
      p_tokens: tokensToDeduct,
      p_model: modelId,
      p_provider: provider,
      p_cost_usd: providerCostUSD,
      p_request_type: requestType,
    });

    if (error) throw error;

    const result = data as { success: boolean; balance?: number; transaction_id?: string; error?: string; user_type?: string };

    if (!result.success) {
      return {
        success: false,
        balance: result.balance || 0,
        error: result.error || 'Token deduction failed',
      };
    }

    console.log(`✅ Token deduction successful - User: ${result.user_type}, Balance: ${result.balance}`);

    return {
      success: true,
      balance: result.balance || 0,
      transactionId: result.transaction_id,
    };
  } catch (error: any) {
    console.error('Error deducting tokens:', error);
    return {
      success: false,
      balance: 0,
      error: error.message || 'Failed to deduct tokens',
    };
  }
}

export async function addTokensToUser(
  userId: string,
  tokens: number,
  packId?: string,
  amountPaid?: number,
  stripePaymentId?: string
): Promise<{ success: boolean; balance?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('add_tokens', {
      p_user_id: userId,
      p_tokens: tokens,
      p_pack_id: packId || null,
      p_amount_paid: amountPaid || 0,
      p_stripe_payment_id: stripePaymentId || null,
    });

    if (error) throw error;

    const result = data as { success: boolean; balance?: number };
    return result;
  } catch (error: any) {
    console.error('Error adding tokens:', error);
    return { success: false, error: error.message };
  }
}

export async function getTokenPacks() {
  try {
    const { data, error } = await supabase
      .from('token_packs')
      .select('*')
      .eq('active', true)
      .order('tokens', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching token packs:', error);
    return [];
  }
}

export async function getTokenTransactions(userId: string, limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching token transactions:', error);
    return [];
  }
}

export async function getTokenPurchases(userId: string) {
  try {
    const { data, error } = await supabase
      .from('token_purchases')
      .select('*, token_packs(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching token purchases:', error);
    return [];
  }
}

export function usdToTokens(usd: number): number {
  return Math.ceil(usd * TOKEN_CONVERSION_RATE);
}

export function tokensToUSD(tokens: number): number {
  return tokens / TOKEN_CONVERSION_RATE;
}
