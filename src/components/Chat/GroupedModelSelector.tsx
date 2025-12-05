import React, { useState, useEffect, useMemo } from 'react';
import { Check, ChevronDown, Lock, RefreshCw, Search, X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { getUserAccessInfo } from '../../lib/modelAccessControl';
import { getModelCost, getTierBadgeColor } from '../../lib/modelTokenPricing';
import { AI_MODELS, AIModel } from '../../lib/aiModels';

interface GroupedModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  category?: 'chat' | 'code' | 'image' | 'video' | 'audio';
}

interface ModelGroup {
  provider: string;
  models: AIModel[];
  icon: string;
}

export const GroupedModelSelector: React.FC<GroupedModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  category = 'chat'
}) => {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [userType, setUserType] = useState<'free' | 'paid'>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const checkAccess = async () => {
      if (!currentUser) {
        setIsPremium(false);
        setUserType('free');
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
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
        console.error('Error getting user access info:', error);
        setIsPremium(false);
        setUserType('free');
      } finally {
        setIsLoading(false);
      }
    };
    checkAccess();
  }, [currentUser]);

  // Group models by provider with search filtering
  const modelGroups: ModelGroup[] = useMemo(() => {
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

    const providerIcons: Record<string, string> = {
      'OpenAI': '🤖',
      'Anthropic': '🔮',
      'Google': '🌟',
      'X.AI': '⚡',
      'DeepSeek': '🧠',
      'Meta': '🦙',
      'NVIDIA': '🚀',
      'Qwen': '👁️',
      'Moonshot': '🌙',
      'MoonshotAI': '🌙',
      'Amazon': '📦',
      'Perplexity': '🔍',
      'LiquidAI': '💧',
      'IBM': '🪨',
      'Baidu': '🧩',
      'Z.AI': '⚙️',
      'Stability AI': '🎨',
      'Adobe': '🔥',
      'ElevenLabs': '🎙️'
    };

    return Array.from(grouped.entries())
      .map(([provider, models]) => ({
        provider,
        models: models.sort((a, b) => {
          const aCost = getModelCost(a.id);
          const bCost = getModelCost(b.id);
          const tierOrder = { 'free': 0, 'budget': 1, 'mid': 2, 'premium': 3, 'ultra-premium': 4 };
          return tierOrder[aCost.tier] - tierOrder[bCost.tier];
        }),
        icon: providerIcons[provider] || '🤖'
      }))
      .sort((a, b) => a.provider.localeCompare(b.provider));
  }, [category, searchQuery]);

  const isModelLocked = (model: AIModel): boolean => {
    if (isPremium || userType === 'paid') {
      return false;
    }
    return model.tier !== 'FREE';
  };

  const selectedModelData = AI_MODELS.find(m => m.id === selectedModel);

  return (
    <div className="w-full space-y-3">
      {/* Current Selection Display */}
      <div className={`rounded-xl p-4 ${
        theme === 'light'
          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'
          : 'bg-gradient-to-r from-cyan-500/10 to-purple-600/10 border border-cyan-400/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedModelData && getModelCost(selectedModelData.id).logoUrl ? (
              <img
                src={getModelCost(selectedModelData.id).logoUrl}
                alt={selectedModelData.provider}
                className="w-8 h-8 rounded"
              />
            ) : (
              <span className="text-2xl">{selectedModelData ? getModelCost(selectedModelData.id).icon : '🤖'}</span>
            )}
            <div>
              <div className={`text-sm font-semibold ${
                theme === 'light' ? 'text-gray-900' : 'text-white'
              }`}>
                {selectedModelData?.name || 'Select a model'}
              </div>
              <div className={`text-xs ${
                theme === 'light' ? 'text-gray-600' : 'text-white/60'
              }`}>
                {selectedModelData?.provider} • {selectedModelData?.description}
              </div>
            </div>
          </div>
          {selectedModelData && (
            <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${
              getTierBadgeColor(getModelCost(selectedModelData.id).tier)
            }`}>
              {getModelCost(selectedModelData.id).tier === 'free' ? 'FREE' : getModelCost(selectedModelData.id).tier.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className={`rounded-xl p-3 border ${
        theme === 'light'
          ? 'bg-white border-gray-200'
          : 'bg-slate-900/50 border-white/10'
      }`}>
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
            theme === 'light' ? 'text-gray-400' : 'text-white/40'
          }`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search models by name, provider, or tier..."
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

      {/* Model Groups */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="p-8 flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-2" />
            <p className={theme === 'light' ? 'text-gray-600' : 'text-white/60'}>
              Loading models...
            </p>
          </div>
        ) : modelGroups.length === 0 ? (
          <div className={`p-8 flex flex-col items-center justify-center rounded-xl border ${
            theme === 'light' ? 'bg-white border-gray-200' : 'bg-slate-900/50 border-white/10'
          }`}>
            <Search className={`w-12 h-12 mb-3 ${theme === 'light' ? 'text-gray-300' : 'text-white/20'}`} />
            <p className={`text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
              No models found
            </p>
            <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-white/40'}`}>
              Try a different search term
            </p>
          </div>
        ) : (
          modelGroups.map((group) => (
            <div
              key={group.provider}
              className={`rounded-xl overflow-hidden border transition-all ${
                theme === 'light'
                  ? 'bg-white border-gray-200'
                  : 'bg-slate-900/50 border-white/10'
              }`}
            >
              {/* Provider Header */}
              <button
                onClick={() => setExpandedProvider(
                  expandedProvider === group.provider ? null : group.provider
                )}
                className={`w-full flex items-center justify-between p-4 transition-all ${
                  theme === 'light'
                    ? 'hover:bg-gray-50'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{group.icon}</span>
                  <div className="text-left">
                    <div className={`text-sm font-bold ${
                      theme === 'light' ? 'text-gray-900' : 'text-white'
                    }`}>
                      {group.provider} Models
                    </div>
                    <div className={`text-xs ${
                      theme === 'light' ? 'text-gray-500' : 'text-white/50'
                    }`}>
                      {group.models.length} model{group.models.length !== 1 ? 's' : ''} available
                    </div>
                  </div>
                </div>
                <ChevronDown className={`w-5 h-5 transition-transform ${
                  expandedProvider === group.provider ? 'rotate-180' : ''
                } ${theme === 'light' ? 'text-gray-600' : 'text-cyan-400'}`} />
              </button>

              {/* Models List */}
              {expandedProvider === group.provider && (
                <div className={`border-t ${
                  theme === 'light' ? 'border-gray-200' : 'border-white/10'
                }`}>
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
                          }
                        }}
                        disabled={isLocked}
                        className={`w-full flex items-center justify-between p-4 transition-all ${
                          isLocked
                            ? 'opacity-50 cursor-not-allowed'
                            : isSelected
                              ? theme === 'light'
                                ? 'bg-blue-50'
                                : 'bg-cyan-500/20'
                              : theme === 'light'
                                ? 'hover:bg-gray-50'
                                : 'hover:bg-white/5'
                        } ${
                          theme === 'light' ? 'border-b border-gray-100' : 'border-b border-white/5'
                        } last:border-b-0`}
                      >
                        <div className="flex-1 text-left">
                          <div className={`text-sm font-semibold flex items-center gap-2 ${
                            isSelected
                              ? theme === 'light' ? 'text-blue-600' : 'text-cyan-400'
                              : theme === 'light' ? 'text-gray-900' : 'text-white'
                          }`}>
                            {model.name}
                            {isLocked && <Lock className="w-3 h-3 text-yellow-500" />}
                          </div>
                          <div className={`text-xs mt-0.5 ${
                            theme === 'light' ? 'text-gray-600' : 'text-white/50'
                          }`}>
                            {model.description}
                            {isLocked && ' • Purchase tokens to unlock'}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                              getTierBadgeColor(modelCost.tier)
                            }`}>
                              {modelCost.tier === 'free' ? 'FREE' : modelCost.tier.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        {isSelected && !isLocked && (
                          <Check className={`w-5 h-5 ml-3 ${
                            theme === 'light' ? 'text-blue-600' : 'text-cyan-400'
                          }`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
