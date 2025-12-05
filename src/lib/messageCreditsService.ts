import { supabase } from './supabase';
import { TokenEstimator } from './tokenEstimator';

export interface MessageCreditsResponse {
  success: boolean;
  messages_remaining?: number;
  is_paid?: boolean;
  daily_used?: number;
  monthly_used?: number;
  daily_limit?: number;
  monthly_limit?: number;
  error?: string;
  suggestion?: string;
  transaction_id?: string;
  tokens_used?: number;
  credits_deducted?: number;
}

export interface UserCreditsInfo {
  messages_remaining: number;
  is_paid_user: boolean;
  daily_messages_used: number;
  monthly_messages_used: number;
  daily_limit: number;
  monthly_limit: number;
}

export interface TokenUsageEstimate {
  estimatedTokens: number;
  estimatedCredits: number;
  canAfford: boolean;
  remainingAfter?: number;
}

export class MessageCreditsService {
  static async getUserCredits(userId: string): Promise<UserCreditsInfo | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('messages_remaining, is_paid_user, daily_messages_used, monthly_messages_used')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user credits:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        messages_remaining: data.messages_remaining || 0,
        is_paid_user: data.is_paid_user || false,
        daily_messages_used: data.daily_messages_used || 0,
        monthly_messages_used: data.monthly_messages_used || 0,
        daily_limit: 10,
        monthly_limit: 300,
      };
    } catch (error) {
      console.error('Error in getUserCredits:', error);
      return null;
    }
  }

  static async checkAndResetLimits(userId: string): Promise<MessageCreditsResponse> {
    try {
      const { data, error } = await supabase.rpc('check_and_reset_free_limits', {
        p_user_id: userId,
      });

      if (error) {
        console.error('Error checking/resetting limits:', error);
        return {
          success: false,
          error: 'Failed to check limits',
        };
      }

      return data as MessageCreditsResponse;
    } catch (error) {
      console.error('Error in checkAndResetLimits:', error);
      return {
        success: false,
        error: 'Failed to check limits',
      };
    }
  }

  static estimateMessageCost(
    userMessage: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): TokenUsageEstimate {
    const { tokens, credits } = TokenEstimator.estimateMessageCost(
      userMessage,
      undefined,
      conversationHistory
    );

    return {
      estimatedTokens: tokens,
      estimatedCredits: credits,
      canAfford: true,
    };
  }

  static async deductMessageCredit(
    userId: string,
    tokensUsed: number,
    modelName: string = 'unknown',
    requestType: string = 'chat'
  ): Promise<MessageCreditsResponse> {
    try {
      const creditsToDeduct = TokenEstimator.calculateCostInCredits(tokensUsed);

      const { data, error } = await supabase.rpc('deduct_message_credit', {
        p_user_id: userId,
        p_model: modelName,
        p_request_type: requestType,
      });

      if (error) {
        console.error('Error deducting message credit:', error);
        return {
          success: false,
          error: 'Failed to deduct message credit',
        };
      }

      return {
        ...data,
        tokens_used: tokensUsed,
        credits_deducted: creditsToDeduct,
      } as MessageCreditsResponse;
    } catch (error) {
      console.error('Error in deductMessageCredit:', error);
      return {
        success: false,
        error: 'Failed to deduct message credit',
      };
    }
  }

  static async addMessageCredits(
    userId: string,
    messages: number,
    packPrice: number,
    stripePaymentId?: string
  ): Promise<MessageCreditsResponse> {
    try {
      const { data, error } = await supabase.rpc('add_message_credits', {
        p_user_id: userId,
        p_messages: messages,
        p_pack_price: packPrice,
        p_stripe_payment_id: stripePaymentId || null,
      });

      if (error) {
        console.error('Error adding message credits:', error);
        return {
          success: false,
          error: 'Failed to add message credits',
        };
      }

      return data as MessageCreditsResponse;
    } catch (error) {
      console.error('Error in addMessageCredits:', error);
      return {
        success: false,
        error: 'Failed to add message credits',
      };
    }
  }

  static async getMessageTransactionHistory(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('message_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transaction history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getMessageTransactionHistory:', error);
      return [];
    }
  }

  static async getMessagePacks(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('token_packs')
        .select('*')
        .eq('active', true)
        .order('price_usd', { ascending: true });

      if (error) {
        console.error('Error fetching message packs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getMessagePacks:', error);
      return [];
    }
  }

  static formatCreditsDisplay(credits: UserCreditsInfo): string {
    if (credits.is_paid_user) {
      return `${credits.messages_remaining} messages remaining`;
    }

    const dailyRemaining = 10 - credits.daily_messages_used;
    const monthlyRemaining = 300 - credits.monthly_messages_used;

    return `${dailyRemaining}/10 daily messages • ${monthlyRemaining}/300 monthly messages`;
  }

  static canSendMessage(credits: UserCreditsInfo): boolean {
    if (credits.is_paid_user) {
      return credits.messages_remaining > 0;
    }

    return (
      credits.daily_messages_used < 10 &&
      credits.monthly_messages_used < 300 &&
      credits.messages_remaining > 0
    );
  }

  static getUpgradeMessage(credits: UserCreditsInfo): string | null {
    if (credits.is_paid_user && credits.messages_remaining === 0) {
      return 'Your message credits have been depleted. Purchase more to continue.';
    }

    if (!credits.is_paid_user) {
      if (credits.daily_messages_used >= 10) {
        return 'Daily limit reached. Upgrade to send unlimited messages per day.';
      }
      if (credits.monthly_messages_used >= 300) {
        return 'Monthly limit reached. Upgrade to continue messaging.';
      }
    }

    return null;
  }
}
