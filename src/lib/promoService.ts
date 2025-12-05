import { supabase } from './supabase';

export interface CampaignStatus {
  campaignId: string | null;
  isValid: boolean;
  remainingSlots: number;
  isExpired: boolean;
  tokenAmount: number;
  message: string;
}

export interface RedemptionResult {
  success: boolean;
  tokensAwarded: number;
  message: string;
  redemptionId: string | null;
}

export class PromoService {
  static async checkCampaignStatus(campaignCode: string): Promise<CampaignStatus> {
    try {
      const { data, error } = await supabase.rpc('get_campaign_status', {
        p_campaign_code: campaignCode
      });

      if (error) {
        console.error('Error checking campaign status:', error);
        return {
          campaignId: null,
          isValid: false,
          remainingSlots: 0,
          isExpired: false,
          tokenAmount: 0,
          message: 'Error checking campaign status'
        };
      }

      if (!data || data.length === 0) {
        return {
          campaignId: null,
          isValid: false,
          remainingSlots: 0,
          isExpired: false,
          tokenAmount: 0,
          message: 'Campaign not found'
        };
      }

      const result = data[0];
      return {
        campaignId: result.campaign_id,
        isValid: result.is_valid,
        remainingSlots: result.remaining_slots,
        isExpired: result.is_expired,
        tokenAmount: result.token_amount,
        message: result.message
      };
    } catch (error) {
      console.error('Error in checkCampaignStatus:', error);
      return {
        campaignId: null,
        isValid: false,
        remainingSlots: 0,
        isExpired: false,
        tokenAmount: 0,
        message: 'Unexpected error occurred'
      };
    }
  }

  static async redeemPromoCode(
    userId: string,
    campaignCode: string,
    userEmail?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<RedemptionResult> {
    try {
      console.log('🎁 Redeeming promo code:', { userId, campaignCode, userEmail });

      const { data, error } = await supabase.rpc('redeem_promo_atomic', {
        p_user_id: userId,
        p_campaign_code: campaignCode,
        p_user_email: userEmail || null,
        p_ip_address: ipAddress || null,
        p_user_agent: userAgent || null
      });

      if (error) {
        console.error('Error redeeming promo code:', error);
        return {
          success: false,
          tokensAwarded: 0,
          message: 'Error redeeming promo code',
          redemptionId: null
        };
      }

      if (!data || data.length === 0) {
        return {
          success: false,
          tokensAwarded: 0,
          message: 'No redemption data returned',
          redemptionId: null
        };
      }

      const result = data[0];
      return {
        success: result.success,
        tokensAwarded: result.tokens_awarded,
        message: result.message,
        redemptionId: result.redemption_id
      };
    } catch (error) {
      console.error('Error in redeemPromoCode:', error);
      return {
        success: false,
        tokensAwarded: 0,
        message: 'Unexpected error occurred',
        redemptionId: null
      };
    }
  }

  static async hasUserRedeemedCampaign(userId: string, campaignCode: string): Promise<boolean> {
    try {
      const { data: campaign } = await supabase
        .from('promotional_campaigns')
        .select('id')
        .eq('campaign_code', campaignCode)
        .single();

      if (!campaign) {
        return false;
      }

      const { data: redemption } = await supabase
        .from('promotional_redemptions')
        .select('id')
        .eq('user_id', userId)
        .eq('campaign_id', campaign.id)
        .single();

      return !!redemption;
    } catch (error) {
      console.error('Error checking redemption status:', error);
      return false;
    }
  }

  static async getCampaignStats(campaignCode: string) {
    try {
      const { data: campaign, error } = await supabase
        .from('promotional_campaigns')
        .select(`
          *,
          redemptions:promotional_redemptions(count)
        `)
        .eq('campaign_code', campaignCode)
        .single();

      if (error || !campaign) {
        console.error('Error fetching campaign stats:', error);
        return null;
      }

      return campaign;
    } catch (error) {
      console.error('Error in getCampaignStats:', error);
      return null;
    }
  }

  static async getRecentRedemptions(campaignCode: string, limit: number = 10) {
    try {
      const { data: campaign } = await supabase
        .from('promotional_campaigns')
        .select('id')
        .eq('campaign_code', campaignCode)
        .single();

      if (!campaign) {
        return [];
      }

      const { data: redemptions, error } = await supabase
        .from('promotional_redemptions')
        .select(`
          *,
          profile:profiles!promotional_redemptions_user_id_fkey(email, display_name)
        `)
        .eq('campaign_id', campaign.id)
        .order('redeemed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching redemptions:', error);
        return [];
      }

      return redemptions || [];
    } catch (error) {
      console.error('Error in getRecentRedemptions:', error);
      return [];
    }
  }

  static storePromoCodeInSession(campaignCode: string): void {
    try {
      sessionStorage.setItem('promo_code', campaignCode);
      sessionStorage.setItem('promo_timestamp', Date.now().toString());
    } catch (error) {
      console.error('Error storing promo code:', error);
    }
  }

  static getPromoCodeFromSession(): string | null {
    try {
      const code = sessionStorage.getItem('promo_code');
      const timestamp = sessionStorage.getItem('promo_timestamp');

      if (!code || !timestamp) {
        return null;
      }

      const age = Date.now() - parseInt(timestamp, 10);
      const MAX_AGE = 60 * 60 * 1000;

      if (age > MAX_AGE) {
        this.clearPromoCodeFromSession();
        return null;
      }

      return code;
    } catch (error) {
      console.error('Error getting promo code:', error);
      return null;
    }
  }

  static clearPromoCodeFromSession(): void {
    try {
      sessionStorage.removeItem('promo_code');
      sessionStorage.removeItem('promo_timestamp');
    } catch (error) {
      console.error('Error clearing promo code:', error);
    }
  }

  static getUserIpAddress(): Promise<string | null> {
    return fetch('https://api.ipify.org?format=json')
      .then(response => response.json())
      .then(data => data.ip)
      .catch(() => null);
  }

  static getUserAgent(): string {
    return navigator.userAgent;
  }
}
