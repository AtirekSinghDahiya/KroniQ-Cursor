import React, { useState, useEffect } from 'react';
import { Check, Sparkles, Zap, Crown, ArrowRight } from 'lucide-react';
import { Floating3DCard, AnimatedGradientOrb } from './FloatingElements';
import { getTokenPacks, getTotalTokens } from '../../lib/subscriptionManagementService';

interface PricingPageProps {
  onGetStarted: () => void;
}

const formatTokens = (tokens: number): string => {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(0)}K`;
  }
  return tokens.toString();
};

export const PricingPage: React.FC<PricingPageProps> = ({ onGetStarted }) => {
  const [mounted, setMounted] = useState(false);
  const [tokenPacks, setTokenPacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    loadPacks();
  }, []);

  const loadPacks = async () => {
    try {
      const packs = await getTokenPacks();
      if (packs && packs.length > 0) {
        setTokenPacks(packs);
        setLoading(false);
      } else {
        // Fallback data if Supabase fails
        setTokenPacks([
          {
            id: '1',
            name: 'Starter',
            tokens: 900000,
            priceUsd: 2,
            recurringPriceUsd: 2,
            bonusTokens: 0,
            popular: false,
            active: true
          },
          {
            id: '2',
            name: 'Popular',
            tokens: 2250000,
            priceUsd: 5,
            recurringPriceUsd: 5,
            bonusTokens: 0,
            popular: true,
            active: true
          },
          {
            id: '3',
            name: 'Pro',
            tokens: 9000000,
            priceUsd: 20,
            recurringPriceUsd: 20,
            bonusTokens: 0,
            popular: false,
            active: true
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading token packs:', error);
      // Fallback data on error
      setTokenPacks([
        {
          id: '1',
          name: 'Starter',
          tokens: 900000,
          priceUsd: 2,
          recurringPriceUsd: 2,
          bonusTokens: 0,
          popular: false,
          active: true
        },
        {
          id: '2',
          name: 'Popular',
          tokens: 2250000,
          priceUsd: 5,
          recurringPriceUsd: 5,
          bonusTokens: 0,
          popular: true,
          active: true
        },
        {
          id: '3',
          name: 'Pro',
          tokens: 9000000,
          priceUsd: 20,
          recurringPriceUsd: 20,
          bonusTokens: 0,
          popular: false,
          active: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      question: 'How does token-based pricing work?',
      answer: 'You pay only for what you use. Every AI request costs tokens based on (Provider Cost × 2). Tokens never expire.'
    },
    {
      question: 'What happens when I run out of tokens?',
      answer: 'If you have a subscription, you get refilled automatically each month. If you bought tokens one-time, you can purchase more anytime. Free users get 10,000 daily tokens.'
    },
    {
      question: 'Can I cancel my subscription?',
      answer: 'Yes! Cancel anytime. Your tokens remain yours forever, even after cancellation. No contracts, no commitments.'
    },
    {
      question: 'What\'s the difference between free and paid?',
      answer: 'Free gives you 10,000 daily tokens and access to 14 free AI models. Paid gives you access to all 27 models (including premium ones) and your purchased tokens never expire.'
    }
  ];

  if (loading) {
    return (
      <div className="relative w-full min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#00FFF0]"></div>
      </div>
    );
  }

  return (
    <div className="relative w-full pb-20">
      <AnimatedGradientOrb className="top-40 left-10 w-96 h-96" />
      <AnimatedGradientOrb className="bottom-40 right-10 w-[500px] h-[500px]" />

      {/* Hero Section */}
      <section className={`relative pt-40 pb-20 px-4 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-block px-6 py-3 glass-panel rounded-full border border-white/20 mb-8">
            <span className="text-[#00FFF0] text-sm font-bold tracking-wider">TOKEN-BASED PRICING</span>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-8 leading-tight">
            Pay Only For{' '}
            <span className="bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
              What You Use
            </span>
          </h1>

          <p className="text-2xl text-white/70 leading-relaxed max-w-3xl mx-auto mb-8">
            Flexible token packs that never expire. No subscriptions required.
          </p>

        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tokenPacks.slice(0, 3).map((pack, idx) => {
              const Icon = [Sparkles, Zap, Crown][idx];
              const totalTokens = getTotalTokens(pack.tokens, pack.bonusTokens);
              const monthlyPrice = pack.recurringPriceUsd;
              const savings = (pack.priceUsd - monthlyPrice).toFixed(2);

              return (
                <Floating3DCard key={pack.id} delay={idx * 100}>
                  <div
                    className={`relative glass-panel rounded-3xl p-8 border transition-all duration-500 h-full flex flex-col ${
                      pack.popular
                        ? 'border-[#00FFF0]/60 scale-105 shadow-2xl shadow-[#00FFF0]/20'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    {pack.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className="bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white px-6 py-2 rounded-full text-sm font-bold">
                          💎 MOST POPULAR
                        </div>
                      </div>
                    )}

                    <div className="flex-1">
                      {/* Icon */}
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${
                        pack.popular ? 'from-[#00FFF0] to-[#8A2BE2]' : 'from-white/10 to-white/5'
                      } flex items-center justify-center mb-6`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>

                      {/* Plan Name */}
                      <h3 className="text-3xl font-bold text-white mb-2">{pack.name}</h3>

                      {/* Tokens */}
                      <div className="mb-6">
                        <div className="text-5xl font-bold bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent mb-2">
                          {formatTokens(totalTokens)}
                        </div>
                        <div className="text-white/60">tokens</div>
                        {pack.bonusTokens > 0 && (
                          <div className="mt-2 text-sm text-[#00FFF0]">
                            + {formatTokens(pack.bonusTokens)} bonus!
                          </div>
                        )}
                      </div>

                      {/* Pricing Options */}
                      <div className="space-y-4 mb-8">
                        <div className="glass-panel rounded-xl p-4 border border-white/10">
                          <div className="text-white/60 text-sm mb-1">One-Time Purchase</div>
                          <div className="text-3xl font-bold text-white">${pack.priceUsd}</div>
                          <div className="text-xs text-white/40 mt-1">Tokens never expire</div>
                        </div>
                        <div className="glass-panel rounded-xl p-4 border border-[#00FFF0]/30 relative overflow-hidden">
                          <div className="absolute top-2 right-2">
                            <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-bold">
                              SAVE ${savings}
                            </span>
                          </div>
                          <div className="text-white/60 text-sm mb-1">Monthly Subscription</div>
                          <div className="text-3xl font-bold bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
                            ${monthlyPrice}
                          </div>
                          <div className="text-xs text-white/40 mt-1">Refills every month • Cancel anytime</div>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-3 mb-8">
                        <div className="flex items-center gap-2 text-white/70">
                          <Check className="w-5 h-5 text-[#00FFF0]" />
                          <span>All 27 AI models</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <Check className="w-5 h-5 text-[#00FFF0]" />
                          <span>Never expires</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <Check className="w-5 h-5 text-[#00FFF0]" />
                          <span>Rollover unused tokens</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <Check className="w-5 h-5 text-[#00FFF0]" />
                          <span>Priority support</span>
                        </div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={onGetStarted}
                      className={`w-full py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 ${
                        pack.popular
                          ? 'bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white hover:shadow-lg hover:shadow-[#00FFF0]/30'
                          : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                      }`}
                    >
                      Get Started
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </Floating3DCard>
              );
            })}
          </div>

          {/* Free Tier Info */}
          <div className="mt-16 max-w-4xl mx-auto">
            <Floating3DCard>
              <div className="glass-panel rounded-3xl p-8 border border-white/20">
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-bold text-white mb-2">Start Free</h3>
                  <p className="text-white/60">No credit card required</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white/70">
                      <Check className="w-5 h-5 text-[#00FFF0]" />
                      <span>10,000 daily tokens (refreshes)</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Check className="w-5 h-5 text-[#00FFF0]" />
                      <span>Access to 14 free AI models</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Check className="w-5 h-5 text-[#00FFF0]" />
                      <span>All basic features included</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-white/70">
                      <Check className="w-5 h-5 text-[#00FFF0]" />
                      <span>Perfect for trying KroniQ</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Check className="w-5 h-5 text-[#00FFF0]" />
                      <span>No subscription required</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/70">
                      <Check className="w-5 h-5 text-[#00FFF0]" />
                      <span>Upgrade anytime</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onGetStarted}
                  className="w-full mt-6 py-4 rounded-xl bg-white/10 text-white hover:bg-white/20 font-bold transition-all"
                >
                  Start Free
                </button>
              </div>
            </Floating3DCard>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            <p className="text-xl text-white/70">Everything you need to know about tokens</p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <Floating3DCard key={idx} delay={idx * 100}>
                <div className="glass-panel rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-500">
                  <h3 className="text-xl font-bold text-white mb-4">{faq.question}</h3>
                  <p className="text-white/70 leading-relaxed">{faq.answer}</p>
                </div>
              </Floating3DCard>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <Floating3DCard>
            <div className="glass-panel rounded-3xl p-16 border-2 border-white/20 text-center">
              <h2 className="text-4xl font-bold text-white mb-6">
                Ready to unlock unlimited creativity?
              </h2>
              <p className="text-xl text-white/70 mb-8">
                Start with our free tier or choose a plan that fits your needs
              </p>
              <button
                onClick={onGetStarted}
                className="bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white px-10 py-4 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-[#00FFF0]/30 transition-all duration-300 hover:scale-105 inline-flex items-center gap-2"
              >
                Get Started Now
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </Floating3DCard>
        </div>
      </section>
    </div>
  );
};
