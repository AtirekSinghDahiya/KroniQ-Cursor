import React, { useMemo } from 'react';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { TokenEstimator } from '../../lib/tokenEstimator';
import { calculateTokensForMessage, getModelCost, formatTokenDisplay } from '../../lib/modelTokenPricing';

interface TokenEstimateDisplayProps {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  selectedModel?: string;
  userBalance?: number;
  className?: string;
}

export const TokenEstimateDisplay: React.FC<TokenEstimateDisplayProps> = ({
  message,
  conversationHistory,
  selectedModel = 'grok-4-fast',
  userBalance = 0,
  className = '',
}) => {
  const estimate = useMemo(() => {
    if (!message.trim()) {
      return {
        tokens: 0,
        credits: 0,
        modelCost: getModelCost(selectedModel),
        actualTokens: 0,
        balanceAfter: userBalance,
        percentOfBalance: 0
      };
    }

    const modelCost = getModelCost(selectedModel);
    const actualTokens = calculateTokensForMessage(selectedModel, message.length);
    const balanceAfter = Math.max(0, userBalance - actualTokens);
    const percentOfBalance = userBalance > 0 ? (actualTokens / userBalance) * 100 : 0;

    const baseCost = TokenEstimator.estimateMessageCost(message, undefined, conversationHistory);

    return {
      tokens: baseCost.tokens,
      credits: baseCost.credits,
      modelCost,
      actualTokens,
      balanceAfter,
      percentOfBalance
    };
  }, [message, conversationHistory, selectedModel, userBalance]);

  if (!message.trim()) {
    return null;
  }

  const getColorClass = () => {
    if (estimate.percentOfBalance < 5) return 'text-green-400';
    if (estimate.percentOfBalance < 15) return 'text-yellow-400';
    if (estimate.percentOfBalance < 30) return 'text-orange-400';
    return 'text-red-400';
  };

  const getCostLevel = () => {
    const tokens = estimate.actualTokens;
    if (tokens < 50) return 'Very Cheap';
    if (tokens < 200) return 'Cheap';
    if (tokens < 500) return 'Moderate';
    if (tokens < 2000) return 'Expensive';
    return 'Very Expensive';
  };

  const showWarning = estimate.percentOfBalance > 20;
  const hasEnough = userBalance >= estimate.actualTokens;

  return (
    <div className={`flex flex-col gap-2 p-3 rounded-lg border ${
      showWarning
        ? 'bg-orange-500/10 border-orange-500/30'
        : hasEnough
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-red-500/10 border-red-500/30'
    } ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Zap className={`w-3 h-3 ${getColorClass()}`} />
            <span className={`font-semibold ${getColorClass()}`}>
              {formatTokenDisplay(estimate.actualTokens)} tokens
            </span>
          </div>
          <span className="text-white/40">•</span>
          <span className="text-white/60">{getCostLevel()}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-white/60">
          <span>{estimate.modelCost.icon}</span>
          <span>{estimate.modelCost.name}</span>
        </div>
      </div>

      {userBalance > 0 && (
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-2">
            <span className="text-white/50">Balance:</span>
            <span className="text-white/70 font-medium">
              {formatTokenDisplay(userBalance)}
            </span>
            <TrendingDown className="w-3 h-3 text-white/40" />
            <span className={hasEnough ? 'text-green-400' : 'text-red-400'}>
              {formatTokenDisplay(estimate.balanceAfter)}
            </span>
          </div>
          <span className={`font-semibold ${getColorClass()}`}>
            {estimate.percentOfBalance.toFixed(1)}% of balance
          </span>
        </div>
      )}

      {showWarning && hasEnough && (
        <div className="text-[10px] text-orange-400 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          Consider using a cheaper model to save tokens
        </div>
      )}

      {!hasEnough && (
        <div className="text-[10px] text-red-400 font-semibold">
          Insufficient balance! Need {formatTokenDisplay(estimate.actualTokens - userBalance)} more tokens
        </div>
      )}
    </div>
  );
};
