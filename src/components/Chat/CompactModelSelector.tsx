import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Lock, Zap, Check, Sparkles, Search, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAccessInfo } from '../../lib/modelAccessControl';
import { getModelCost, getTierBadgeColor, formatTokenDisplay } from '../../lib/modelTokenPricing';
import { AI_MODELS, AIModel } from '../../lib/aiModels';

interface CompactModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  category?: 'chat' | 'code' | 'image' | 'video' | 'audio';
}

export const CompactModelSelector: React.FC<CompactModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  category = 'chat'
}) => {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [userType, setUserType] = useState<'free' | 'paid'>('free');
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!currentUser) {
        setIsPremium(false);
        setUserType('free');
        return;
      }
      try {
        const accessInfo = await getUserAccessInfo(currentUser.uid);
        if (accessInfo) {
          setIsPremium(accessInfo.isPremium);
          setUserType(accessInfo.userType);
        } else {
          setIsPremium(false);
          setUserType('free');
        }
      } catch (error) {
        console.error('Error checking user access:', error);
        setIsPremium(false);
        setUserType('free');
      }
    };
    checkAccess();
  }, [currentUser]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Group models by provider with search filtering
  const modelGroups = useMemo(() => {
    const filteredModels = AI_MODELS.filter(m => m.category === category);
    const grouped = new Map<string, AIModel[]>();
    const searchLower = searchQuery.toLowerCase().trim();

    filteredModels.forEach(model => {
      if (searchLower) {
        const matchesName = model.name.toLowerCase().includes(searchLower);
        const matchesProvider = model.provider.toLowerCase().includes(searchLower);
        const matchesDescription = model.description.toLowerCase().includes(searchLower);
        const modelCost = getModelCost(model.id);
        const matchesTier = modelCost.tier.toLowerCase().includes(searchLower);

        if (!matchesName && !matchesProvider && !matchesDescription && !matchesTier) {
          return;
        }
      }

      const provider = model.provider;
      if (!grouped.has(provider)) {
        grouped.set(provider, []);
      }
      grouped.get(provider)!.push(model);
    });

    return Array.from(grouped.entries())
      .map(([provider, models]) => ({
        provider,
        models: models.sort((a, b) => {
          const aCost = getModelCost(a.id);
          const bCost = getModelCost(b.id);
          const tierOrder = { 'free': 0, 'budget': 1, 'mid': 2, 'premium': 3, 'ultra-premium': 4 };
          return tierOrder[aCost.tier] - tierOrder[bCost.tier];
        })
      }))
      .sort((a, b) => a.provider.localeCompare(b.provider));
  }, [category, searchQuery]);

  const selectedModelData = AI_MODELS.find(m => m.id === selectedModel);
  const selectedModelCost = selectedModelData ? getModelCost(selectedModelData.id) : null;
  const isModelLocked = (model: AIModel): boolean => {
    if (isPremium || userType === 'paid') {
      return false;
    }
    return model.tier !== 'FREE';
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Compact Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all group ${
          theme === 'light'
            ? 'bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 hover:border-blue-400 hover:shadow-blue-100'
            : 'bg-gradient-to-r from-slate-900/95 to-slate-800/95 border-2 border-white/10 hover:border-cyan-400/50'
        } backdrop-blur-xl shadow-lg hover:shadow-2xl hover:scale-[1.01] active:scale-[0.99]`}
      >
        {/* Model Icon/Logo */}
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            {selectedModelCost?.logoUrl ? (
              <img
                src={selectedModelCost.logoUrl}
                alt={selectedModelData?.provider}
                className="w-7 h-7 rounded-lg shadow-md group-hover:shadow-lg transition-shadow"
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
            )}
          </div>

          {/* Model Name and Info */}
          <div className="flex flex-col items-start min-w-0">
            <div className={`text-sm font-bold truncate max-w-full ${
              theme === 'light' ? 'text-gray-900' : 'text-white'
            }`}>
              {selectedModelData?.name || 'Select Model'}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-xs font-medium ${
                theme === 'light' ? 'text-gray-500' : 'text-white/50'
              }`}>
                {selectedModelData?.provider}
              </span>
              {selectedModelCost && (
                <>
                  <span className="text-xs text-white/20">•</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-sm ${
                    getTierBadgeColor(selectedModelCost.tier)
                  }`}>
                    {selectedModelCost.tier === 'free' ? 'FREE' : selectedModelCost.tier.toUpperCase()}
                  </span>
                  <span className="flex items-center gap-0.5 text-xs text-white/40">
                    <Zap className="w-3 h-3" />
                    {formatTokenDisplay(selectedModelCost.tokensPerMessage)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dropdown Arrow */}
        <ChevronDown className={`w-5 h-5 transition-all flex-shrink-0 ${
          isOpen ? 'rotate-180 text-cyan-400' : ''
        } ${theme === 'light' ? 'text-gray-400 group-hover:text-blue-500' : 'text-white/40 group-hover:text-cyan-400'}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-2xl border z-50 animate-fade-in ${
          theme === 'light'
            ? 'bg-white/95 border-gray-200'
            : 'bg-slate-900/98 border-white/20'
        } backdrop-blur-2xl`}>
          {/* Search Bar */}
          <div className="sticky top-0 z-20 p-3 border-b backdrop-blur-xl" style={{
            borderColor: theme === 'light' ? 'rgb(229, 231, 235)' : 'rgba(255, 255, 255, 0.1)'
          }}>
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                theme === 'light' ? 'text-gray-400' : 'text-white/40'
              }`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models..."
                className={`w-full pl-10 pr-10 py-2 rounded-lg text-sm transition-colors focus:outline-none ${
                  theme === 'light'
                    ? 'bg-gray-50 text-gray-900 placeholder-gray-400 focus:bg-gray-100'
                    : 'bg-white/5 text-white placeholder-white/40 focus:bg-white/10'
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 transition-colors ${
                    theme === 'light' ? 'text-gray-400 hover:text-gray-600' : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Models List */}
          <div className="max-h-80 overflow-y-auto">
            {modelGroups.length === 0 ? (
              <div className="p-8 text-center">
                <Search className={`w-12 h-12 mx-auto mb-3 ${theme === 'light' ? 'text-gray-300' : 'text-white/20'}`} />
                <p className={`text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                  No models found
                </p>
                <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-white/40'}`}>
                  Try a different search term
                </p>
              </div>
            ) : (
              modelGroups.map((group) => (
            <div key={group.provider} className="py-2">
              {/* Provider Header */}
              <div className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider sticky top-0 backdrop-blur-xl z-10 ${
                theme === 'light' ? 'text-gray-600 bg-gray-50/90' : 'text-white/50 bg-slate-800/90'
              }`}>
                {group.provider}
              </div>

              {/* Models */}
              {group.models.map((model) => {
                const modelCost = getModelCost(model.id);
                const isLocked = isModelLocked(model);
                const isSelected = selectedModel === model.id;

                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      if (!isLocked) {
                        onModelChange(model.id);
                        setIsOpen(false);
                      }
                    }}
                    disabled={isLocked}
                    className={`w-full px-4 py-2.5 flex items-center justify-between transition-all ${
                      isLocked
                        ? 'opacity-50 cursor-not-allowed'
                        : isSelected
                          ? theme === 'light'
                            ? 'bg-blue-50'
                            : 'bg-cyan-500/20'
                          : theme === 'light'
                            ? 'hover:bg-gray-50'
                            : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {/* Model Info */}
                      <div className="flex-1 text-left">
                        <div className={`text-sm font-medium flex items-center gap-2 ${
                          isSelected
                            ? theme === 'light' ? 'text-blue-600' : 'text-cyan-400'
                            : theme === 'light' ? 'text-gray-900' : 'text-white'
                        }`}>
                          {model.name}
                          {isLocked && <Lock className="w-3 h-3 text-yellow-500" />}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            getTierBadgeColor(modelCost.tier)
                          }`}>
                            {modelCost.tier === 'free' ? 'FREE' : modelCost.tier.toUpperCase()}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-white/60">
                            <Zap className="w-3 h-3" />
                            {formatTokenDisplay(modelCost.tokensPerMessage)}
                          </span>
                        </div>
                      </div>

                      {/* Selected Check */}
                      {isSelected && !isLocked && (
                        <Check className={`w-5 h-5 ${
                          theme === 'light' ? 'text-blue-600' : 'text-cyan-400'
                        }`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
