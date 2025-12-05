import React, { useState, useEffect } from 'react';
import {
  X, Wand2, Loader, Download, Trash2, Menu, Plus,
  Image as ImageIcon, ChevronDown, Settings, Sparkles,
  History, Grid, Maximize2, Copy
} from 'lucide-react';
import { generateImage } from '../../../lib/imageService';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { saveImageToProject } from '../../../lib/contentSaveService';
import { executeGeneration, getGenerationLimitMessage } from '../../../lib/unifiedGenerationService';
import { checkGenerationLimit } from '../../../lib/generationLimitsService';
import { supabase } from '../../../lib/supabase';
import { createStudioProject, updateProjectState, loadProject, generateStudioProjectName } from '../../../lib/studioProjectService';
import { StudioMessageView, type StudioMessage } from './StudioMessageView';
import { saveStudioGeneration, loadStudioMessages, formatImageMessage } from '../../../lib/studioMessagesService';

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
  projectId?: string;
}

export const ImageStudio: React.FC<ImageStudioProps> = ({
  onClose,
  initialPrompt = '',
  projectId: initialProjectId
}) => {
  const { showToast } = useToast();
  const { user } = useAuth();

  // State
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([]);
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [progress, setProgress] = useState('');
  const [showSidebar, setShowSidebar] = useState(false); // Start collapsed on mobile
  const [showSettings, setShowSettings] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [limitInfo, setLimitInfo] = useState<string>('');
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(initialProjectId || null);

  // Settings
  const [selectedModel, setSelectedModel] = useState('nano-banana');
  const [aspectRatio, setAspectRatio] = useState<'square' | 'landscape' | 'portrait' | '4:3' | '3:4'>('square');
  const [temperature, setTemperature] = useState(1.0);

  useEffect(() => {
    loadData();

    // Check screen size and show sidebar on desktop
    const handleResize = () => {
      setShowSidebar(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [user]);

  useEffect(() => {
    if (initialProjectId && user?.uid) {
      loadExistingProject(initialProjectId);
    }
  }, [initialProjectId, user]);

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

    // Load image history from localStorage
    const stored = localStorage.getItem(`image_history_${user.uid}`);
    if (stored) {
      try {
        setImageHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse image history:', e);
      }
    }
  };

  const loadExistingProject = async (projectId: string) => {
    try {
      const result = await loadProject(projectId);
      if (result.success && result.project) {
        setCurrentProjectId(projectId);

        // Load messages from database
        const projectMessages = await loadStudioMessages(projectId);
        setMessages(projectMessages as StudioMessage[]);

        // Load other state from session_state
        const state = result.project.session_state || {};
        setPrompt(state.prompt || '');
        setCurrentImage(state.currentImage || null);
        setImageHistory(state.imageHistory || []);
        setSelectedModel(state.selectedModel || 'nano-banana');
        setAspectRatio(state.aspectRatio || 'square');
        setTemperature(state.temperature || 1.0);
        console.log('✅ Loaded existing project:', projectId, 'with', projectMessages.length, 'messages');
      }
    } catch (error) {
      console.error('Error loading project:', error);
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

    const updated = [newImage, ...imageHistory].slice(0, 50);
    setImageHistory(updated);

    if (user?.uid) {
      localStorage.setItem(`image_history_${user.uid}`, JSON.stringify(updated));
    }
  };

  const saveProjectState = async () => {
    if (!user?.uid) return null;

    const sessionState = {
      prompt,
      currentImage,
      imageHistory,
      selectedModel,
      aspectRatio,
      temperature
    };

    try {
      if (currentProjectId) {
        await updateProjectState({
          projectId: currentProjectId,
          sessionState
        });
        console.log('✅ Project state updated');
        return currentProjectId;
      } else {
        const projectName = generateStudioProjectName('image', prompt);
        const result = await createStudioProject({
          userId: user.uid,
          studioType: 'image',
          name: projectName,
          description: prompt,
          model: selectedModel,
          sessionState
        });

        if (result.success && result.projectId) {
          setCurrentProjectId(result.projectId);
          console.log('✅ New project created:', result.projectId);
          showToast('success', 'Project Saved', 'Your image project has been saved');
          return result.projectId;
        }
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
    return null;
  };

  const deleteFromHistory = (id: string) => {
    const updated = imageHistory.filter(img => img.id !== id);
    setImageHistory(updated);

    if (user?.uid) {
      localStorage.setItem(`image_history_${user.uid}`, JSON.stringify(updated));
    }

    showToast('success', 'Deleted', 'Image removed from history');
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

    try {
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

      // Save or create project
      let projectId = currentProjectId;
      if (!projectId) {
        projectId = await saveProjectState();
      }

      // Save messages to database
      if (projectId) {
        const dimensions = aspectRatios.find(r => r.id === aspectRatio)?.dimensions || '1024×1024';
        const assistantMessage = formatImageMessage(result.data, selectedModel, dimensions);

        await saveStudioGeneration(projectId, prompt, assistantMessage, {
          type: 'image',
          url: result.data,
          model: selectedModel,
          dimensions: dimensions,
          aspectRatio: aspectRatio,
          provider: selectedModel === 'imagen-4' ? 'google-imagen' : 'google-gemini'
        });

        // Reload messages to show new ones
        const updatedMessages = await loadStudioMessages(projectId);
        setMessages(updatedMessages as StudioMessage[]);
      }

      await saveImageToProject(user.uid, prompt, result.data, {
        model: selectedModel,
        dimensions: aspectRatio,
        provider: selectedModel === 'imagen-4' ? 'google-imagen' : 'google-gemini'
      });

      showToast('success', 'Image Generated!', 'Your image is ready');
      await loadData();
      setPrompt(''); // Clear prompt for next generation
    } else if (result.limitReached) {
      showToast('error', 'Limit Reached', result.error || 'Generation limit exceeded');
    } else if (result.insufficientTokens) {
      showToast('error', 'Insufficient Tokens', result.error || 'Not enough tokens');
    } else {
      showToast('error', 'Generation Failed', result.error || 'Failed to generate image');
    }
    } catch (error) {
      console.error('Error generating image:', error);
      showToast('error', 'Generation Failed', error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  const handleDownload = (url: string, filename?: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `kroniq_image_${Date.now()}.jpg`;
    link.click();
    showToast('success', 'Downloaded', 'Image saved to your device');
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* History Sidebar - Hidden, using main sidebar instead */}
      <div className="hidden">
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-white" />
                <h2 className="font-semibold">KroniQ AI</h2>
              </div>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1 hover:bg-white/5 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => {
                setPrompt('');
                setCurrentImage(null);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-white/90 text-black rounded-lg font-medium transition-all"
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
                      className="group relative rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                      onClick={() => {
                        setCurrentImage(img.url);
                        setPrompt(img.prompt);
                        if (window.innerWidth < 1024) setShowSidebar(false);
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
        {/* Top Bar - Enhanced */}
        <div className="relative border-b border-white/10 bg-gradient-to-r from-black via-black to-black overflow-hidden">
          {/* Subtle gradient overlay */}
          {/* Black & White Only - No colored overlays */}

          <div className="relative flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6">
            <div className="flex items-center gap-4 sm:gap-6 min-w-0">
              {/* Studio Icon */}
              <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/20">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    Image Generation Studio
                  </h1>
                  <span className="hidden sm:inline-flex px-2.5 py-1 text-xs font-semibold bg-white/10 text-white border border-white/20 rounded-full">
                    AI Powered
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/50 truncate">{limitInfo}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              {/* Token Balance - Enhanced */}
              <div className="hidden sm:flex items-center gap-2.5 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-white/50 leading-none mb-1">Balance</span>
                  <span className="text-sm font-bold text-white leading-none">{tokenBalance.toLocaleString()}</span>
                </div>
              </div>

              {/* Mobile token display */}
              <div className="sm:hidden flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-sm font-medium">{tokenBalance > 999 ? `${Math.floor(tokenBalance/1000)}k` : tokenBalance}</span>
              </div>

              <button
                onClick={onClose}
                className="p-2.5 hover:bg-white/10 active:scale-95 rounded-lg transition-all group"
                title="Close Studio"
              >
                <X className="w-5 h-5 group-hover:text-red-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Canvas - Center area with prompt at bottom */}
          <div className="flex-1 flex flex-col bg-black relative overflow-hidden">
            {/* Messages Display Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
            {isGenerating ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <Loader className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-white" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Wand2 className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-pulse" />
                    </div>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-white/80 font-medium mb-2 text-sm sm:text-base">Generating your image...</p>
                    <p className="text-xs sm:text-sm text-white/50">{progress || 'Please wait'}</p>
                  </div>
                </div>
              </div>
            ) : messages.length > 0 ? (
              <StudioMessageView
                messages={messages}
                onDownload={handleDownload}
                onCopy={(text) => {
                  navigator.clipboard.writeText(text);
                  showToast('success', 'Copied', 'Text copied to clipboard');
                }}
                renderMedia={(message) => {
                  if (message.payload?.type === 'image' && message.payload?.url) {
                    return (
                      <div className="relative rounded-lg overflow-hidden border border-white/10 max-w-2xl">
                        <img
                          src={message.payload.url}
                          alt="Generated image"
                          className="w-full h-auto"
                        />
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const link = document.createElement('a');
                              link.href = message.payload.url;
                              link.target = '_blank';
                              link.click();
                            }}
                            className="p-2 bg-black/60 backdrop-blur-sm hover:bg-black/80 rounded-lg border border-white/10 transition-all"
                            title="View full size"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center max-w-2xl px-4">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-6 sm:mb-8 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent animate-pulse" />
                    <Wand2 className="w-16 h-16 sm:w-20 sm:h-20 text-white/80 relative z-10" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">Create Your Vision</h3>
                  <p className="text-sm sm:text-base text-white/50 mb-8 max-w-lg mx-auto">
                    Describe your image in the prompt below. Be detailed for best results - include style, mood, lighting, and subject details.
                  </p>
                  <div className="space-y-4">
                    <div className="text-xs sm:text-sm text-white/40 font-medium mb-3">Try these examples:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        'A serene mountain landscape at sunset with golden light',
                        'Futuristic cityscape with neon lights and flying cars',
                        'Abstract geometric art with monochrome gradients',
                        'Professional portrait in natural lighting'
                      ].map((example) => (
                        <button
                          key={example}
                          onClick={() => setPrompt(example)}
                          className="px-4 py-3 text-xs sm:text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-all text-left"
                        >
                          <span className="text-white mr-2">→</span>
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>

            {/* Bottom Prompt Input Area */}
            <div className="border-t border-white/10 bg-black p-4 sm:p-6 lg:p-8">
              <div className="max-w-5xl mx-auto">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your image in detail... e.g., 'A serene mountain landscape at sunset with snow-capped peaks'"
                      className="w-full h-20 sm:h-16 px-4 py-3 bg-white/5 border border-white/10 focus:border-white/30 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none resize-none transition-colors"
                      disabled={isGenerating}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleGenerate();
                        }
                      }}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-white/40">{prompt.length} / 1000 characters</span>
                      <span className="text-xs text-white/40">Ctrl+Enter to generate</span>
                    </div>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="flex-shrink-0 flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-white/90 disabled:bg-white/5 text-black font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed h-20 sm:h-16"
                  >
                    {isGenerating ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span className="hidden sm:inline">Generating...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        <span className="hidden sm:inline">Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Settings Panel - Compact */}
          <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col bg-black overflow-y-auto max-h-[50vh] lg:max-h-none">
            {/* Model Selection */}
            <div className="p-4 sm:p-6 border-b border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-sm font-semibold">AI Model</span>
              </div>
              <div className="space-y-2">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    disabled={isGenerating}
                    className={`w-full text-left p-3 sm:p-4 rounded-lg border transition-all ${
                      selectedModel === model.id
                        ? 'border-white/30 bg-white/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-sm sm:text-base">{model.name}</span>
                      <div className="flex gap-1 flex-shrink-0">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/20">
                          {model.speed}
                        </span>
                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white border border-white/20">
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
            <div className="p-4 sm:p-6 border-b border-white/10">
              <label className="text-sm font-semibold text-white mb-3 block">Aspect Ratio</label>
              <div className="space-y-2">
                {aspectRatios.map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() => setAspectRatio(ar.id)}
                    disabled={isGenerating}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                      aspectRatio === ar.id
                        ? 'bg-white/20 border-white/30 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded border-2 flex items-center justify-center ${
                        aspectRatio === ar.id ? 'border-white/30' : 'border-white/20'
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
            <div className="p-4 sm:p-6 border-b border-white/10">
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
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                    <p className="text-xs text-white/40 mt-1">Controls creativity and variation</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="p-4 sm:p-6 border-t border-white/10">
              <div className="text-sm font-semibold text-white mb-3">Quick Actions</div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setPrompt('');
                    setCurrentImage(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Generation
                </button>
                {currentImage && (
                  <>
                    <button
                      onClick={() => handleDownload(currentImage)}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download Image
                    </button>
                    <button
                      onClick={() => copyPrompt(prompt)}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      Copy Prompt
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
