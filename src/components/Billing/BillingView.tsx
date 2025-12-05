/**
 * Billing View - Token & Subscription Management
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { Coins, CreditCard, RefreshCw, Wallet } from 'lucide-react';
import { SubscriptionManager } from './SubscriptionManager';
import { TokenPackPricing } from './TokenPackPricing';
import { MessagePackPricing } from './MessagePackPricing';
import { SimpleProUpgrade } from './SimpleProUpgrade';
import { MessageCreditsService, UserCreditsInfo } from '../../lib/messageCreditsService';
import { supabase } from '../../lib/supabase';
import { clearUnifiedCache } from '../../lib/unifiedPremiumAccess';

export const BillingView: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [tokenBalances, setTokenBalances] = useState({ total: 0, paid: 0, free: 0, tier: 'free' as 'free' | 'paid' });
  const [messageCredits, setMessageCredits] = useState<UserCreditsInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'buy-messages' | 'subscription' | 'upgrade'>('overview');

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('paid_tokens_balance, tokens_balance, free_tokens_balance, current_tier, is_paid')
        .eq('id', user.uid)
        .maybeSingle();

      if (profile) {
        const paidTokens = profile.paid_tokens_balance || 0;
        const freeTokens = profile.free_tokens_balance || 0;
        const totalTokens = profile.tokens_balance || (paidTokens + freeTokens);
        const tier = (paidTokens > 0 || profile.is_paid) ? 'paid' : 'free';

        setTokenBalances({
          total: totalTokens,
          paid: paidTokens,
          free: freeTokens,
          tier
        });
      }

      const credits = await MessageCreditsService.getUserCredits(user.uid);
      setMessageCredits(credits);
    } catch (error) {
      showToast('error', 'Load Failed', 'Could not load billing data');
    } finally {
      setLoading(false);
    }
  };

  const grantTestPremium = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      await supabase
        .from('profiles')
        .update({
          paid_tokens_balance: 10000000,
          tokens_balance: 10000000,
          is_premium: true,
          is_paid: true,
          current_tier: 'premium',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.uid);

      clearUnifiedCache(user.uid);

      await supabase
        .from('paid_tier_users')
        .upsert({
          id: user.uid,
          email: user.email || '',
          tier_level: 'premium',
          tokens_remaining: 10000000,
          upgraded_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      await supabase
        .from('free_tier_users')
        .delete()
        .eq('id', user.uid);

      showToast('success', 'Premium Granted!', 'You now have 10M premium tokens. Refresh the page to see changes.');
      await loadData();

      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      showToast('error', 'Failed', 'Could not grant premium access');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Wallet },
    { id: 'upgrade', label: 'Upgrade to Pro', icon: CreditCard },
    { id: 'buy-messages', label: 'Buy Tokens', icon: Coins },
    { id: 'subscription', label: 'Subscription', icon: RefreshCw },
  ];

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${
      theme === 'light'
        ? 'bg-gradient-to-br from-gray-50 to-blue-50'
        : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
    }`}>
      {/* Header */}
      <div className={`p-6 border-b ${
        theme === 'light' ? 'border-gray-200 bg-white/50' : 'border-white/10 bg-black/20'
      } backdrop-blur-xl`}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#00FFF0] to-[#8A2BE2]">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              Billing & Tokens
            </h1>
            <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-white/60'}`}>
              Manage your tokens and subscriptions
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`border-b ${theme === 'light' ? 'border-gray-200 bg-white/50' : 'border-white/10 bg-black/10'}`}>
        <div className="flex gap-2 p-4 max-w-7xl mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white shadow-lg'
                    : theme === 'light'
                    ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Balance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel rounded-2xl p-6 border-2 border-[#00FFF0]/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#00FFF0]/20 flex items-center justify-center">
                      <Coins className="w-5 h-5 text-[#00FFF0]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Token Balance</h3>
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">
                    {((messageCredits?.messages_remaining || 0) / 1000).toFixed(1)}K
                  </div>
                  <div className="text-sm text-white/60">
                    {messageCredits?.is_paid_user ? 'Purchased tokens' : 'Free daily tokens'}
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-6 border-2 border-[#8A2BE2]/30">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#8A2BE2]/20 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-[#8A2BE2]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Usage Today</h3>
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">
                    {((messageCredits?.daily_messages_used || 0) / 1000).toFixed(1)}K
                  </div>
                  <div className="text-sm text-white/60">
                    {messageCredits?.is_paid_user
                      ? 'No daily limits'
                      : `of 1K daily tokens`
                    }
                  </div>
                </div>
              </div>

              {/* Current Tier */}
              <div className="glass-panel rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Current Plan</h3>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-2xl font-bold text-white capitalize">
                      {tokenBalances.tier === 'paid' ? 'Paid' : 'Free'} Plan
                    </div>
                    <div className="text-white/60">
                      {tokenBalances.tier === 'paid'
                        ? 'No daily limits • Tokens never expire'
                        : '1K tokens per day • Resets daily'}
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full ${
                    tokenBalances.tier === 'paid'
                      ? 'bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] text-white'
                      : 'bg-green-500/20 text-green-300 border border-green-500/30'
                  } font-semibold`}>
                    {tokenBalances.tier === 'paid' ? '💎 Premium' : '🆓 Free'}
                  </div>
                </div>
                {tokenBalances.tier === 'free' && (
                  <button
                    onClick={grantTestPremium}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-semibold"
                  >
                    🧪 Grant Test Premium (10M Tokens)
                  </button>
                )}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setActiveTab('buy-messages')}
                  className="glass-panel rounded-2xl p-6 border-2 border-white/10 hover:border-[#00FFF0]/50 transition-all text-left group"
                >
                  <Coins className="w-12 h-12 text-[#00FFF0] mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="text-xl font-bold text-white mb-2">Buy Tokens</h3>
                  <p className="text-white/60">
                    One-time purchase with instant delivery
                  </p>
                </button>

                <button
                  onClick={() => setActiveTab('subscription')}
                  className="glass-panel rounded-2xl p-6 border-2 border-white/10 hover:border-[#8A2BE2]/50 transition-all text-left group"
                >
                  <RefreshCw className="w-12 h-12 text-[#8A2BE2] mb-4 group-hover:rotate-180 transition-transform duration-500" />
                  <h3 className="text-xl font-bold text-white mb-2">Subscribe & Save</h3>
                  <p className="text-white/60">
                    Get 10% off with monthly auto-refill
                  </p>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'upgrade' && <SimpleProUpgrade />}

          {activeTab === 'buy-messages' && <MessagePackPricing />}

          {activeTab === 'subscription' && <SubscriptionManager />}
        </div>
      </div>
    </div>
  );
};
