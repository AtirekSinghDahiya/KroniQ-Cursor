import React, { useState, useEffect } from 'react';
import {
  X, Wand2, Loader, Download, Trash2, Menu, Plus,
  Image as ImageIcon, ChevronDown, Settings, Sparkles,
  History, Grid, Maximize2, Copy, Share2
} from 'lucide-react';
import { generateImage } from '../../../lib/imageService';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { saveImageToProject } from '../../../lib/contentSaveService';
import { executeGeneration, getGenerationLimitMessage } from '../../../lib/unifiedGenerationService';
import { checkGenerationLimit } from '../../../lib/generationLimitsService';
import { supabase } from '../../../lib/supabase';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  model: string;
  aspectRatio: string;
}

interface ImageStudioProps {
  onClose: () => void;
  initialPrompt?: string;
}

export const ImprovedImageStudio: React.FC<ImageStudioProps> = ({
  onClose,
  initialPrompt = ''
}) => {
  const { showToast } = useToast();
  const { user } = useAuth();

  // State
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([]);
  const [progress, setProgress] = useState('');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [limitInfo, setLimitInfo] = useState<string>('');

  // Settings
  const [selectedModel, setSelectedModel] = useState('nano-banana');
  const [aspectRatio, setAspectRatio] = useState<'square' | 'landscape' | 'portrait' | '4:3' | '3:4'>('square');
  const [temperature, setTemperature] = useState(1.0);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.uid) return;

    // Load token balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('tokens_balance')
      .eq('id', user.uid)
      .maybeSingle();

    if (profile) {
      setTokenBalance(profile.tokens_balance || 0);
    }

    // Load generation limit info
    const limit = await checkGenerationLimit(user.uid, 'image');
    setLimitInfo(getGenerationLimitMessage('image', limit.isPaid, limit.current, limit.limit));

    // Load image history from localStorage for now
    const stored = localStorage.getItem(`image_history_${user.uid}`);
    if (stored) {
      setImageHistory(JSON.parse(stored));
    }
  };

  const saveToHistory = (imageUrl: string, generatedPrompt: string) => {
    const newImage: GeneratedImage = {
      id: Date.now().toString(),
      url: imageUrl,
      prompt: generatedPrompt,
      timestamp: Date.now(),
      model: selectedModel,
      aspectRatio
    };

    const updated = [newImage, ...imageHistory].slice(0, 50); // Keep last 50
    setImageHistory(updated);

    if (user?.uid) {
      localStorage.setItem(`image_history_${user.uid}`, JSON.stringify(updated));
    }
  };

  const deleteFromHistory = (id: string) => {
    const updated = imageHistory.filter(img => img.id !== id);
    setImageHistory(updated);

    if (user?.uid) {
      localStorage.setItem(`image_history_${user.uid}`, JSON.stringify(updated));
    }

    showToast('success', 'Deleted', 'Image removed from history');
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('error', 'Empty Prompt', 'Please enter a description for your image');
      return;
    }

    if (!user?.uid) {
      showToast('error', 'Authentication Required', 'Please log in to generate images');
      return;
    }

    setIsGenerating(true);
    setCurrentImage(null);
    setProgress('Initializing...');

    const result = await executeGeneration({
      userId: user.uid,
      generationType: 'image',
      modelId: selectedModel,
      provider: 'kie-ai',
      onProgress: setProgress
    }, async () => {
      setProgress('Generating image with Kie AI...');

      const imageResult = await Promise.race([
        generateImage({
          prompt,
          model: selectedModel
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Image generation timeout after 5 minutes')), 300000)
        )
      ]);

      return imageResult.url;
    });

    if (result.success && result.data) {
      setCurrentImage(result.data);
      saveToHistory(result.data, prompt);

      await saveImageToProject(user.uid, prompt, result.data, {
        model: selectedModel,
        dimensions: aspectRatio,
        provider: 'kie-ai'
      });

      showToast('success', 'Image Generated!', 'Your image is ready');
      await loadData();
    } else if (result.limitReached) {
      showToast('error', 'Limit Reached', result.error || 'Generation limit exceeded');
    } else if (result.insufficientTokens) {
      showToast('error', 'Insufficient Tokens', result.error || 'Not enough tokens');
    } else {
      showToast('error', 'Generation Failed', result.error || 'Failed to generate image');
    }

    setIsGenerating(false);
    setProgress('');
  };

  const handleDownload = (url: string, filename?: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `kroniq_image_${Date.now()}.jpg`;
    link.click();
    showToast('success', 'Downloaded', 'Image saved to your device');
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('success', 'Copied', 'Prompt copied to clipboard');
  };

  const models = [
    {
      id: 'flux-kontext',
      name: 'Flux Kontext',
      description: 'In-context editing via Kie AI',
      speed: 'Fast',
      quality: 'Premium'
    },
    {
      id: 'flux-1.1-pro',
      name: 'FLUX 1.1 Pro',
      description: 'Latest Black Forest Labs model',
      speed: 'Fast',
      quality: 'Premium'
    },
    {
      id: 'flux-schnell',
      name: 'FLUX Schnell',
      description: 'Ultra-fast generation',
      speed: 'Ultra Fast',
      quality: 'High'
    }
  ];

  const aspectRatios = [
    { id: 'square' as const, label: 'Square', ratio: '1:1', dimensions: '1024×1024' },
    { id: 'landscape' as const, label: 'Landscape', ratio: '16:9', dimensions: '1792×1024' },
    { id: 'portrait' as const, label: 'Portrait', ratio: '9:16', dimensions: '1024×1792' },
    { id: '4:3' as const, label: 'Standard', ratio: '4:3', dimensions: '1408×1024' },
    { id: '3:4' as const, label: 'Vertical', ratio: '3:4', dimensions: '1024×1408' }
  ];

  return (
    <div className="h-screen flex bg-black text-white">
      {/* Left Sidebar - History */}
      <div className={`${showSidebar ? 'w-72' : 'w-0'} border-r border-white/10 flex-shrink-0 transition-all duration-300 overflow-hidden`}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#00FFF0]" />
                <h2 className="font-semibold">KroniQ AI</h2>
              </div>
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden p-1 hover:bg-white/5 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* New Generation Button */}
            <button
              onClick={() => {
                setPrompt('');
                setCurrentImage(null);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00FFF0] hover:bg-[#00FFF0]/90 text-black rounded-lg font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              New Generation
            </button>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-white/40" />
                <span className="text-sm font-medium text-white/60">Recent Generations</span>
              </div>

              {imageHistory.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-sm">
                  <Grid className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No images yet
                </div>
              ) : (
                <div className="space-y-2">
                  {imageHistory.map((img) => (
                    <div
                      key={img.id}
                      className="group relative rounded-lg overflow-hidden border border-white/10 hover:border-[#00FFF0]/30 transition-all cursor-pointer"
                      onClick={() => {
                        setCurrentImage(img.url);
                        setPrompt(img.prompt);
                      }}
                    >
                      <img
                        src={img.url}
                        alt={img.prompt}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-xs text-white/90 line-clamp-2 mb-2">
                            {img.prompt}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/60">
                              {new Date(img.timestamp).toLocaleDateString()}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFromHistory(img.id);
                              }}
                              className="p-1 hover:bg-red-500/20 rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3 text-red-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-4">
            {!showSidebar && (
              <button
                onClick={() => setShowSidebar(true)}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-xl font-bold">Image Generation Studio</h1>
              <p className="text-sm text-white/50">{limitInfo}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Token Balance */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
              <Sparkles className="w-4 h-4 text-[#00FFF0]" />
              <span className="text-sm font-medium">{tokenBalance.toLocaleString()}</span>
              <span className="text-xs text-white/40">tokens</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas */}
          <div className="flex-1 flex items-center justify-center p-8 bg-black relative overflow-auto">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <Loader className="w-16 h-16 animate-spin text-[#00FFF0]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Wand2 className="w-8 h-8 text-[#00FFF0] animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white/80 font-medium mb-2">Generating your image...</p>
                  <p className="text-sm text-white/50">{progress || 'Please wait'}</p>
                </div>
              </div>
            ) : currentImage ? (
              <div className="max-w-5xl w-full">
                <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl mb-4">
                  <img
                    src={currentImage}
                    alt="Generated"
                    className="w-full h-auto"
                  />

                  {/* Image Actions Overlay */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => handleDownload(currentImage)}
                      className="p-2 bg-black/60 backdrop-blur-sm hover:bg-black/80 rounded-lg border border-white/10 transition-all"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = currentImage;
                        link.target = '_blank';
                        link.click();
                      }}
                      className="p-2 bg-black/60 backdrop-blur-sm hover:bg-black/80 rounded-lg border border-white/10 transition-all"
                      title="View full size"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Prompt Display */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-white/60 mb-1">Prompt</p>
                      <p className="text-white">{prompt}</p>
                    </div>
                    <button
                      onClick={() => copyPrompt(prompt)}
                      className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                      title="Copy prompt"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center max-w-md">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 border border-[#00FFF0]/30 flex items-center justify-center">
                  <Wand2 className="w-16 h-16 text-[#00FFF0]/60" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Create Something Amazing</h3>
                <p className="text-white/50 mb-6">
                  Enter a detailed description below and let KroniQ AI bring your vision to life
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {['Sunset over mountains', 'Futuristic cityscape', 'Abstract art'].map((example) => (
                    <button
                      key={example}
                      onClick={() => setPrompt(example)}
                      className="px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Settings Panel */}
          <div className="w-96 border-l border-white/10 flex flex-col bg-black overflow-y-auto">
            {/* Model Selection */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00FFF0]" />
                  <span className="text-sm font-semibold">AI Model</span>
                </div>
              </div>

              <div className="space-y-2">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    disabled={isGenerating}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedModel === model.id
                        ? 'border-[#00FFF0]/40 bg-[#00FFF0]/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium">{model.name}</span>
                      <div className="flex gap-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                          {model.speed}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          {model.quality}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-white/50">{model.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="p-6 border-b border-white/10">
              <label className="text-sm font-semibold text-white mb-3 block">Aspect Ratio</label>
              <div className="space-y-2">
                {aspectRatios.map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() => setAspectRatio(ar.id)}
                    disabled={isGenerating}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                      aspectRatio === ar.id
                        ? 'bg-[#00FFF0]/20 border-[#00FFF0]/50 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded border-2 flex items-center justify-center ${
                        aspectRatio === ar.id ? 'border-[#00FFF0]' : 'border-white/20'
                      }`}>
                        <div
                          className="bg-white/40 rounded-sm"
                          style={{
                            width: ar.id === 'square' ? '14px' : ar.id === 'landscape' ? '18px' : ar.id === 'portrait' ? '10px' : ar.id === '4:3' ? '16px' : '12px',
                            height: ar.id === 'square' ? '14px' : ar.id === 'landscape' ? '10px' : ar.id === 'portrait' ? '18px' : ar.id === '4:3' ? '12px' : '16px'
                          }}
                        />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{ar.label}</div>
                        <div className="text-xs text-white/40">{ar.ratio}</div>
                      </div>
                    </div>
                    <span className="text-xs text-white/40">{ar.dimensions}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="p-6 border-b border-white/10">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center justify-between w-full mb-4"
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-white/60" />
                  <span className="text-sm font-semibold">Advanced Settings</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
              </button>

              {showSettings && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-white/60 mb-2">
                      <span>Temperature</span>
                      <span>{temperature.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-white/40 mt-1">Controls creativity and variation</p>
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Input */}
            <div className="p-6 mt-auto">
              <label className="text-sm font-semibold text-white mb-3 block">
                Describe your image
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A serene mountain landscape at sunset, with snow-capped peaks reflecting golden light, pine trees in the foreground, and a crystal clear lake..."
                className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 focus:border-[#00FFF0]/40 rounded-lg text-white placeholder-white/30 focus:outline-none resize-none transition-colors"
                disabled={isGenerating}
              />
              <div className="flex justify-between items-center mt-2 mb-4">
                <span className="text-xs text-white/40">{prompt.length} / 1000 characters</span>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#00FFF0] hover:bg-[#00FFF0]/90 disabled:bg-white/5 text-black font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Generate Image</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
