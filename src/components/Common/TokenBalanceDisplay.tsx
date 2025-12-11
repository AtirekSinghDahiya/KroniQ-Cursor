import React, { useState, useEffect } from 'react';
import { Coins, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

interface TokenBalanceDisplayProps {
  isExpanded?: boolean;
  showDetails?: boolean;
  onPurchaseClick?: () => void;
}

interface TokenBalance {
  tier: string;
  dailyTokens: number;
  paidTokens: number;
  totalTokens: number;
  canUsePaidModels: boolean;
}

export const TokenBalanceDisplay: React.FC<TokenBalanceDisplayProps> = ({ isExpanded = false, showDetails = true, onPurchaseClick }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch token balance directly from Firebase
  const fetchBalance = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        const profile = userDoc.data();
        const tokensLimit = profile.tokensLimit || 0;
        const tokensUsed = profile.tokensUsed || 0;
        const totalTokens = tokensLimit - tokensUsed;
        const plan = profile.plan || 'free';
        const isPremium = plan === 'premium' || plan === 'paid';

        setBalance({
          tier: isPremium ? 'premium' : 'free',
          dailyTokens: 0,
          paidTokens: isPremium ? totalTokens : 0,
          totalTokens,
          canUsePaidModels: isPremium || totalTokens > 500000
        });
      } else {
        setBalance(null);
      }
    } catch (error) {
      console.error('Exception fetching token balance:', error);
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchBalance();
  }, [user]);

  // Real-time subscription to token balance changes
  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      doc(db, 'users', user.uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const profile = docSnapshot.data();
          const tokensLimit = profile.tokensLimit || 0;
          const tokensUsed = profile.tokensUsed || 0;
          const totalTokens = tokensLimit - tokensUsed;
          const plan = profile.plan || 'free';
          const isPremium = plan === 'premium' || plan === 'paid';

          setBalance({
            tier: isPremium ? 'premium' : 'free',
            dailyTokens: 0,
            paidTokens: isPremium ? totalTokens : 0,
            totalTokens,
            canUsePaidModels: isPremium || totalTokens > 500000
          });
        }
      },
      (error) => {
        console.error('Realtime token error:', error);
      }
    );

    // Refresh every 30 seconds as fallback
    const interval = setInterval(fetchBalance, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [user]);

  if (!user) {
    return null;
  }

  // Determine color based on tier and balance - now using gray scale
  const getBalanceColor = () => {
    if (!balance) return 'text-gray-400';
    if (balance.tier === 'premium' || balance.paidTokens > 0) return 'text-white';
    if (balance.totalTokens >= 10000) return 'text-gray-300';
    if (balance.totalTokens >= 1000) return 'text-gray-400';
    return 'text-gray-500';
  };

  const getTierLabel = () => {
    if (!balance) return 'FREE';
    if (balance.tier === 'premium' && balance.paidTokens > 0) return 'PREMIUM';
    if (balance.tier === 'premium') return 'PREMIUM (No Tokens)';
    return 'FREE';
  };

  const displayBalance = balance?.totalTokens || 0;

  if (!isExpanded && !showDetails) {
    // Compact view for navbar - just icon and balance
    return (
      <button
        onClick={onPurchaseClick}
        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 animate-fade-in"
      >
        <Coins className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-bold text-white">{displayBalance.toLocaleString()}</span>
      </button>
    );
  }

  // Expanded view - clean, simple display with gray theme
  return (
    <div className="bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-200 animate-fade-in">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white/10">
            <Coins className="w-4 h-4 text-gray-400" />
          </div>
          <span className="text-sm text-white/70 font-medium">Token Balance</span>
        </div>
        <span className={`text-xs font-bold ${getBalanceColor()} uppercase tracking-wide`}>
          {getTierLabel()}
        </span>
      </div>

      {balance && (
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-400" />
          <span className="text-2xl font-bold text-white">
            {displayBalance.toLocaleString()}
          </span>
          <span className="text-sm text-white/50 ml-1">tokens</span>
        </div>
      )}
    </div>
  );
};
