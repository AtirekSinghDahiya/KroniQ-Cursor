import React, { useState, useEffect } from 'react';
import { Video, Download, Wand2, X, Loader, Play } from 'lucide-react';
import { generateSora2Video, isSora2Available } from '../../lib/kieSoraService';
import { generateVeo3Video, isVeo3Available } from '../../lib/kieVeo3Service';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import { saveVideoToProject } from '../../lib/contentSaveService';

interface VideoGeneratorProps {
  onClose: () => void;
  initialPrompt?: string;
  onVideoGenerated?: (video: { url: string; prompt: string; metadata?: any }) => void;
}

type VideoProvider = 'sora-2' | 'veo-3';

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onClose, initialPrompt = '', onVideoGenerated }) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [duration, setDuration] = useState<4 | 6 | 8>(8);
  const [provider, setProvider] = useState<VideoProvider>('veo-3');

  const sora2Available = isSora2Available();
  const veo3Available = isVeo3Available();

  const handleGenerateWithSora2 = async (promptToUse: string) => {
    showToast('info', 'Starting Generation', 'Creating your video with Sora 2...');

    const aspectRatioMap: Record<string, 'landscape' | 'portrait'> = {
      '16:9': 'landscape',
      '9:16': 'portrait',
      '1:1': 'landscape',
    };

    const videoUrls = await generateSora2Video(
      {
        prompt: promptToUse,
        aspect_ratio: aspectRatioMap[aspectRatio] || 'landscape',
        n_frames: '10',
        remove_watermark: true,
      },
      (status) => {
        setProgressStatus(status);
        if (status.includes('Creating')) setProgress(10);
        else if (status.includes('Processing')) {
          const match = status.match(/(\d+)\/(\d+)/);
          if (match) {
            const current = parseInt(match[1]);
            const total = parseInt(match[2]);
            setProgress(10 + (current / total) * 80);
          }
        }
      }
    );

    const videoUrl = videoUrls[0];
    setGeneratedVideoUrl(videoUrl);
    setProgress(100);
    showToast('success', 'Video Ready!', 'Your Sora 2 video has been generated successfully');

    if (user) {
      try {
        await saveVideoToProject(user.uid, promptToUse, videoUrl, {
          model: 'sora-2',
          duration: duration,
          provider: 'kie-ai'
        });
      } catch (saveError) {
        console.error('Failed to save video to project:', saveError);
      }
    }
  };

  const handleGenerateWithVeo3 = async (promptToUse: string) => {
    showToast('info', 'Starting Generation', 'Creating your video with Veo 3...');

    const videoUrl = await generateVeo3Video(
      {
        prompt: promptToUse,
        aspectRatio: aspectRatio,
        model: 'veo3_fast',
        enableFallback: true,
        enableTranslation: true,
      },
      (status) => {
        setProgressStatus(status);
        if (status.includes('Creating')) setProgress(10);
        else if (status.includes('Processing')) {
          const match = status.match(/(\d+)\/(\d+)/);
          if (match) {
            const current = parseInt(match[1]);
            const total = parseInt(match[2]);
            setProgress(10 + (current / total) * 80);
          }
        }
      }
    );

    setGeneratedVideoUrl(videoUrl);
    setProgress(100);
    showToast('success', 'Video Ready!', 'Your Veo 3 video has been generated successfully');

    if (user) {
      try {
        await saveVideoToProject(user.uid, promptToUse, videoUrl, {
          model: 'veo-3',
          duration: duration,
          provider: 'kie-ai'
        });
      } catch (saveError) {
        console.error('Failed to save video to project:', saveError);
      }
    }
  };

  const handleGenerate = async (customPrompt?: string) => {
    const promptToUse = customPrompt || prompt.trim();

    if (!promptToUse) {
      showToast('warning', 'Enter a prompt', 'Please describe the video you want to create');
      return;
    }

    if (provider === 'sora-2' && !sora2Available) {
      showToast('error', 'API Key Missing', 'Kie AI Sora 2 API key is not configured');
      return;
    }

    if (provider === 'veo-3' && !veo3Available) {
      showToast('error', 'API Key Missing', 'Kie AI Veo 3 API key is not configured');
      return;
    }

    if (isGenerating) return;

    setIsGenerating(true);
    setProgress(0);
    setProgressStatus('');
    setGeneratedVideoUrl(null);

    try {
      if (provider === 'sora-2') {
        await handleGenerateWithSora2(promptToUse);
      } else if (provider === 'veo-3') {
        await handleGenerateWithVeo3(promptToUse);
      }
    } catch (error: any) {
      console.error('Video generation error:', error);
      let errorMessage = error?.message || 'Unable to generate video. Please try again.';
      showToast('error', 'Generation Failed', errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedVideoUrl) return;
    const link = document.createElement('a');
    link.href = generatedVideoUrl;
    link.download = `kroniq-${provider}-video-${Date.now()}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Downloaded!', 'Video saved to your device');
  };

  const getProviderDescription = () => {
    if (provider === 'sora-2') return 'Powered by OpenAI Sora 2';
    return 'Powered by Google Veo 3';
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-black">
      {/* Header */}
      <div className="bg-black border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Video className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Video Generation</h2>
              <p className="text-xs text-white/50">{getProviderDescription()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Controls */}
            <div className="space-y-4">
              {/* Model Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Model</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setProvider('veo-3')}
                    disabled={isGenerating || !veo3Available}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${provider === 'veo-3'
                        ? 'bg-white/10 border border-white/20 text-white'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                  >
                    <div className="font-semibold">Veo 3</div>
                    <div className="text-xs opacity-60">Google</div>
                  </button>
                  <button
                    onClick={() => setProvider('sora-2')}
                    disabled={isGenerating || !sora2Available}
                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${provider === 'sora-2'
                        ? 'bg-white/10 border border-white/20 text-white'
                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                      }`}
                  >
                    <div className="font-semibold">Sora 2</div>
                    <div className="text-xs opacity-60">OpenAI</div>
                  </button>
                </div>
              </div>

              {/* Prompt */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your video... e.g., 'A serene mountain landscape at sunrise'"
                  className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 focus:border-white/20 rounded-lg text-white placeholder-white/30 focus:outline-none resize-none transition-all text-sm"
                  disabled={isGenerating}
                />
                <div className="text-xs text-white/30 text-right">{prompt.length} / 1000</div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Aspect Ratio</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    disabled={isGenerating}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 focus:border-white/20 rounded-lg text-white text-sm focus:outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="16:9">16:9 Landscape</option>
                    <option value="9:16">9:16 Portrait</option>
                    <option value="1:1">1:1 Square</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/70">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value) as any)}
                    disabled={isGenerating}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 focus:border-white/20 rounded-lg text-white text-sm focus:outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value={4}>4 seconds</option>
                    <option value={6}>6 seconds</option>
                    <option value={8}>8 seconds</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={() => handleGenerate()}
                disabled={isGenerating || !prompt.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-white/5 text-white font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>
                      {progressStatus || 'Generating...'} {progress > 0 && `${Math.round(progress)}%`}
                    </span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Generate Video</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: Preview */}
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg border border-white/10 overflow-hidden">
                {generatedVideoUrl ? (
                  <video src={generatedVideoUrl} controls autoPlay loop className="w-full h-full object-contain">
                    Your browser does not support the video tag.
                  </video>
                ) : isGenerating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Loader className="w-12 h-12 text-orange-400 animate-spin" />
                    <p className="text-white/60 mt-4 text-sm">{progressStatus || 'Generating...'}</p>
                    <div className="w-48 h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                      <div
                        className="h-full bg-orange-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-white/40 text-xs mt-2">{Math.round(progress)}%</p>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="p-4 rounded-full bg-white/5 mb-3">
                      <Play className="w-8 h-8 text-white/40" />
                    </div>
                    <p className="text-white/40 text-sm">Video preview</p>
                  </div>
                )}
              </div>

              {generatedVideoUrl && (
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-lg transition-all text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
