import React from 'react';
import { X, LucideIcon, Coins } from 'lucide-react';

export interface GenerationLimitData {
  current: number;
  limit: number;
  isPaid?: boolean;
}

export interface StudioHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  color: string;
  limitInfo?: string;
  generationLimit?: GenerationLimitData;
  tokenBalance?: number;
  onClose: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  color,
  limitInfo: _limitInfo, // kept for backwards compatibility
  generationLimit,
  tokenBalance,
  onClose
}) => {

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 bg-black">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div
          className="flex-shrink-0 p-2 rounded-lg border"
          style={{
            backgroundColor: `${color}20`,
            borderColor: `${color}40`
          }}
        >
          <Icon
            className="w-4 h-4 sm:w-5 sm:h-5"
            style={{ color }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-semibold text-white truncate">
              {title}
            </h1>

            {/* Generation Limit Display - Visual X/Y format */}
            {generationLimit && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
                title={generationLimit.isPaid ? 'Unlimited (token-based)' : `${generationLimit.limit - generationLimit.current} remaining today`}
              >
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="text-xs font-medium text-white/80">
                  {generationLimit.isPaid ? (
                    <span style={{ color }}>∞</span>
                  ) : (
                    <>
                      <span className={generationLimit.current >= generationLimit.limit ? 'text-red-400' : 'text-white'}>
                        {generationLimit.current}
                      </span>
                      <span className="text-white/50">/{generationLimit.limit}</span>
                    </>
                  )}
                </span>
                {!generationLimit.isPaid && (
                  <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${Math.min((generationLimit.current / generationLimit.limit) * 100, 100)}%`,
                        backgroundColor: generationLimit.current >= generationLimit.limit ? '#ef4444' :
                          generationLimit.current >= generationLimit.limit * 0.8 ? '#eab308' : color
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Token Balance Display */}
            {tokenBalance !== undefined && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-medium text-white/80">
                  {tokenBalance.toLocaleString()}
                </span>
                <span className="text-[10px] text-white/40">tokens</span>
              </div>
            )}
          </div>

          {subtitle && (
            <p className="text-xs text-white/40 truncate mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      <button
        onClick={onClose}
        className="flex-shrink-0 p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors"
        aria-label="Close studio"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
