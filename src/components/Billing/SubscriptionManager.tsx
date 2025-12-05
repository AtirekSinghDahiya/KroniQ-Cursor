/**
 * Subscription Manager Component
 * Displays and manages user's active subscriptions
 */

import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  getActiveSubscription,
  getSubscriptionRenewals,
  cancelSubscription,
  formatNextBillingDate,
  Subscription,
  SubscriptionRenewal,
} from '../../lib/subscriptionManagementService';

export const SubscriptionManager: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [renewals, setRenewals] = useState<SubscriptionRenewal[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [subData, renewalData] = await Promise.all([
        getActiveSubscription(user.uid),
        getSubscriptionRenewals(user.uid),
      ]);

      setSubscription(subData);
      setRenewals(renewalData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !subscription) return;

    setCanceling(true);
    try {
      const result = await cancelSubscription(user.uid, subscription.id);

      if (result.success) {
        showToast('success', 'Subscription Canceled', 'Your subscription will end at the end of the current billing period. You will keep all your tokens.');
        setShowCancelConfirm(false);
        await loadSubscriptionData();
      } else {
        showToast('error', 'Cancellation Failed', result.error || 'Failed to cancel subscription');
      }
    } catch (error: any) {
      showToast('error', 'Error', error.message);
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-white/10">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3"></div>
          <div className="h-20 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-white/10">
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Active Subscription</h3>
          <p className="text-white/60">
            Subscribe to a token pack to get automatic monthly refills with 10% savings!
          </p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string, cancelAtEnd: boolean) => {
    if (cancelAtEnd) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
          <XCircle className="w-3 h-3 inline mr-1" />
          Canceling at Period End
        </span>
      );
    }

    switch (status) {
      case 'active':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
            <CheckCircle className="w-3 h-3 inline mr-1" />
            Active
          </span>
        );
      case 'past_due':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30">
            <AlertCircle className="w-3 h-3 inline mr-1" />
            Past Due
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-300 border border-gray-500/30">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Subscription Card */}
      <div className="glass-panel rounded-2xl p-6 border-2 border-[#00FFF0]/30 shadow-lg shadow-[#00FFF0]/10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">{subscription.packName} Plan</h3>
            {getStatusBadge(subscription.status, subscription.cancelAtPeriodEnd)}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
              ${subscription.pricePerCycle}
            </div>
            <div className="text-sm text-white/60">per month</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#00FFF0]/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#00FFF0]" />
              </div>
              <div>
                <div className="text-sm text-white/60">Tokens per Refill</div>
                <div className="text-xl font-bold text-white">{subscription.tokensPerRefill.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#8A2BE2]/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[#8A2BE2]" />
              </div>
              <div>
                <div className="text-sm text-white/60">Next Billing Date</div>
                <div className="text-lg font-semibold text-white">
                  {formatNextBillingDate(subscription.currentPeriodEnd)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {!subscription.cancelAtPeriodEnd && (
          <button
            onClick={() => setShowCancelConfirm(true)}
            className="w-full px-6 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 transition-all font-semibold"
          >
            Cancel Subscription
          </button>
        )}

        {subscription.cancelAtPeriodEnd && (
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
            <p className="text-yellow-300 text-sm">
              Your subscription will end on {formatNextBillingDate(subscription.currentPeriodEnd)}. You will keep all your current tokens.
            </p>
          </div>
        )}
      </div>

      {/* Renewal History */}
      {renewals.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">Renewal History</h3>
          <div className="space-y-3">
            {renewals.slice(0, 5).map((renewal) => (
              <div key={renewal.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <div className="text-white font-medium">
                    {renewal.tokensAdded.toLocaleString()} tokens added
                  </div>
                  <div className="text-sm text-white/60">
                    {new Date(renewal.renewedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-semibold">${renewal.amountPaid}</div>
                  <div className="text-xs text-white/60">paid</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Cancel Subscription?</h3>
              <p className="text-white/60">
                Your subscription will remain active until {formatNextBillingDate(subscription.currentPeriodEnd)}.
                You will keep all your current tokens.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCancelSubscription}
                disabled={canceling}
                className="w-full px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {canceling ? 'Canceling...' : 'Yes, Cancel Subscription'}
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={canceling}
                className="w-full px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all"
              >
                Keep Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
