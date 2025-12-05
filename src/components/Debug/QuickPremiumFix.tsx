import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

interface StatusCheck {
  user_id: string;
  paid_tokens_balance: number;
  tokens_balance: number;
  messages_remaining: number;
  is_premium: boolean;
  is_paid: boolean;
  is_paid_user: boolean;
  current_tier: string;
  diagnosis: string;
}

export const QuickPremiumFix: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<StatusCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);

  const checkStatus = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('check_user_premium_status', { p_user_id: user.uid });

      if (error) {
        console.error('Error checking status:', error);
        return;
      }

      if (data && data.length > 0) {
        setStatus(data[0]);
        console.log('Premium Status Check:', data[0]);
      }
    } catch (error) {
      console.error('Exception checking status:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceSync = async () => {
    if (!user?.uid) return;

    setFixing(true);
    try {
      // Force re-run the sync by updating the profile
      const { error } = await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', user.uid);

      if (error) {
        console.error('Error syncing:', error);
        alert('Failed to sync. Check console for details.');
      } else {
        alert('Sync triggered! The auto-sync trigger should have updated all flags. Refresh the page to see changes.');
        setTimeout(() => checkStatus(), 1000);
      }
    } catch (error) {
      console.error('Exception syncing:', error);
    } finally {
      setFixing(false);
    }
  };

  React.useEffect(() => {
    if (user?.uid) {
      checkStatus();
    }
  }, [user?.uid]);

  if (!user) {
    return (
      <div className="p-4 bg-slate-800 rounded-lg border border-white/10">
        <p className="text-white/70">Please sign in to check premium status</p>
      </div>
    );
  }

  const hasIssue = status?.diagnosis.includes('ISSUE');
  const isOK = status?.diagnosis.includes('OK');

  return (
    <div className="p-6 bg-slate-900 rounded-xl border border-white/10 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          {hasIssue && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
          {isOK && <CheckCircle className="w-5 h-5 text-green-400" />}
          Premium Status Check
        </h3>
        <button
          onClick={checkStatus}
          disabled={loading}
          className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-white text-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {status && (
        <div className="space-y-3">
          <div className={`p-3 rounded-lg text-sm ${
            hasIssue ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-200' :
            isOK ? 'bg-green-500/20 border border-green-500/30 text-green-200' :
            'bg-slate-800 border border-white/10 text-white/70'
          }`}>
            {status.diagnosis}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="text-white/50 mb-1">Paid Tokens</div>
              <div className="text-white font-bold text-lg">{status.paid_tokens_balance.toLocaleString()}</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="text-white/50 mb-1">Total Tokens</div>
              <div className="text-white font-bold text-lg">{status.tokens_balance.toLocaleString()}</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="text-white/50 mb-1">Messages</div>
              <div className="text-white font-bold text-lg">{status.messages_remaining.toLocaleString()}</div>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="text-white/50 mb-1">Tier</div>
              <div className="text-white font-bold text-lg uppercase">{status.current_tier}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-white/50">Premium:</span>
            <span className={status.is_premium ? 'text-green-400' : 'text-red-400'}>
              {status.is_premium ? '✅ YES' : '❌ NO'}
            </span>
            <span className="text-white/50 ml-3">Paid:</span>
            <span className={status.is_paid ? 'text-green-400' : 'text-red-400'}>
              {status.is_paid ? '✅ YES' : '❌ NO'}
            </span>
          </div>

          {hasIssue && (
            <button
              onClick={forceSync}
              disabled={fixing}
              className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {fixing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Syncing...
                </>
              ) : (
                'Force Sync Premium Flags'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
