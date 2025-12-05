import React, { useState, useEffect } from 'react';
import {
  X, Video as VideoIcon, Loader, Download, Play, Sparkles,
  Settings, ChevronDown, Plus, Wand2
} from 'lucide-react';
import { generateVideo } from '../../../lib/videoService';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { saveVideoToProject } from '../../../lib/contentSaveService';
import { executeGeneration, getGenerationLimitMessage } from '../../../lib/unifiedGenerationService';
import { checkGenerationLimit } from '../../../lib/generationLimitsService';
import { supabase } from '../../../lib/supabase';

interface VideoStudioProps {
  onClose: () => void;
  initialPrompt?: string;
}

export const VideoStudio: React.FC<VideoStudioProps> = ({
  onClose,
  initialPrompt = ''
}) => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [tokenBalance, setTokenBalance] = useState(0);
  const [limitInfo, setLimitInfo] = useState<string>('');

  // Settings
  const [selectedModel, setSelectedModel] = useState<'veo3_fast' | 'runway-gen3'>('veo3_fast');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [duration, setDuration] = useState<8 | 24>(8);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    const limit = await checkGenerationLimit(user.uid, 'video');
    setLimitInfo(getGenerationLimitMessage('video', limit.isPaid, limit.current, limit.limit));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('error', 'Empty Prompt', 'Please enter a description for your video');
      return;
    }

    if (!user?.uid) {
      showToast('error', 'Authentication Required', 'Please log in to generate videos');
      return;
    }

    setIsGenerating(true);
    setGeneratedVideoUrl(null);

    const result = await executeGeneration({
      userId: user.uid,
      generationType: 'video',
      modelId: selectedModel,
      provider: 'kie-ai',
      onProgress: setProgress
    }, async () => {
      setProgress('Generating video with Kie AI...');

      const videoResult = await Promise.race([
        generateVideo({
          prompt,
          model: selectedModel,
          duration: duration === 8 ? 5 : 10,
          resolution: resolution === '720p' ? '1280x720' : '1920x1080'
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Video generation timeout after 10 minutes')), 600000)
        )
      ]);

      return videoResult.url;
    });

    if (result.success && result.data) {
      setGeneratedVideoUrl(result.data);

      await saveVideoToProject(user.uid, prompt, result.data, {
        model: selectedModel,
        duration,
        provider: 'kie-ai'
      });

      showToast('success', 'Video Generated!', 'Your video is ready');
      await loadData();
    } else if (result.limitReached) {
      showToast('error', 'Limit Reached', result.error || 'Generation limit exceeded');
    } else if (result.insufficientTokens) {
      showToast('error', 'Insufficient Tokens', result.error || 'Not enough tokens');
    } else {
      showToast('error', 'Generation Failed', result.error || 'Failed to generate video');
    }

    setIsGenerating(false);
    setProgress('');
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `kroniq_video_${Date.now()}.mp4`;
    link.click();
    showToast('success', 'Downloaded', 'Video saved to your device');
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar - Black & White Only */}
        <div className="relative border-b border-white/10 bg-black overflow-hidden">
          <div className="relative flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6">
            <div className="flex items-center gap-4 sm:gap-6 min-w-0">
              {/* Studio Icon */}
              <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/20">
                <VideoIcon className="w-6 h-6 text-white" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    Video Generation Studio
                  </h1>
                  <span className="hidden sm:inline-flex px-2.5 py-1 text-xs font-semibold bg-white/10 text-white border border-white/20 rounded-full">
                    AI Powered
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-white/50 truncate">{limitInfo}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
              {/* Token Balance - Black & White */}
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
                className="p-2.5 hover:bg-white/10 active:scale-95 rounded-lg transition-all"
                title="Close Studio"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Canvas - Center area with prompt at bottom */}
          <div className="flex-1 flex flex-col bg-black relative overflow-hidden">
            {/* Video Display Area */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-auto">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <Loader className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-white" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Wand2 className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-pulse" />
                  </div>
                </div>
                <div className="text-center px-4">
                  <p className="text-white/80 font-medium mb-2 text-sm sm:text-base">Generating your video...</p>
                  <p className="text-xs sm:text-sm text-white/50">{progress || 'Please wait'}</p>
                </div>
              </div>
            ) : generatedVideoUrl ? (
              <div className="max-w-5xl w-full">
                <div className="relative rounded-lg sm:rounded-xl overflow-hidden border border-white/10 shadow-2xl mb-4">
                  <video
                    src={generatedVideoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-auto"
                  />
                  <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex gap-2">
                    <button
                      onClick={() => handleDownload(generatedVideoUrl)}
                      className="p-2 bg-black/60 backdrop-blur-sm hover:bg-black/80 rounded-lg border border-white/10 transition-all"
                      title="Download"
                    >
                      <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <p className="text-sm text-white/70 line-clamp-2">{prompt}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-white/50">
                    <span>Model: {selectedModel.toUpperCase()}</span>
                    <span>•</span>
                    <span>{aspectRatio}</span>
                    <span>•</span>
                    <span>{duration}s</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center max-w-2xl px-4">
                <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto mb-6 sm:mb-8 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent animate-pulse" />
                  <Wand2 className="w-16 h-16 sm:w-20 sm:h-20 text-white/80 relative z-10" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">Create Your Video</h3>
                <p className="text-sm sm:text-base text-white/50 mb-8 max-w-lg mx-auto">
                  Describe your video in the prompt below. Be detailed for best results - include action, scene, mood, and camera movements.
                </p>
                <div className="space-y-4">
                  <div className="text-xs sm:text-sm text-white/40 font-medium mb-3">Try these examples:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      'A person dancing in a golden field at sunset',
                      'Cinematic drone shot flying through a futuristic city',
                      'Ocean waves crashing on a beach in slow motion',
                      'Time-lapse of clouds moving over mountains'
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
            )}
            </div>

            {/* Bottom Prompt Input Area */}
            <div className="border-t border-white/10 bg-black p-4 sm:p-6">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your video in detail... e.g., 'A person dancing in a golden field at sunset, camera slowly zooming out'"
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
            {/* Model Selector */}
            <div className="p-4 sm:p-6 border-b border-white/10">
              <div className="text-sm font-semibold text-white mb-3">AI Model</div>
              <div className="space-y-2">
                {[
                  { id: 'veo3_fast', name: 'Veo 3.1 Fast', desc: 'Google Veo 3.1 fast generation', badge: 'Fast' },
                  { id: 'runway-gen3', name: 'Runway Gen-3', desc: 'Professional video generation', badge: 'Premium' }
                ].map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id as any)}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      selectedModel === model.id
                        ? 'bg-white/10 border-white/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/[0.07]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white text-sm">{model.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        model.badge === 'Fast' ? 'bg-white/10 text-white' : 'bg-white/10 text-white'
                      }`}>
                        {model.badge}
                      </span>
                    </div>
                    <p className="text-xs text-white/50">{model.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio */}
            <div className="p-4 sm:p-6 border-b border-white/10">
              <div className="text-sm font-semibold text-white mb-3">Aspect Ratio</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: '16:9', label: '16:9', icon: '▭', desc: 'Landscape' },
                  { id: '9:16', label: '9:16', icon: '▯', desc: 'Portrait' }
                ].map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setAspectRatio(ratio.id as any)}
                    className={`p-3 rounded-lg border transition-all ${
                      aspectRatio === ratio.id
                        ? 'bg-white/10 border-white/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/[0.07]'
                    }`}
                  >
                    <div className="text-2xl mb-1">{ratio.icon}</div>
                    <div className="text-xs font-medium text-white">{ratio.label}</div>
                    <div className="text-xs text-white/50">{ratio.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Video Duration */}
            <div className="p-4 sm:p-6 border-b border-white/10">
              <div className="text-sm font-semibold text-white mb-3">Video Duration</div>
              <div className="grid grid-cols-2 gap-2">
                {[8, 24].map((dur) => (
                  <button
                    key={dur}
                    onClick={() => setDuration(dur as any)}
                    className={`p-3 rounded-lg border transition-all ${
                      duration === dur
                        ? 'bg-white/10 border-white/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/[0.07]'
                    }`}
                  >
                    <div className="text-sm font-medium text-white">{dur}s</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="p-4 sm:p-6 border-b border-white/10">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full flex items-center justify-between text-sm font-semibold text-white mb-3"
              >
                <span>Advanced Settings</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>

              {showAdvanced && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/50 mb-2 block">Output Resolution</label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30"
                    >
                      <option value="720p">720p</option>
                      <option value="1080p">1080p</option>
                    </select>
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
                    setGeneratedVideoUrl(null);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Generation
                </button>
                {generatedVideoUrl && (
                  <button
                    onClick={() => handleDownload(generatedVideoUrl)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download Video
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
