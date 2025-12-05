import React, { useState } from 'react';
import { Crown, Zap, Check, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

export const SimpleProUpgrade: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isPro, setIsPro] = useState(false);

  React.useEffect(() => {
    if (user) {
      checkProStatus();
    }
  }, [user]);

  const checkProStatus = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_paid, is_premium, paid_tokens_balance')
        .eq('id', user.uid)
        .maybeSingle();

      setIsPro(data?.is_paid || data?.is_premium || (data?.paid_tokens_balance ?? 0) > 0);
    } catch (error) {
      console.error('Error checking pro status:', error);
    }
  };

  const handleUpgradeToPro = async () => {
    if (!user || isUpgrading || isPro) return;

    setIsUpgrading(true);

    try {
      console.log('🚀 Upgrading user to Pro:', user.uid);

      const { error } = await supabase
        .from('profiles')
        .update({
          is_paid: true,
          is_premium: true,
          current_tier: 'premium',
          paid_tokens_balance: 1000000,
          tokens_balance: supabase.rpc('get_current_tokens', { p_user_id: user.uid }).then(r => (r.data || 0) + 1000000),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.uid);

      if (error) throw error;

      console.log('✅ User upgraded to Pro successfully');

      setIsPro(true);
      showToast('Successfully upgraded to Pro! You now have 1,000,000 tokens and unlimited generations.', 'success');

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('❌ Error upgrading to Pro:', error);
      showToast('Failed to upgrade. Please try again.', 'error');
    } finally {
      setIsUpgrading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (isPro) {
    return (
      <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Pro Member</h3>
            <p className="text-sm text-white/60">You have unlimited access</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/80">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm">Unlimited generations</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm">Priority support</span>
          </div>
          <div className="flex items-center gap-2 text-white/80">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm">Access to all models</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-[#00FFF0]/30 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-[#00FFF0] to-[#00D4D4]">
          <Zap className="w-6 h-6 text-black" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Upgrade to Pro</h3>
          <p className="text-sm text-white/60">Get unlimited access</p>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-2 text-white/80">
          <Check className="w-4 h-4 text-[#00FFF0]" />
          <span className="text-sm">1,000,000 tokens instantly</span>
        </div>
        <div className="flex items-center gap-2 text-white/80">
          <Check className="w-4 h-4 text-[#00FFF0]" />
          <span className="text-sm">Unlimited images, videos & music</span>
        </div>
        <div className="flex items-center gap-2 text-white/80">
          <Check className="w-4 h-4 text-[#00FFF0]" />
          <span className="text-sm">Access to all premium models</span>
        </div>
        <div className="flex items-center gap-2 text-white/80">
          <Check className="w-4 h-4 text-[#00FFF0]" />
          <span className="text-sm">Priority generation queue</span>
        </div>
      </div>

      <button
        onClick={handleUpgradeToPro}
        disabled={isUpgrading}
        className="w-full px-6 py-3 bg-gradient-to-r from-[#00FFF0] to-[#00D4D4] hover:from-[#00D4D4] hover:to-[#00FFF0] text-black font-bold rounded-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isUpgrading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Upgrading...</span>
          </>
        ) : (
          <>
            <Crown className="w-5 h-5" />
            <span>Upgrade to Pro (FREE)</span>
          </>
        )}
      </button>

      <p className="text-xs text-white/40 text-center mt-3">
        Temporary: No payment required
      </p>
    </div>
  );
};
