import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Image as ImageIcon, Video as VideoIcon, Music as MusicIcon, Mic, Palette, Code, Film, X } from 'lucide-react';
import { MainChat } from './MainChat';
import { ImageControls } from './Controls/ImageControls';
import { VideoControls } from './Controls/VideoControls';
import { MusicControls } from './Controls/MusicControls';
import { VoiceControls } from './Controls/VoiceControls';
import { GroupedModelSelector } from './GroupedModelSelector';
import { useAuth } from '../../hooks/useAuth';
import { getUnifiedPremiumStatus, UnifiedPremiumStatus } from '../../lib/unifiedPremiumAccess';
import { useStudioMode } from '../../contexts/StudioModeContext';

export type StudioMode = 'chat' | 'image' | 'video' | 'music' | 'voice';

interface UnifiedStudioChatProps {
  projectId?: string | null;
  projectName?: string;
  onProjectNameChange?: (name: string) => void;
}

export const UnifiedStudioChat: React.FC<UnifiedStudioChatProps> = ({
  projectId,
  projectName: initialProjectName,
  onProjectNameChange,
}) => {
  const { user } = useAuth();
  const { mode, setMode, isFullscreenGenerator } = useStudioMode();
  const [showControlPanel, setShowControlPanel] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState<UnifiedPremiumStatus | null>(null);
  const [selectedModel, setSelectedModel] = useState('grok-4-fast');
  const [lastScrollY, setLastScrollY] = useState(0);

  // Image controls state
  const [imageAspectRatio, setImageAspectRatio] = useState('1:1');
  const [numImages, setNumImages] = useState(1);
  const [imageFormat, setImageFormat] = useState('jpeg');

  // Video controls state
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [videoDuration, setVideoDuration] = useState<4 | 6 | 8>(8);
  const [videoProvider, setVideoProvider] = useState('veo3-new');

  // Music controls state
  const [makeInstrumental, setMakeInstrumental] = useState(false);
  const [musicDuration, setMusicDuration] = useState(60);

  // Voice controls state
  const [voiceId, setVoiceId] = useState('alloy');
  const [speechSpeed, setSpeechSpeed] = useState(1);

  useEffect(() => {
    const checkAccess = async () => {
      if (user?.uid) {
        const status = await getUnifiedPremiumStatus(user.uid);
        setPremiumStatus(status);
      }
    };
    checkAccess();
  }, [user]);

  // Auto-collapse on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsCollapsed(true);
      } else if (currentScrollY < lastScrollY - 10) {
        setIsCollapsed(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const getModelInfo = () => {
    switch (mode) {
      case 'image':
        return {
          name: 'Image Generation',
          description: 'Create stunning images with AI',
          icon: ImageIcon,
        };
      case 'video':
        return {
          name: 'Video Generation',
          description: 'Generate videos from text prompts',
          icon: VideoIcon,
        };
      case 'music':
        return {
          name: 'Music Generation',
          description: 'Compose AI-generated music',
          icon: MusicIcon,
        };
      case 'voice':
        return {
          name: 'Voice Synthesis',
          description: 'Text-to-speech with AI voices',
          icon: Mic,
        };
      default:
        return {
          name: 'AI Chat',
          description: 'Chat with advanced AI models',
          icon: Sparkles,
        };
    }
  };

  const renderControls = () => {
    switch (mode) {
      case 'image':
        return (
          <ImageControls
            aspectRatio={imageAspectRatio}
            onAspectRatioChange={setImageAspectRatio}
            numImages={numImages}
            onNumImagesChange={setNumImages}
            outputFormat={imageFormat}
            onOutputFormatChange={setImageFormat}
          />
        );
      case 'video':
        return (
          <VideoControls
            aspectRatio={videoAspectRatio}
            onAspectRatioChange={setVideoAspectRatio}
            duration={videoDuration}
            onDurationChange={setVideoDuration}
            provider={videoProvider}
            onProviderChange={setVideoProvider}
          />
        );
      case 'music':
        return (
          <MusicControls
            makeInstrumental={makeInstrumental}
            onMakeInstrumentalChange={setMakeInstrumental}
            duration={musicDuration}
            onDurationChange={setMusicDuration}
          />
        );
      case 'voice':
        return (
          <VoiceControls
            voiceId={voiceId}
            onVoiceIdChange={setVoiceId}
            speed={speechSpeed}
            onSpeedChange={setSpeechSpeed}
          />
        );
      default:
        return (
          <div className="space-y-6">
            {/* Studio Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { mode: 'image', icon: Palette, label: 'Image', desc: 'Generate images' },
                { mode: 'video', icon: Film, label: 'Video', desc: 'Create videos' },
                { mode: 'music', icon: MusicIcon, label: 'Music', desc: 'Compose music' },
                { mode: 'voice', icon: Mic, label: 'Voice', desc: 'Text to speech' },
              ].map((studio) => {
                const StudioIcon = studio.icon;
                const isActive = mode === studio.mode;
                return (
                  <button
                    key={studio.mode}
                    onClick={() => setMode(studio.mode as StudioMode)}
                    className={`group relative p-5 rounded-xl border transition-all hover:scale-105 ${
                      isActive
                        ? 'bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 border-[#00FFF0]/50 shadow-lg shadow-[#00FFF0]/20'
                        : 'bg-white/5 border-white/10 hover:border-[#00FFF0]/30 hover:bg-white/10'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#00FFF0]/10 via-[#8A2BE2]/10 to-[#00FFF0]/10 animate-pulse" />
                    )}
                    <StudioIcon className={`w-12 h-12 mx-auto mb-3 relative z-10 ${
                      isActive ? 'text-[#00FFF0]' : 'text-white/60 group-hover:text-white/90'
                    } transition-all group-hover:scale-110`} />
                    <div className={`text-sm font-semibold relative z-10 ${
                      isActive ? 'text-white' : 'text-white/70'
                    }`}>
                      {studio.label}
                    </div>
                    <div className="text-xs text-white/40 mt-1 relative z-10">{studio.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Recent Projects */}
            <div className="pt-4">
              <h3 className="text-white/60 text-xs font-semibold mb-4 tracking-wide uppercase flex items-center gap-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#00FFF0]/30 to-transparent" />
                Recent Projects
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#00FFF0]/30 to-transparent" />
              </h3>
              <div className="text-center py-10 text-white/40 rounded-lg border border-white/5 bg-white/5">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#00FFF0]/10 to-[#8A2BE2]/10 border border-[#00FFF0]/20 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-[#00FFF0]/60" />
                </div>
                <p className="text-sm font-medium">No projects yet</p>
                <p className="text-xs mt-1 text-white/30">Start creating to see your work here</p>
              </div>
            </div>
          </div>
        );
    }
  };

  const modelInfo = getModelInfo();
  const IconComponent = modelInfo.icon;

  return (
    <div className="flex h-screen overflow-hidden relative">
      {/* Main Chat Component */}
      <div className={`flex-1 overflow-hidden transition-all duration-300 ${showControlPanel && mode !== 'chat' && !isFullscreenGenerator ? 'mr-0 md:mr-80 lg:mr-96' : ''}`}>
        <MainChat />
      </div>

      {/* Floating Toggle Button - Only show for specific studios */}
      {!showControlPanel && mode !== 'chat' && !isFullscreenGenerator && (
        <button
          onClick={() => setShowControlPanel(true)}
          className="fixed bottom-24 right-6 z-30 p-4 rounded-full bg-gradient-to-br from-[#00FFF0] to-[#8A2BE2] text-white shadow-2xl hover:shadow-[#00FFF0]/50 transition-all hover:scale-110 group"
          title="Show Controls"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Right Control Panel - Only show for specific studios, not for chat mode or fullscreen generators */}
      {showControlPanel && mode !== 'chat' && !isFullscreenGenerator && (
        <div className={`absolute top-0 right-0 h-full w-full md:w-80 lg:w-96 bg-black/40 backdrop-blur-2xl border-l border-[#00FFF0]/20 flex flex-col overflow-hidden z-20 shadow-2xl transition-all duration-300 ${
          isCollapsed ? 'translate-x-full md:translate-x-0 md:w-16 lg:w-16' : ''
        }`}>
          {/* Close Button */}
          <button
            onClick={() => setShowControlPanel(false)}
            className={`absolute top-4 right-4 p-2 rounded-lg bg-gradient-to-br from-[#00FFF0]/10 to-[#8A2BE2]/10 border border-[#00FFF0]/30 hover:border-[#00FFF0]/50 text-[#00FFF0] hover:scale-110 transition-all z-50 ${
              isCollapsed ? 'md:hidden' : ''
            }`}
            title="Close panel"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Expand Button (when collapsed) */}
          {isCollapsed && (
            <button
              onClick={() => setIsCollapsed(false)}
              className="hidden md:flex absolute top-4 right-4 p-2 rounded-lg bg-gradient-to-br from-[#00FFF0]/10 to-[#8A2BE2]/10 border border-[#00FFF0]/30 hover:border-[#00FFF0]/50 text-[#00FFF0] hover:scale-110 transition-all z-50"
              title="Expand panel"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {!isCollapsed && (
            <>
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-[#00FFF0]/10">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20 border border-[#00FFF0]/30">
                      <IconComponent className="w-5 h-5 text-[#00FFF0]" />
                    </div>
                    <div>
                      <h2 className="text-white font-semibold text-base">
                        {mode === 'chat' ? 'Select Studio' : modelInfo.name}
                      </h2>
                      {mode !== 'chat' && (
                        <p className="text-white/50 text-xs mt-0.5">{modelInfo.description}</p>
                      )}
                    </div>
                  </div>
                  {mode !== 'chat' && (
                    <button
                      onClick={() => setMode('chat')}
                      className="p-2 rounded-lg bg-gradient-to-br from-[#00FFF0]/10 to-[#8A2BE2]/10 border border-[#00FFF0]/30 hover:border-[#00FFF0]/50 text-[#00FFF0] hover:scale-110 transition-all"
                      title="Exit studio"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                {premiumStatus?.isPremium && (
                  <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-[#00FFF0]/20 to-[#8A2BE2]/20 border border-[#00FFF0]/30">
                    <Sparkles className="w-3 h-3 text-[#00FFF0] mr-1.5" />
                    <span className="text-[#00FFF0] text-xs font-semibold">PRO</span>
                  </div>
                )}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {renderControls()}
              </div>

              {/* Token Balance Footer */}
              {premiumStatus && (
                <div className="px-6 py-4 border-t border-[#00FFF0]/10 bg-gradient-to-br from-[#00FFF0]/5 to-[#8A2BE2]/5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/60 text-xs font-medium uppercase tracking-wide">Token Balance</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold bg-gradient-to-r from-[#00FFF0] to-[#8A2BE2] bg-clip-text text-transparent">
                      {premiumStatus.totalTokens.toLocaleString()}
                    </span>
                    <span className="text-white/40 text-sm">tokens</span>
                  </div>
                  {premiumStatus.paidTokens > 0 && (
                    <div className="mt-2 text-xs text-[#00FFF0]/70">
                      {premiumStatus.paidTokens.toLocaleString()} paid tokens available
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
