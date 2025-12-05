import React, { useState, useEffect } from 'react';
import { RefreshCw, XCircle, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../contexts/ThemeContext';
import {
  checkPremiumAccess,
  clearPremiumCache,
  syncUserToTierTables,
  verifyTierSystem,
  PremiumAccessResult
} from '../../lib/premiumAccessService';
import { supabase } from '../../lib/supabaseClient';

export const TierDebugPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [premiumAccess, setPremiumAccess] = useState<PremiumAccessResult | null>(null);
  const [systemStats, setSystemStats] = useState<Record<string, number>>({});
  const [profileData, setProfileData] = useState<any>(null);
  const [paidTierData, setPaidTierData] = useState<any>(null);
  const [freeTierData, setFreeTierData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<string>('');

  const loadAllData = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const [access, stats] = await Promise.all([
        checkPremiumAccess(user.uid),
        verifyTierSystem()
      ]);

      setPremiumAccess(access);
      setSystemStats(stats);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.uid)
        .maybeSingle();

      setProfileData(profile);

      const { data: paidTier } = await supabase
        .from('paid_tier_users')
        .select('*')
        .eq('id', user.uid)
        .maybeSingle();

      setPaidTierData(paidTier);

      const { data: freeTier } = await supabase
        .from('free_tier_users')
        .select('*')
        .eq('id', user.uid)
        .maybeSingle();

      setFreeTierData(freeTier);
    } catch (error) {
      console.error('Error loading debug data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user?.uid]);

  const handleSync = async () => {
    if (!user?.uid) return;

    setLoading(true);
    setSyncResult('');

    try {
      const result = await syncUserToTierTables(user.uid);
      setSyncResult(result);
      clearPremiumCache(user.uid);
      await loadAllData();
    } catch (error) {
      setSyncResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = () => {
    if (user?.uid) {
      clearPremiumCache(user.uid);
      loadAllData();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
        theme === 'light' ? 'bg-white' : 'bg-gray-900'
      }`}>
        <div className={`sticky top-0 px-6 py-4 border-b flex items-center justify-between ${
          theme === 'light' ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-700'
        }`}>
          <h2 className="text-xl font-bold">Premium Access Debug Panel</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Sync User to Tier Tables
            </button>
            <button
              onClick={handleClearCache}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Clear Cache & Refresh
            </button>
          </div>

          {syncResult && (
            <div className={`p-4 rounded-lg ${
              syncResult.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {syncResult}
            </div>
          )}

          <div className={`p-4 rounded-lg border-2 ${
            premiumAccess?.isPremium
              ? 'bg-green-50 border-green-500 dark:bg-green-900/20 dark:border-green-500'
              : 'bg-red-50 border-red-500 dark:bg-red-900/20 dark:border-red-500'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {premiumAccess?.isPremium ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <h3 className="text-lg font-bold">
                Status: {premiumAccess?.isPremium ? 'PREMIUM' : 'FREE'}
              </h3>
            </div>
            {premiumAccess && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Source: {premiumAccess.tierSource}</div>
                <div>Tokens: {premiumAccess.paidTokens.toLocaleString()}</div>
                <div>Tier: {premiumAccess.tierLevel}</div>
                <div>Cached: {new Date(premiumAccess.timestamp).toLocaleTimeString()}</div>
              </div>
            )}
          </div>

          <div className={`p-4 rounded-lg ${
            theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'
          }`}>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Info className="w-5 h-5" />
              System Statistics
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(systemStats).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span>{key}:</span>
                  <span className="font-bold">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`p-4 rounded-lg ${
            theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'
          }`}>
            <h3 className="text-lg font-bold mb-3">Profiles Table Data</h3>
            {profileData ? (
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(profileData, null, 2)}
              </pre>
            ) : (
              <p className="text-red-500">No profile data found</p>
            )}
          </div>

          <div className={`p-4 rounded-lg ${
            theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'
          }`}>
            <h3 className="text-lg font-bold mb-3">Paid Tier Users Table Data</h3>
            {paidTierData ? (
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(paidTierData, null, 2)}
              </pre>
            ) : (
              <p className="text-yellow-500">Not in paid tier table</p>
            )}
          </div>

          <div className={`p-4 rounded-lg ${
            theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'
          }`}>
            <h3 className="text-lg font-bold mb-3">Free Tier Users Table Data</h3>
            {freeTierData ? (
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(freeTierData, null, 2)}
              </pre>
            ) : (
              <p className="text-yellow-500">Not in free tier table</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
