import { useEffect, useState } from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { PromoService } from '../../lib/promoService';

interface PromoBannerProps {
  campaignCode: string;
}

export default function PromoBanner({ campaignCode }: PromoBannerProps) {
  const [remainingSlots, setRemainingSlots] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [tokenAmount, setTokenAmount] = useState(0);

  useEffect(() => {
    const checkCampaign = async () => {
      setIsLoading(true);
      const status = await PromoService.checkCampaignStatus(campaignCode);
      setIsValid(status.isValid);
      setRemainingSlots(status.remainingSlots);
      setTokenAmount(status.tokenAmount);
      setIsLoading(false);
    };

    checkCampaign();

    const interval = setInterval(checkCampaign, 10000);

    return () => clearInterval(interval);
  }, [campaignCode]);

  if (isLoading) {
    return (
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl animate-pulse">
        <div className="h-6 bg-slate-700/50 rounded w-3/4 mx-auto"></div>
      </div>
    );
  }

  if (!isValid || remainingSlots === null) {
    return null;
  }

  const formatTokens = (tokens: number): string => {
    return tokens.toLocaleString();
  };

  const getUrgencyColor = () => {
    if (remainingSlots <= 10) return 'from-red-600 to-orange-600';
    if (remainingSlots <= 30) return 'from-orange-600 to-yellow-600';
    return 'from-blue-600 to-purple-600';
  };

  const getUrgencyText = () => {
    if (remainingSlots <= 10) return 'Almost Gone!';
    if (remainingSlots <= 30) return 'Going Fast!';
    return 'Limited Offer!';
  };

  return (
    <div className={`mb-6 p-4 bg-gradient-to-r ${getUrgencyColor()} bg-opacity-10 border border-current rounded-xl shadow-lg animate-fade-in relative overflow-hidden`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>

      <div className="relative flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce-slow">
            <Gift className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400 uppercase tracking-wide">
              {getUrgencyText()}
            </span>
          </div>

          <h3 className="text-xl font-bold text-white mb-2">
            You're eligible for {formatTokens(tokenAmount)} FREE tokens!
          </h3>

          <p className="text-slate-300 mb-3">
            Complete signup to claim your bonus tokens and start creating with AI.
          </p>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-slate-300">
                <span className="font-bold text-white">{remainingSlots}</span> of 100 spots remaining
              </span>
            </div>
          </div>

          <div className="mt-3 bg-slate-900/50 rounded-lg p-2">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Progress</span>
              <span>{100 - remainingSlots}/100 claimed</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${getUrgencyColor()} transition-all duration-500 ease-out`}
                style={{ width: `${((100 - remainingSlots) / 100) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
