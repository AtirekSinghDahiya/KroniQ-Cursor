import React, { useState, useEffect } from 'react';
import {
  Sparkles, Image, Video, Music, Mic, Sliders, ChevronDown,
  Lock, Zap, Info, Settings
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getUnifiedPremiumStatus, UnifiedPremiumStatus } from '../../lib/unifiedPremiumAccess';
import { DynamicTokenEstimator } from '../../lib/dynamicTokenEstimator';

export type StudioMode = 'chat' | 'image' | 'video' | 'music' | 'voice';

interface StudioControlPanelProps {
  mode: StudioMode;
  onModeChange: (mode: StudioMode) => void;
  modelName: string;
  modelDescription: string;
  controls: React.ReactNode;
  advancedSettings?: React.ReactNode;
}

export const StudioControlPanel: React.FC<StudioControlPanelProps> = ({
  mode,
  onModeChange,
  modelName,
  modelDescription,
  controls,
  advancedSettings,
}) => {
  const { user } = useAuth();
  const [premiumStatus, setPremiumStatus] = useState<UnifiedPremiumStatus | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (user?.uid) {
        const status = await getUnifiedPremiumStatus(user.uid);
        setPremiumStatus(status);
      }
    };
    checkAccess();
  }, [user]);

  const modes = [
    { id: 'chat' as StudioMode, label: 'Chat', icon: Sparkles, color: 'from-cyan-500 to-blue-600', available: true },
    { id: 'image' as StudioMode, label: 'Image', icon: Image, color: 'from-pink-500 to-rose-600', available: true },
    { id: 'video' as StudioMode, label: 'Video', icon: Video, color: 'from-purple-500 to-indigo-600', available: premiumStatus?.isPremium || false },
    { id: 'music' as StudioMode, label: 'Music', icon: Music, color: 'from-green-500 to-emerald-600', available: premiumStatus?.isPremium || false },
    { id: 'voice' as StudioMode, label: 'Voice', icon: Mic, color: 'from-orange-500 to-red-600', available: premiumStatus?.isPremium || false },
  ];

  return (
    <div className="w-80 xl:w-96 glass-panel border-l border-white/10 flex flex-col h-full overflow-hidden">
      {/* Mode Selector */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Sliders className="w-4 h-4 text-[#00FFF0]" />
          <span className="text-white/60 text-sm font-semibold uppercase tracking-wide">Studio Mode</span>
        </div>

        <div className="grid grid-cols-5 gap-1 bg-white/5 rounded-xl p-1">
          {modes.map((m) => {
            const Icon = m.icon;
            const isActive = mode === m.id;
            const isDisabled = !m.available;

            return (
              <button
                key={m.id}
                onClick={() => !isDisabled && onModeChange(m.id)}
                disabled={isDisabled}
                className={`relative group flex flex-col items-center justify-center py-2.5 rounded-lg transition-all ${
                  isActive
                    ? `bg-gradient-to-br ${m.color} text-white shadow-lg`
                    : isDisabled
                    ? 'text-white/30 cursor-not-allowed'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
                title={isDisabled ? 'Premium feature' : m.label}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-semibold">{m.label}</span>

                {isDisabled && (
                  <div className="absolute -top-1 -right-1">
                    <Lock className="w-3 h-3 text-yellow-400" />
                  </div>
                )}

                {!isDisabled && !isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>

        {mode !== 'chat' && !premiumStatus?.isPremium && (
          <div className="mt-3 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-200">
                Premium feature. Upgrade to unlock all studio modes.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Model Info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-white font-bold text-lg">{modelName}</h3>
          <div className="flex items-center gap-1">
            {premiumStatus?.isPremium && (
              <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#00FFF0]/20 to-[#8A2BE2]/20 border border-[#00FFF0]/30">
                <span className="text-[#00FFF0] text-xs font-semibold">PRO</span>
              </div>
            )}
            <Zap className="w-4 h-4 text-[#00FFF0]" />
          </div>
        </div>
        <p className="text-white/60 text-sm leading-relaxed">{modelDescription}</p>
      </div>

      {/* Main Controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {controls}
      </div>

      {/* Advanced Settings */}
      {advancedSettings && (
        <div className="border-t border-white/10">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-4 py-3 flex items-center justify-between text-white/70 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span className="text-sm font-semibold">Advanced Settings</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-4">
              {advancedSettings}
            </div>
          )}
        </div>
      )}

      {/* Token Balance */}
      {premiumStatus && (
        <div className="p-4 border-t border-white/10 bg-gradient-to-br from-white/5 to-white/0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-xs font-semibold uppercase">Token Balance</span>
            <Info className="w-3 h-3 text-white/40" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
              {premiumStatus.totalTokens.toLocaleString()}
            </span>
            <span className="text-white/40 text-sm">tokens</span>
          </div>
          {premiumStatus.paidTokens > 0 && (
            <div className="mt-1 text-xs text-white/50">
              {premiumStatus.paidTokens.toLocaleString()} paid tokens available
            </div>
          )}
        </div>
      )}
    </div>
  );
};
