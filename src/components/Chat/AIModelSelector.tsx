import React, { useState, useEffect, useMemo } from 'react';
import { Check, ChevronDown, Lock, Zap, RefreshCw, Search } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getUnifiedPremiumStatus, clearUnifiedCache, forceRefreshPremiumStatus, subscribeToProfileChanges, UnifiedPremiumStatus } from '../../lib/unifiedPremiumAccess';
import { getModelCost, getTierBadgeColor, formatTokenDisplay } from '../../lib/modelTokenPricing';
import { AI_MODELS, AIModel, searchModels } from '../../lib/aiModels';

export type { AIModel };

interface AIModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  category?: 'chat' | 'code' | 'image' | 'video' | 'audio';
}

export const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  category = 'chat'
}) => {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [premiumAccess, setPremiumAccess] = useState<UnifiedPremiumStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const checkAccess = async () => {
    if (!currentUser) {
      console.log('❌ AIModelSelector: No current user');
      setPremiumAccess(null);
      setIsLoading(false);
      return;
    }

    console.log('🔍 AIModelSelector: Checking access for user:', currentUser.uid);
    setIsLoading(true);
    try {
      const access = await getUnifiedPremiumStatus(currentUser.uid);
      console.log('✅ AIModelSelector: Got premium access:', access);
      setPremiumAccess(access);
    } catch (error) {
      console.error('❌ AIModelSelector: Error getting premium access:', error);
      setPremiumAccess(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      checkAccess();

      // Subscribe to real-time profile changes
      const unsubscribe = subscribeToProfileChanges(currentUser.uid, (newStatus) => {
        console.log('📡 Received profile update in AIModelSelector:', newStatus);
        setPremiumAccess(newStatus);
      });

      return () => {
        unsubscribe();
      };
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen && currentUser) {
      checkAccess();
    }
  }, [isOpen]);

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    const status = await forceRefreshPremiumStatus(currentUser.uid);
    setPremiumAccess(status);
  };

  const availableModels = useMemo(() => {
    if (searchQuery.trim()) {
      return searchModels(searchQuery, category);
    }
    return AI_MODELS.filter(m => m.category === category);
  }, [category, searchQuery]);

  const modelLockStatus = useMemo(() => {
    const status = new Map<string, boolean>();
    console.log('🔒 Calculating model lock status. premiumAccess:', premiumAccess);

    availableModels.forEach(model => {
      const modelCost = getModelCost(model.id);
      const isFree = modelCost.tier === 'free';

      if (isFree) {
        status.set(model.id, false);
      } else {
        const isLocked = !premiumAccess?.isPremium;
        console.log(`🔐 Model ${model.id}: tier=${modelCost.tier}, isPremium=${premiumAccess?.isPremium}, isLocked=${isLocked}`);
        status.set(model.id, isLocked);
      }
    });

    return status;
  }, [availableModels, premiumAccess?.isPremium]);

  const selected = availableModels.find(m => m.id === selectedModel) || availableModels[0];

  const isPremiumUser = premiumAccess?.isPremium === true;

  return (
    <div className="relative group w-full max-w-full">
      <div className={`relative rounded-xl p-[2px] shadow-lg ${
        theme === 'light'
          ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
          : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600'
      }`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={`relative w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl transition-all duration-300 ${
            theme === 'light'
              ? 'bg-white/95 hover:bg-white text-gray-900 backdrop-blur-xl'
              : 'bg-slate-900/95 hover:bg-slate-800/95 text-white backdrop-blur-xl'
          }`}
        >
          {getModelCost(selected.id).logoUrl ? (
            <img src={getModelCost(selected.id).logoUrl} alt={selected.provider} className="w-5 h-5 sm:w-6 sm:h-6 rounded flex-shrink-0" />
          ) : (
            <span className="text-lg sm:text-xl flex-shrink-0">{getModelCost(selected.id).icon}</span>
          )}
          <div className="flex-1 text-left min-w-0">
            <div className={`text-xs sm:text-sm font-semibold truncate ${
              theme === 'light' ? 'text-gray-900' : 'text-white/90'
            }`}>{selected.name}</div>
            <div className={`text-[10px] sm:text-xs mt-0.5 flex items-center gap-1 sm:gap-2 ${
              theme === 'light' ? 'text-gray-500' : 'text-white/50'
            }`}>
              <span className="truncate">{selected.provider}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:flex items-center gap-1">
                <Zap className="w-3 h-3" />
                {formatTokenDisplay(getModelCost(selected.id).tokensPerMessage)}
              </span>
            </div>
          </div>

          {isLoading && (
            <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          )}

          <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 flex-shrink-0 ${
            theme === 'light' ? 'text-gray-600' : 'text-cyan-400'
          } ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className={`absolute bottom-full left-0 right-0 mb-3 w-full backdrop-blur-3xl border rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in ${
            theme === 'light'
              ? 'bg-white/95 border-gray-200'
              : 'glass-panel border-white/20'
          }`}>
            {isLoading ? (
              <div className="p-8 flex flex-col items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                <p className={theme === 'light' ? 'text-gray-600' : 'text-white/60'}>
                  Checking access...
                </p>
              </div>
            ) : (
              <>
                {/* Search Bar */}
                <div className="p-3 border-b border-white/10">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    theme === 'light' ? 'bg-gray-100' : 'bg-white/5'
                  }`}>
                    <Search className="w-4 h-4 text-white/50" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search models..."
                      className={`flex-1 bg-transparent outline-none text-sm ${
                        theme === 'light' ? 'text-gray-900 placeholder-gray-500' : 'text-white placeholder-white/50'
                      }`}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="text-white/50 hover:text-white"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-2 max-h-[50vh] sm:max-h-72 overflow-y-auto scrollbar-thin">
                  {availableModels.map((model, index) => {
                    const modelCost = getModelCost(model.id);
                    const isLocked = modelLockStatus.get(model.id) || false;

                    return (
                      <button
                        key={model.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isLocked) {
                            onModelChange(model.id);
                            setIsOpen(false);
                          }
                        }}
                        disabled={isLocked}
                        style={{ animationDelay: `${index * 30}ms` }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 group/item animate-fade-in-up ${
                          isLocked
                            ? 'opacity-50 cursor-not-allowed'
                            : selectedModel === model.id
                              ? theme === 'light'
                                ? 'bg-blue-50 border border-blue-200'
                                : 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-400/30'
                              : theme === 'light'
                                ? 'hover:bg-gray-100 border border-transparent'
                                : 'hover:bg-white/10 border border-transparent hover:border-white/10'
                        }`}
                      >
                        <div className="flex-1 text-left">
                          <div className={`text-sm font-semibold transition-colors flex items-center gap-2 ${
                            selectedModel === model.id
                              ? theme === 'light' ? 'text-blue-600' : 'text-cyan-400'
                              : theme === 'light' ? 'text-gray-900 group-hover/item:text-blue-600' : 'text-white group-hover/item:text-cyan-300'
                          }`}>
                            {modelCost.logoUrl ? (
                              <img src={modelCost.logoUrl} alt={model.provider} className="w-5 h-5 rounded" />
                            ) : (
                              <span className="text-lg">{modelCost.icon}</span>
                            )}
                            {model.name}
                            {isLocked && <Lock className="w-3 h-3 text-yellow-500" />}
                          </div>
                          <div className={`text-xs mt-0.5 transition-colors flex items-center gap-2 ${
                            theme === 'light'
                              ? 'text-gray-600 group-hover/item:text-gray-800'
                              : 'text-white/50 group-hover/item:text-white/70'
                          }`}>
                            <span>{model.description}</span>
                            {isLocked && <span>• Purchase tokens to unlock</span>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              getTierBadgeColor(modelCost.tier)
                            }`}>
                              {modelCost.tier === 'free' ? 'FREE' : modelCost.tier.toUpperCase()}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-white/60">
                              <Zap className="w-3 h-3" />
                              {formatTokenDisplay(modelCost.tokensPerMessage)}/msg
                            </span>
                          </div>
                        </div>
                        {selectedModel === model.id && !isLocked && (
                          <Check className={`w-4 h-4 animate-fade-in ${
                            theme === 'light' ? 'text-blue-600' : 'text-cyan-400'
                          }`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};
