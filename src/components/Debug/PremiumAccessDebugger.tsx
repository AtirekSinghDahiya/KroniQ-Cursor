import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { getUserTierAccess } from '../../lib/tierAccessService';

interface DiagnosticResult {
  user_id: string;
  email: string;
  tokens_balance: number;
  paid_tokens_balance: number;
  free_tokens_balance: number;
  daily_tokens_remaining: number;
  is_premium: boolean;
  current_tier: string;
  is_paid: boolean;
  should_have_premium_access: boolean;
  diagnosis: string;
}

export const PremiumAccessDebugger: React.FC = () => {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  const [clientCheck, setClientCheck] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState(false);

  const runDiagnostics = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('diagnose_premium_access', {
        p_user_id: user.uid
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setDiagnostics(data[0]);
      }

      const access = await getUserTierAccess(user.uid);
      setClientCheck(access.canAccessPremiumModels);
    } catch (error) {
      console.error('Diagnostic error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fixPremiumAccess = async () => {
    if (!user?.uid) return;

    setFixing(true);
    try {
      const { data, error } = await supabase.rpc('fix_premium_access', {
        p_user_id: user.uid
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        console.log('Fix result:', result);
        alert(result.message);
        await runDiagnostics();
      }
    } catch (error) {
      console.error('Fix error:', error);
      alert('Failed to fix premium access. Check console for details.');
    } finally {
      setFixing(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      runDiagnostics();
    }
  }, [user?.uid]);

  if (!user) {
    return (
      <div className="glass-panel rounded-xl p-6 border-white/10">
        <p className="text-white/70">Please sign in to view diagnostics</p>
      </div>
    );
  }

  const getStatusIcon = (isOk: boolean) => {
    return isOk ? (
      <CheckCircle className="w-5 h-5 text-green-400" />
    ) : (
      <XCircle className="w-5 h-5 text-red-400" />
    );
  };

  const isHealthy = diagnostics?.diagnosis.startsWith('OK:');
  const hasIssue = diagnostics?.diagnosis.startsWith('ISSUE:');

  return (
    <div className="glass-panel rounded-xl p-6 border-white/10 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-yellow-400" />
          Premium Access Diagnostics
        </h2>
        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-white text-sm font-medium transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-white/70 text-center py-8">
          Running diagnostics...
        </div>
      ) : diagnostics ? (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${
            isHealthy ? 'bg-green-500/20 border border-green-500/30' :
            hasIssue ? 'bg-red-500/20 border border-red-500/30' :
            'bg-yellow-500/20 border border-yellow-500/30'
          }`}>
            <p className="text-white font-medium">{diagnostics.diagnosis}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-sm text-white/50 mb-2">Token Balances</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Paid Tokens:</span>
                  <span className="text-white font-bold">{diagnostics.paid_tokens_balance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Total Tokens:</span>
                  <span className="text-white font-bold">{diagnostics.tokens_balance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Free Tokens:</span>
                  <span className="text-white font-bold">{diagnostics.free_tokens_balance.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Daily Remaining:</span>
                  <span className="text-white font-bold">{diagnostics.daily_tokens_remaining.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <h3 className="text-sm text-white/50 mb-2">Premium Flags</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-white/70">is_premium:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnostics.is_premium)}
                    <span className="text-white font-bold">{diagnostics.is_premium ? 'TRUE' : 'FALSE'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">current_tier:</span>
                  <span className="text-white font-bold uppercase">{diagnostics.current_tier}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70">is_paid:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(diagnostics.is_paid)}
                    <span className="text-white font-bold">{diagnostics.is_paid ? 'TRUE' : 'FALSE'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <h3 className="text-sm text-white/50 mb-2">Access Check Results</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-white/70">Should Have Premium Access:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(diagnostics.should_have_premium_access)}
                  <span className="text-white font-bold">{diagnostics.should_have_premium_access ? 'YES' : 'NO'}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70">Client-Side Check (isPremiumUser):</span>
                <div className="flex items-center gap-2">
                  {clientCheck !== null && getStatusIcon(clientCheck)}
                  <span className="text-white font-bold">{clientCheck !== null ? (clientCheck ? 'PREMIUM' : 'FREE') : 'CHECKING...'}</span>
                </div>
              </div>
            </div>
          </div>

          {hasIssue && (
            <div className="flex items-center justify-center">
              <button
                onClick={fixPremiumAccess}
                disabled={fixing}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg text-white font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {fixing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  'Fix Premium Access Now'
                )}
              </button>
            </div>
          )}

          <div className="text-xs text-white/50 text-center">
            User ID: {diagnostics.user_id}
          </div>
        </div>
      ) : (
        <div className="text-white/70 text-center py-8">
          No diagnostic data available
        </div>
      )}
    </div>
  );
};
