import React, { useState, useEffect } from 'react';
import { Check, Zap, Crown, Building2, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { supabase } from '../../lib/supabaseClient';

interface PricingPlan {
  id: string;
  name: string;
  display_name: string;
  price: string;
  billing_period: string;
  features: string[];
  limits: {
    storage_mb: number;
    code_projects: number;
    images_monthly: number;
    videos_monthly: number;
    chat_messages_daily: number;
    code_lines_per_project: number;
  };
  is_active: boolean;
  sort_order: number;
  stripe_payment_link?: string;
}

export const PricingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { navigateTo } = useNavigation();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading pricing plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (plan: PricingPlan) => {
    if (!currentUser) {
      navigateTo('login' as any);
      return;
    }

    if (plan.name === 'starter') {
      return;
    }

    if (plan.name === 'enterprise') {
      window.location.href = 'mailto:sales@kroniq.ai?subject=Enterprise%20Plan%20Inquiry';
      return;
    }

    setPurchasing(plan.id);

    // Use plan's stripe link or fallback to hardcoded links
    const stripeLinks: Record<string, string> = {
      'creator': 'https://buy.stripe.com/test_dRm5kC9zc5ZZ88DekPcV200',
      'pro': 'https://buy.stripe.com/test_4gMdR8eTw9cbfB590vcV201'
    };

    const paymentLink = plan.stripe_payment_link || stripeLinks[plan.name];

    if (paymentLink) {
      window.location.href = paymentLink;
    } else {
      alert('Payment link not configured for this plan');
      setPurchasing(null);
    }
  };

  const getPlanIcon = (name: string) => {
    switch (name) {
      case 'starter':
        return Sparkles;
      case 'creator':
        return Zap;
      case 'pro':
        return Crown;
      case 'enterprise':
        return Building2;
      default:
        return Sparkles;
    }
  };

  const getPlanColor = (name: string) => {
    switch (name) {
      case 'starter':
        return 'from-blue-500/20 to-cyan-500/20';
      case 'creator':
        return 'from-[#00FFF0]/20 to-blue-500/20';
      case 'pro':
        return 'from-[#8A2BE2]/20 to-pink-500/20';
      case 'enterprise':
        return 'from-orange-500/20 to-red-500/20';
      default:
        return 'from-[#00FFF0]/20 to-[#8A2BE2]/20';
    }
  };

  const formatLimit = (value: number) => {
    if (value === -1) return 'Unlimited';
    if (value >= 1024) return `${(value / 1024).toFixed(0)} GB`;
    return value.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-background flex items-center justify-center">
        <div className="typing-indicator">
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
          <div className="typing-dot"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-background relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="orbit-ring" style={{ width: '600px', height: '600px', top: '10%', left: '5%' }} />
        <div className="orbit-ring" style={{ width: '800px', height: '800px', top: '40%', right: '0%' }} />
      </div>

      <div className={`relative z-10 px-4 py-20 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}>
        {/* Header */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <div className="inline-block px-6 py-3 glass-panel rounded-full border border-white/20 mb-8">
            <span className="text-[#00FFF0] text-sm font-bold tracking-wider">PRICING PLANS</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-[#00FFF0] via-[#8A2BE2] to-[#00FFF0] bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              Creative Power
            </span>
          </h1>

          <p className="text-xl text-white/70 leading-relaxed">
            Start free, upgrade as you grow. All plans include access to our AI-powered creative tools.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan, index) => {
            const Icon = getPlanIcon(plan.name);
            const isPro = plan.name === 'pro';
            const isEnterprise = plan.name === 'enterprise';

            return (
              <div
                key={plan.id}
                style={{ animationDelay: `${index * 100}ms` }}
                className={`glass-panel rounded-3xl p-8 border ${
                  isPro ? 'border-[#8A2BE2] ring-2 ring-[#8A2BE2]/50' : 'border-white/20'
                } hover:border-[#00FFF0]/50 transition-all duration-500 hover:scale-105 animate-fade-in-up relative overflow-hidden group`}
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${getPlanColor(plan.name)} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                {/* Popular Badge */}
                {isPro && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-[#8A2BE2] to-[#00FFF0] text-white text-xs font-bold px-4 py-1 rounded-bl-2xl">
                    MOST POPULAR
                  </div>
                )}

                <div className="relative z-10">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 flex items-center justify-center mb-6">
                    <Icon className="w-8 h-8 text-[#00FFF0]" />
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.display_name}</h3>

                  {/* Price */}
                  <div className="mb-6">
                    {isEnterprise ? (
                      <div>
                        <p className="text-3xl font-extrabold text-white">Custom</p>
                        <p className="text-sm text-white/60">Contact sales</p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-5xl font-extrabold text-white">${plan.price}</span>
                        <span className="text-white/60 ml-2">/{plan.billing_period === 'monthly' ? 'mo' : 'yr'}</span>
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-[#00FFF0] flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-white/80">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limits */}
                  <div className="space-y-2 mb-8 p-4 glass-panel rounded-xl border border-white/10">
                    <p className="text-xs font-semibold text-white/60 mb-2">LIMITS</p>
                    <div className="space-y-1 text-xs text-white/70">
                      {plan.limits.chat_messages_daily !== -1 && (
                        <p>• {plan.limits.chat_messages_daily} messages/day</p>
                      )}
                      {plan.limits.code_projects !== -1 && (
                        <p>• {plan.limits.code_projects} code projects</p>
                      )}
                      {plan.limits.images_monthly !== -1 && (
                        <p>• {plan.limits.images_monthly} images/month</p>
                      )}
                      {plan.limits.videos_monthly !== -1 && (
                        <p>• {plan.limits.videos_monthly} videos/month</p>
                      )}
                      <p>• {formatLimit(plan.limits.storage_mb)} storage</p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handlePurchase(plan)}
                    disabled={purchasing === plan.id}
                    className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                      isPro
                        ? 'bg-gradient-to-r from-[#8A2BE2] to-[#00FFF0] text-white hover:shadow-xl hover:shadow-[#8A2BE2]/40'
                        : 'glass-panel border border-white/20 text-white hover:bg-white/10'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {purchasing === plan.id ? (
                      <>
                        <div className="typing-indicator">
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                        </div>
                        <span>Processing...</span>
                      </>
                    ) : isEnterprise ? (
                      <>
                        <span>Contact Sales</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : plan.name === 'starter' ? (
                      <>
                        <span>Get Started Free</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>Upgrade Now</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add-Ons Section */}
        <div className="max-w-4xl mx-auto mt-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Add-Ons</h2>
            <p className="text-white/70">Enhance your plan with additional resources</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-2">Extra Storage</h3>
              <p className="text-3xl font-bold text-[#00FFF0] mb-4">$3</p>
              <p className="text-sm text-white/60 mb-4">per 10 GB/month</p>
              <button className="w-full py-3 glass-panel border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all text-sm font-semibold">
                Add Storage
              </button>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-2">Video Credits</h3>
              <p className="text-3xl font-bold text-[#00FFF0] mb-4">$5</p>
              <p className="text-sm text-white/60 mb-4">per 10 videos</p>
              <button className="w-full py-3 glass-panel border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all text-sm font-semibold">
                Buy Credits
              </button>
            </div>

            <div className="glass-panel rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-2">API Access</h3>
              <p className="text-3xl font-bold text-[#00FFF0] mb-4">$10</p>
              <p className="text-sm text-white/60 mb-4">per month</p>
              <button className="w-full py-3 glass-panel border border-white/20 text-white rounded-xl hover:bg-white/10 transition-all text-sm font-semibold">
                Enable API
              </button>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mt-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'Can I change plans later?',
                a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.'
              },
              {
                q: 'What happens if I exceed my limits?',
                a: "You'll receive a notification when approaching your limits. You can purchase add-ons or upgrade your plan."
              },
              {
                q: 'Is there a free trial for paid plans?',
                a: 'Yes! We offer a 7-day Pro trial after sign-up so you can experience all premium features.'
              },
              {
                q: 'Do you offer refunds?',
                a: 'Yes, we offer a 30-day money-back guarantee on all paid plans.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="glass-panel rounded-2xl p-6 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-2">{faq.q}</h3>
                <p className="text-white/70 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
