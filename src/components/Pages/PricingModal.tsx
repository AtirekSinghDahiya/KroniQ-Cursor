import React, { useState, useEffect } from 'react';
import { X, Check, Zap, Sparkles, Crown, TrendingUp, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface PricingModalProps {
  onClose: () => void;
}

interface PricingTier {
  id: string;
  name: string;
  price: number;
  tokens: number;
  popular: boolean;
  features: string[];
  badge?: string;
}

export const PricingModal: React.FC<PricingModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { themeColors } = useTheme();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'one-time'>('one-time');

  const pricingTiers: PricingTier[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 2,
      tokens: 900000,
      popular: false,
      features: [
        '900K tokens',
        'All AI models',
        'Priority support',
        'Tokens never expire',
        'Perfect for trying out'
      ]
    },
    {
      id: 'popular',
      name: 'Popular',
      price: 5,
      tokens: 2250000,
      popular: true,
      badge: 'Best Value',
      features: [
        '2.25M tokens',
        'All premium AI models',
        'Priority support',
        'Tokens never expire',
        'Most chosen plan',
        'Great for regular use'
      ]
    },
    {
      id: 'power',
      name: 'Power User',
      price: 10,
      tokens: 4500000,
      popular: false,
      features: [
        '4.5M tokens',
        'All premium AI models',
        'VIP support',
        'Tokens never expire',
        'Best for power users',
        'Maximum value'
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 20,
      tokens: 9000000,
      popular: false,
      badge: 'Pro',
      features: [
        '9M tokens',
        'All premium AI models',
        'VIP support',
        'Tokens never expire',
        'Professional tier',
        'Ultimate package'
      ]
    }
  ];

  const formatTokens = (tokens: number): string => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

  const handlePurchase = (tier: PricingTier) => {
    if (!user) {
      alert('Please sign in to purchase tokens');
      onClose();
      return;
    }
    window.location.href = '/billing?tab=buy-tokens';
    onClose();
  };

  const getDiscountedPrice = (price: number) => {
    return billingCycle === 'monthly' ? (price * 0.9).toFixed(2) : price.toFixed(2);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-6xl my-4 sm:my-8 rounded-2xl sm:rounded-3xl border shadow-2xl max-h-[95vh] overflow-y-auto"
        style={{
          background: themeColors.backgroundSecondary,
          borderColor: themeColors.border,
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 backdrop-blur-xl border-b p-4 sm:p-6 flex items-center justify-between rounded-t-2xl sm:rounded-t-3xl"
          style={{
            borderColor: themeColors.border,
            background: `${themeColors.backgroundSecondary}cc`,
          }}
        >
          <div>
            <h2
              className="text-xl sm:text-3xl font-bold mb-1"
              style={{ color: themeColors.text }}
            >
              Choose Your Plan
            </h2>
            <p className="text-sm sm:text-base" style={{ color: themeColors.textMuted }}>
              Select the perfect token pack for your needs
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{
              backgroundColor: themeColors.surface,
              color: themeColors.text,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.surfaceHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = themeColors.surface;
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Billing Toggle */}
        <div className="p-4 sm:p-6 pb-0 flex justify-center">
          <div
            className="inline-flex rounded-full p-1"
            style={{
              backgroundColor: themeColors.surface,
              border: `1px solid ${themeColors.border}`,
            }}
          >
            <button
              onClick={() => setBillingCycle('one-time')}
              className="px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all"
              style={{
                backgroundColor: billingCycle === 'one-time' ? themeColors.accent : 'transparent',
                color: billingCycle === 'one-time' ? themeColors.text : themeColors.textMuted,
              }}
            >
              One-Time
            </button>
            <button
              onClick={() => setBillingCycle('monthly')}
              className="px-4 sm:px-6 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all relative"
              style={{
                backgroundColor: billingCycle === 'monthly' ? themeColors.accent : 'transparent',
                color: billingCycle === 'monthly' ? themeColors.text : themeColors.textMuted,
              }}
            >
              Monthly
              <span
                className="absolute -top-2 -right-2 text-xs px-2 py-0.5 rounded-full font-bold"
                style={{
                  background: themeColors.gradient,
                  color: themeColors.text,
                }}
              >
                Save 10%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 flex flex-col ${tier.popular ? 'z-10' : 'z-0'}`}
              style={{
                backgroundColor: tier.popular ? `${themeColors.accent}10` : themeColors.surface,
                border: `2px solid ${tier.popular ? themeColors.accent : themeColors.border}`,
                boxShadow: tier.popular ? `0 20px 40px ${themeColors.shadow}` : 'none',
              }}
            >
              {/* Badge */}
              {tier.badge && (
                <div
                  className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
                  style={{
                    background: themeColors.gradient,
                    color: themeColors.text,
                  }}
                >
                  {tier.badge}
                </div>
              )}

              {/* Icon */}
              <div
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-3 sm:mb-4 mx-auto"
                style={{
                  background: themeColors.gradient,
                }}
              >
                {tier.id === 'pro' ? (
                  <Crown className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: themeColors.text }} />
                ) : tier.popular ? (
                  <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: themeColors.text }} />
                ) : (
                  <Zap className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: themeColors.text }} />
                )}
              </div>

              {/* Name */}
              <h3
                className="text-lg sm:text-xl font-bold mb-3 text-center"
                style={{ color: themeColors.text }}
              >
                {tier.name}
              </h3>

              {/* Tokens - Moved up for better hierarchy */}
              <div
                className="px-3 py-3 sm:py-4 rounded-xl mb-3 text-center"
                style={{
                  backgroundColor: themeColors.surface,
                  border: `1px solid ${themeColors.border}`,
                }}
              >
                <div
                  className="text-3xl sm:text-4xl font-bold mb-1"
                  style={{ color: themeColors.accent }}
                >
                  {formatTokens(tier.tokens)}
                </div>
                <div
                  className="text-xs sm:text-sm"
                  style={{ color: themeColors.textMuted }}
                >
                  tokens
                </div>
              </div>

              {/* Price */}
              <div className="mb-4 text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span
                    className="text-3xl sm:text-4xl font-bold"
                    style={{ color: themeColors.text }}
                  >
                    ${getDiscountedPrice(tier.price)}
                  </span>
                  <span className="text-sm" style={{ color: themeColors.textMuted }}>
                    {billingCycle === 'monthly' ? '/mo' : ''}
                  </span>
                </div>
                {billingCycle === 'monthly' && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: themeColors.textMuted }}
                  >
                    Save ${(tier.price * 0.1).toFixed(2)}/month
                  </p>
                )}
                {billingCycle === 'one-time' && (
                  <p
                    className="text-xs mt-1"
                    style={{ color: themeColors.textMuted }}
                  >
                    One-time payment
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-5 flex-grow">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                    <Check
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0"
                      style={{ color: themeColors.accent }}
                    />
                    <span style={{ color: themeColors.textSecondary }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              <button
                onClick={() => handlePurchase(tier)}
                className="w-full py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all mt-auto"
                style={{
                  background: tier.popular ? themeColors.gradient : themeColors.surface,
                  color: themeColors.text,
                  border: tier.popular ? 'none' : `1px solid ${themeColors.border}`,
                }}
                onMouseEnter={(e) => {
                  if (!tier.popular) {
                    e.currentTarget.style.backgroundColor = themeColors.surfaceHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!tier.popular) {
                    e.currentTarget.style.backgroundColor = themeColors.surface;
                  }
                }}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>

        {/* Footer Info */}
        <div
          className="p-6 border-t rounded-b-3xl"
          style={{
            borderColor: themeColors.border,
            backgroundColor: themeColors.surface,
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <Shield className="w-8 h-8 mx-auto mb-2" style={{ color: themeColors.accent }} />
              <p className="font-semibold mb-1" style={{ color: themeColors.text }}>
                Secure Payment
              </p>
              <p className="text-xs" style={{ color: themeColors.textMuted }}>
                Powered by Stripe
              </p>
            </div>
            <div>
              <TrendingUp className="w-8 h-8 mx-auto mb-2" style={{ color: themeColors.accent }} />
              <p className="font-semibold mb-1" style={{ color: themeColors.text }}>
                No Expiration
              </p>
              <p className="text-xs" style={{ color: themeColors.textMuted }}>
                Tokens never expire
              </p>
            </div>
            <div>
              <Sparkles className="w-8 h-8 mx-auto mb-2" style={{ color: themeColors.accent }} />
              <p className="font-semibold mb-1" style={{ color: themeColors.text }}>
                All AI Models
              </p>
              <p className="text-xs" style={{ color: themeColors.textMuted }}>
                Access to 27+ models
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
