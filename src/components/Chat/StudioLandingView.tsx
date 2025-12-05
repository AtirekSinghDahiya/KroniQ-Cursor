import React, { useState } from 'react';
import { Sparkles, Image, Video, Music, Code, Mic, MessageSquare, Zap, FileCode, Presentation, ChevronDown, ChevronRight, Send, FileText } from 'lucide-react';
import { AI_MODELS } from '../../lib/aiModels';
import { GenerationLimitsDisplay } from '../Common/GenerationLimitsDisplay';

interface StudioLandingViewProps {
  onSelectMode: (mode: string, modelId?: string, initialPrompt?: string) => void;
}

type Tab = 'featured' | 'chat' | 'images' | 'video' | 'audio' | 'code';

interface ModelCard {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: string;
  badge?: string;
}

interface ModelGroup {
  provider: string;
  models: ModelCard[];
}

export const StudioLandingView: React.FC<StudioLandingViewProps> = ({ onSelectMode }) => {
  const [activeTab, setActiveTab] = useState<Tab>('featured');
  const [expandedProviders, setExpandedProviders] = useState<string[]>(['OpenAI', 'Anthropic', 'Google']);
  const [inputValue, setInputValue] = useState('');

  const toggleProvider = (provider: string) => {
    setExpandedProviders(prev =>
      prev.includes(provider)
        ? prev.filter(p => p !== provider)
        : [...prev, provider]
    );
  };

  const handleInputSubmit = () => {
    if (inputValue.trim()) {
      // Start a new chat with the input message
      onSelectMode('chat', 'gpt-4o', inputValue.trim());
      setInputValue(''); // Clear input after submit
    }
  };

  // Grouped chat models by provider - dynamically built from AI_MODELS
  const chatModelsFromLib = AI_MODELS.filter(m => m.category === 'chat' || m.category === 'code');

  // Group models by provider
  const providerMap = new Map<string, ModelCard[]>();
  chatModelsFromLib.forEach(model => {
    if (!providerMap.has(model.provider)) {
      providerMap.set(model.provider, []);
    }
    providerMap.get(model.provider)!.push({
      id: model.id,
      name: model.name,
      description: model.description,
      icon: model.category === 'code' ? Code : MessageSquare,
      category: model.category,
      badge: model.provider
    });
  });

  const chatModelGroups: ModelGroup[] = Array.from(providerMap.entries()).map(([provider, models]) => ({
    provider,
    models
  }));

  const tabs = [
    { id: 'featured' as Tab, label: 'Featured', icon: Sparkles },
    { id: 'chat' as Tab, label: 'Chat', icon: MessageSquare },
    { id: 'images' as Tab, label: 'Images', icon: Image },
    { id: 'video' as Tab, label: 'Video', icon: Video },
    { id: 'audio' as Tab, label: 'Audio', icon: Music },
    { id: 'code' as Tab, label: 'Code & PPT', icon: Code },
  ];

  const modelCards: Record<Tab, ModelCard[]> = {
    featured: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        description: 'Most capable GPT-4 model with vision, optimized for chat and complex tasks',
        icon: Zap,
        category: 'chat',
        badge: 'Recommended'
      },
      {
        id: 'claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        description: 'Latest Anthropic model with superior reasoning and coding capabilities',
        icon: Code,
        category: 'chat',
        badge: 'New'
      },
      {
        id: 'prime-intellect/intellect-3',
        name: 'INTELLECT-3',
        description: 'Advanced reasoning model with extended thinking capabilities',
        icon: Zap,
        category: 'chat',
        badge: 'Reasoning'
      },
      {
        id: 'flux-pro',
        name: 'Flux Pro',
        description: 'High-quality image generation via Kie AI',
        icon: Image,
        category: 'image',
        badge: 'Image'
      },
      {
        id: 'flux-dev',
        name: 'Flux Dev',
        description: 'Fast image generation via Kie AI',
        icon: Image,
        category: 'image',
        badge: 'Image'
      },
      {
        id: 'veo3_fast',
        name: 'Veo 3.1 Fast',
        description: 'Google Veo 3.1 fast video generation',
        icon: Video,
        category: 'video',
        badge: 'Video'
      },
      {
        id: 'veo-3',
        name: 'Veo 3',
        description: 'Google fast video generation model',
        icon: Video,
        category: 'video',
        badge: 'Video'
      },
      {
        id: 'suno',
        name: 'Suno AI',
        description: 'Generate complete songs with vocals and instruments',
        icon: Music,
        category: 'audio',
        badge: 'Audio'
      },
      {
        id: 'elevenlabs',
        name: 'Text to Speech',
        description: 'Professional voice synthesis with 10 voice options',
        icon: Mic,
        category: 'audio',
        badge: 'Voice'
      },
      {
        id: 'ppt-generator',
        name: 'PPT Generator',
        description: 'Create professional presentations with AI',
        icon: Presentation,
        category: 'code',
        badge: 'PPT'
      },
    ],
    chat: [],
    images: [
      {
        id: 'flux-pro',
        name: 'Flux Pro',
        description: 'High-quality image generation via Kie AI',
        icon: Image,
        category: 'image',
        badge: 'Premium'
      },
      {
        id: 'flux-dev',
        name: 'Flux Dev',
        description: 'Fast image generation via Kie AI',
        icon: Image,
        category: 'image',
        badge: 'Fast'
      },
      {
        id: 'sdxl',
        name: 'Stable Diffusion XL',
        description: 'Open-source image generation via Kie AI',
        icon: Image,
        category: 'image',
        badge: 'Pro'
      },
    ],
    video: [
      {
        id: 'veo3_fast',
        name: 'Veo 3.1 Fast',
        description: 'Google Veo 3.1 fast generation via Kie AI',
        icon: Video,
        category: 'video',
        badge: 'Fast'
      },
      {
        id: 'runway-gen3',
        name: 'Runway Gen-3',
        description: 'Professional video generation via Kie AI',
        icon: Video,
        category: 'video',
        badge: 'Premium'
      },
    ],
    audio: [
      {
        id: 'suno',
        name: 'Suno AI Music',
        description: 'Generate complete songs with vocals and instruments',
        icon: Music,
        category: 'audio',
        badge: 'Music'
      },
      {
        id: 'elevenlabs',
        name: 'Text to Speech',
        description: 'Professional voice synthesis with 10 voice options',
        icon: Mic,
        category: 'audio',
        badge: 'Voice'
      },
    ],
    code: [
      {
        id: 'ppt-generator',
        name: 'PPT Generator',
        description: 'Create professional presentations with AI',
        icon: Presentation,
        category: 'code',
        badge: 'PPT'
      },
    ]
  };

  const handleCardClick = (card: ModelCard) => {
    console.log('🎯 Card clicked:', card.name, 'ID:', card.id, 'Category:', card.category);

    // Handle specific card routing
    let mode = card.category;

    // Route ElevenLabs to voice studio
    if (card.id === 'elevenlabs') {
      mode = 'voice';
    }
    // Route Suno to music studio
    else if (card.id === 'suno') {
      mode = 'music';
    }
    // Map other categories
    else {
      const categoryToMode: Record<string, string> = {
        'chat': 'chat',
        'image': 'image',
        'video': 'video',
        'audio': 'music',
        'code': 'code',
      };
      mode = categoryToMode[card.category] || card.category;
    }

    console.log('🔄 Mapped mode:', mode);

    // For chat mode, pass the selected model ID
    if (card.category === 'chat') {
      console.log('💬 Activating chat mode with model:', card.id);
      onSelectMode(mode, card.id);
    } else {
      // For other modes (image, video, audio, code), just pass the mode
      console.log('🎨 Activating studio mode:', mode);
      onSelectMode(mode, card.id);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Fixed Header with Logo */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src="/Black_Blue_White_Modern_Simple_Minimal_Gradient_Circle__Neon_Technology__AI_Logo__1_-removebg-preview copy.png"
            alt="KroniQ"
            className="h-10 w-10 object-contain"
          />
          <span className="text-white text-xl font-medium">KroniQ AI</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="text-center pt-8 pb-4">
          <h1 className="text-5xl font-normal text-white mb-4">
            KroniQ AI Studio
          </h1>
          <p className="text-gray-400 text-lg mb-6">
            Create anything with AI
          </p>
          <div className="flex justify-center">
            <GenerationLimitsDisplay />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-1 px-4 pb-6 border-b border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          {/* Show grouped models for Chat tab */}
          {activeTab === 'chat' ? (
            <div className="space-y-4">
              {chatModelGroups.map((group) => (
                <div key={group.provider} className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
                  {/* Provider Header - Clickable */}
                  <button
                    onClick={() => toggleProvider(group.provider)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
                  >
                    <h3 className="text-base font-semibold text-white">
                      {group.provider}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-white/50">{group.models.length} models</span>
                      {expandedProviders.includes(group.provider) ? (
                        <ChevronDown className="w-5 h-5 text-white/50" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-white/50" />
                      )}
                    </div>
                  </button>

                  {/* Models Grid - Collapsible */}
                  {expandedProviders.includes(group.provider) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border-t border-white/10">
                      {group.models.map((card) => {
                        const Icon = card.icon;
                        return (
                          <button
                            key={card.id}
                            onClick={() => handleCardClick(card)}
                            className="group relative flex items-start gap-3 p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-left"
                          >
                            {/* Icon */}
                            <div className="flex-shrink-0 p-2 rounded-lg bg-white/10 group-hover:bg-white/15 transition-colors">
                              <Icon className="w-5 h-5 text-white" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-medium text-white group-hover:text-white transition-colors">
                                  {card.name}
                                </h3>
                                {card.badge && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                                    {card.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                                {card.description}
                              </p>
                            </div>

                            {/* Arrow */}
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Regular grid for other tabs */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modelCards[activeTab].map((card) => {
                const Icon = card.icon;
                return (
                  <button
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    className="group relative flex items-start gap-4 p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-left"
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 p-3 rounded-lg bg-white/10 group-hover:bg-white/15 transition-colors">
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-medium text-white group-hover:text-white transition-colors">
                          {card.name}
                        </h3>
                        {card.badge && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                            {card.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Input */}
      <div className="border-t border-white/10 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleInputSubmit();
                }
              }}
              placeholder="Ask KroniQ anything..."
              className="w-full px-6 py-4 pr-14 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:bg-white/10 transition-all"
            />
            <button
              onClick={handleInputSubmit}
              disabled={!inputValue.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
