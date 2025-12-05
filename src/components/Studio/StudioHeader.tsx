import React from 'react';
import { X, LucideIcon } from 'lucide-react';

export interface StudioHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  color: string;
  limitInfo?: string;
  tokenBalance?: number;
  onClose: () => void;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  color,
  limitInfo,
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
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-semibold text-white truncate">
              {title}
            </h1>
            {tokenBalance !== undefined && (
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs font-medium text-white/80">
                  {tokenBalance.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {(subtitle || limitInfo) && (
            <div className="flex items-center gap-2 mt-0.5">
              {subtitle && (
                <p className="text-xs text-white/40 truncate">{subtitle}</p>
              )}
              {limitInfo && (
                <span className="hidden sm:inline text-xs text-white/40">
                  • {limitInfo}
                </span>
              )}
            </div>
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
