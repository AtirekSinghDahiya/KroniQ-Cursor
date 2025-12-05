import React, { useState, useEffect } from 'react';
import { MessageCreditsService } from '../../lib/messageCreditsService';
import { useAuth } from '../../hooks/useAuth';

interface MessagePack {
  id: string;
  name: string;
  tokens: number;
  price_usd: number;
  popular: boolean;
  bonus_tokens: number;
}

export function MessagePackPricing() {
  const { user } = useAuth();
  const [packs, setPacks] = useState<MessagePack[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadPacks();
  }, []);

  const loadPacks = async () => {
    setLoading(true);
    const data = await MessageCreditsService.getMessagePacks();
    setPacks(data);
    setLoading(false);
  };

  const handlePurchase = async (pack: MessagePack) => {
    if (!user) return;

    setPurchasing(pack.id);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            packId: pack.id,
            userId: user.uid,
            userEmail: user.email,
            mode: 'payment',
            amount: pack.price_usd,
          }),
        }
      );

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error initiating purchase:', error);
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {packs.map((pack) => (
        <div
          key={pack.id}
          className={`relative bg-gray-800/50 rounded-xl p-6 border ${
            pack.popular
              ? 'border-blue-500 shadow-lg shadow-blue-500/20'
              : 'border-gray-700'
          }`}
        >
          {pack.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                BEST VALUE
              </span>
            </div>
          )}

          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-2">
              {pack.name}
            </h3>

            <div className="mb-4">
              <div className="text-4xl font-bold text-white">
                ${pack.price_usd}
              </div>
              <div className="text-gray-400 text-sm mt-1">one-time</div>
            </div>

            <div className="mb-6">
              <div className="text-3xl font-bold text-blue-400">
                {(pack.tokens / 1000).toLocaleString()}K
              </div>
              <div className="text-gray-400 text-sm">tokens</div>
              {pack.bonus_tokens > 0 && (
                <div className="text-green-400 text-xs mt-1">
                  + {(pack.bonus_tokens / 1000).toLocaleString()}K bonus!
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-300 mb-6">
              <div className="flex items-center justify-center">
                <span className="text-gray-400">
                  ${((pack.price_usd / pack.tokens) * 1000).toFixed(2)} per 1K tokens
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Tokens never expire • Use anytime
              </div>
              <div className="text-xs text-gray-500">
                Small messages use fewer tokens
              </div>
            </div>

            <button
              onClick={() => handlePurchase(pack)}
              disabled={purchasing === pack.id || !user}
              className={`w-full py-3 rounded-lg font-medium transition-all ${
                pack.popular
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              } ${
                purchasing === pack.id ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {purchasing === pack.id ? 'Processing...' : 'Purchase Now'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
