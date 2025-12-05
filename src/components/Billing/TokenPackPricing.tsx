/**
 * Token Pack Pricing Component
 * Shows token packs with one-time and recurring options
 */

import React, { useState, useEffect } from 'react';
import { Check, Zap, Crown, Building2, Sparkles, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  getTokenPacks,
  calculateSavings,
  getTotalTokens,
  TokenPack,
} from '../../lib/subscriptionManagementService';

export const TokenPackPricing: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const [packs, setPacks] = useState<TokenPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadPacks();
  }, []);

  const loadPacks = async () => {
    try {
      const data = await getTokenPacks();
      setPacks(data);
    } catch (error) {
      console.error('Error loading token packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pack: TokenPack, recurring: boolean) => {
    if (!user) {
      showToast('error', 'Sign In Required', 'Please sign in to purchase tokens');
      return;
    }

    setPurchasing(`${pack.id}-${recurring ? 'recurring' : 'onetime'}`);

    try {
      // TODO: Create Stripe checkout session
      const price = recurring ? pack.recurringPriceUsd : pack.priceUsd;
      const priceId = recurring ? pack.stripeRecurringPriceId : pack.stripePriceId;

      if (!priceId) {
        showToast('error', 'Not Available', 'This payment option is not configured yet');
        setPurchasing(null);
        return;
      }

      // Call edge function to create checkout session
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.uid,
            packId: pack.id,
            priceId: priceId,
            recurring: recurring,
            successUrl: `${window.location.origin}/billing?success=true`,
            cancelUrl: `${window.location.origin}/billing?canceled=true`,
          }),
        }
      );

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (error: any) {
      showToast('error', 'Purchase Failed', error.message);
      setPurchasing(null);
    }
  };

  const getPackIcon = (index: number) => {
    const icons = [Sparkles, Zap, Crown, Building2];
    return icons[index] || Sparkles;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-panel rounded-2xl p-6 border border-white/10 animate-pulse">
            <div className="h-32 bg-white/10 rounded mb-4"></div>
            <div className="h-20 bg-white/10 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">
          Choose Your Token Pack
        </h2>
        <p className="text-xl text-white/60">
          One-time purchase or subscribe monthly and save 10%
        </p>
      </div>

      {/* Token Packs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packs.map((pack, index) => {
          const Icon = getPackIcon(index);
          const totalTokens = getTotalTokens(pack.tokens, pack.bonusTokens);
          const savings = calculateSavings(pack.priceUsd);
          const isPopular = pack.popular;

          return (
            <div
              key={pack.id}
              className={`relative glass-panel rounded-2xl p-6 border-2 transition-all ${
                isPopular
                  ? 'border-[#00FFF0] shadow-2xl shadow-[#00FFF0]/20 scale-105'
                  : theme === 'light'
                  ? 'border-gray-200 hover:border-gray-300'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Popular Badge */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="px-4 py-1 rounded-full bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white text-sm font-bold shadow-lg">
                    💎 BEST VALUE
                  </div>
                </div>
              )}

              {/* Pack Header */}
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  isPopular
                    ? 'bg-gradient-to-br from-[#00FFF0] to-[#8A2BE2]'
                    : 'bg-white/10'
                }`}>
                  <Icon className={`w-8 h-8 ${isPopular ? 'text-white' : 'text-[#00FFF0]'}`} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{pack.name}</h3>
                <div className="text-3xl font-bold bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
                  {totalTokens.toLocaleString()}
                </div>
                <div className="text-sm text-white/60">tokens</div>
                {pack.bonusTokens > 0 && (
                  <div className="mt-2 text-xs text-[#00FFF0]">
                    +{pack.bonusTokens.toLocaleString()} bonus tokens!
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-white/80">
                  <Check className="w-5 h-5 text-[#00FFF0]" />
                  <span>Access to all AI models</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Check className="w-5 h-5 text-[#00FFF0]" />
                  <span>2x cost multiplier</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Check className="w-5 h-5 text-[#00FFF0]" />
                  <span>Never expires</span>
                </div>
              </div>

              {/* One-Time Purchase */}
              <div className="mb-4">
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-white/60 text-sm">One-Time</span>
                  <div>
                    <span className="text-2xl font-bold text-white">${pack.priceUsd}</span>
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(pack, false)}
                  disabled={purchasing === `${pack.id}-onetime`}
                  className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
                    theme === 'light'
                      ? 'bg-gray-900 hover:bg-gray-800 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {purchasing === `${pack.id}-onetime` ? 'Processing...' : 'Buy Once'}
                </button>
              </div>

              {/* Recurring Option */}
              <div className={`relative rounded-xl p-4 ${
                isPopular
                  ? 'bg-gradient-to-br from-[#00FFF0]/10 to-[#8A2BE2]/10 border-2 border-[#00FFF0]/30'
                  : 'bg-white/5 border-2 border-white/10'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-[#00FFF0]" />
                    <span className="text-white/60 text-sm font-semibold">Monthly</span>
                  </div>
                  <div className="px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-bold">
                    SAVE ${savings}
                  </div>
                </div>
                <div className="flex items-baseline justify-between mb-3">
                  <div className="text-sm text-white/60">
                    <span className="line-through">${pack.priceUsd}</span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
                      ${pack.recurringPriceUsd}
                    </span>
                    <span className="text-white/60 text-sm">/mo</span>
                  </div>
                </div>
                <button
                  onClick={() => handlePurchase(pack, true)}
                  disabled={purchasing === `${pack.id}-recurring`}
                  className={`w-full px-6 py-3 rounded-xl font-semibold transition-all shadow-lg ${
                    isPopular
                      ? 'bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white hover:shadow-[#00FFF0]/50'
                      : 'bg-gradient-to-r from-[#00FFF0]/80 to-[#8A2BE2]/80 text-white hover:from-[#00FFF0] hover:to-[#8A2BE2]'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {purchasing === `${pack.id}-recurring` ? 'Processing...' : 'Subscribe & Save 10%'}
                </button>
                <div className="text-xs text-white/40 text-center mt-2">
                  Auto-refills monthly • Cancel anytime
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 mt-8">
        <h3 className="text-xl font-bold text-white mb-4">How It Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white/70">
          <div>
            <h4 className="font-semibold text-white mb-2">One-Time Purchase</h4>
            <ul className="space-y-1 text-sm">
              <li>• Pay once, tokens never expire</li>
              <li>• Instant access to all AI models</li>
              <li>• Add more tokens anytime</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">Monthly Subscription</h4>
            <ul className="space-y-1 text-sm">
              <li>• Save 10% on every refill</li>
              <li>• Automatic monthly token refills</li>
              <li>• Cancel anytime, keep unused tokens</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
