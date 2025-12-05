import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Play, Pause, Download, ChevronDown, ChevronUp, Loader, RotateCcw, Sparkles } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import {
  generateWithElevenLabsV3,
  ELEVENLABS_V3_MODELS,
  ELEVENLABS_V3_VOICES,
  estimateAudioDuration,
  calculateTTSTokenCost,
  getVoiceById,
  getModelById
} from '../../../lib/elevenlabsV3Service';
import { executeGeneration, getGenerationLimitMessage } from '../../../lib/unifiedGenerationService';
import { checkGenerationLimit } from '../../../lib/generationLimitsService';
import { StudioHeader } from '../../Studio/StudioHeader';
import { ModelSelector, ModelOption } from '../../Studio/ModelSelector';

interface TTSStudioProps {
  onClose: () => void;
  initialText?: string;
}

export const TTSStudio: React.FC<TTSStudioProps> = ({
  onClose,
  initialText = ''
}) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);

  // State
  const [text, setText] = useState(initialText);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState('');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Settings
  const [selectedModelId, setSelectedModelId] = useState(ELEVENLABS_V3_MODELS.TURBO_V3.id);
  const [selectedVoiceId, setSelectedVoiceId] = useState(ELEVENLABS_V3_VOICES[0].id);
  const [stability, setStability] = useState(50);
  const [similarityBoost, setSimilarityBoost] = useState(75);
  const [style, setStyle] = useState(0);
  const [useSpeakerBoost, setUseSpeakerBoost] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Limit info
  const [limitInfo, setLimitInfo] = useState<string>('');
  const [tokenBalance, setTokenBalance] = useState<number>(0);

  const STUDIO_COLOR = '#00B4D8';

  useEffect(() => {
    loadLimitInfo();
  }, [user]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Audio playback handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const loadLimitInfo = async () => {
    if (!user?.uid) return;
    const limit = await checkGenerationLimit(user.uid, 'tts');
    setLimitInfo(getGenerationLimitMessage('tts', limit.isPaid, limit.current, limit.limit));
    // Note: tokenBalance would come from user tier service in real implementation
    setTokenBalance(50000);
  };

  const models: ModelOption[] = Object.values(ELEVENLABS_V3_MODELS).map(model => ({
    id: model.id,
    name: model.name,
    description: model.description,
    speed: model.speed as any,
    tokenCost: model.tokenCost,
    recommended: model.recommended
  }));

  const handleGenerate = async () => {
    if (!text.trim()) {
      showToast('error', 'Empty Text', 'Please enter text to convert to speech');
      return;
    }

    if (text.length > 5000) {
      showToast('error', 'Text Too Long', 'Maximum 5000 characters allowed');
      return;
    }

    if (!user?.uid) {
      showToast('error', 'Authentication Required', 'Please log in to generate speech');
      return;
    }

    setIsGenerating(true);
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    const result = await executeGeneration({
      userId: user.uid,
      generationType: 'tts',
      modelId: 'elevenlabs-tts',
      provider: 'elevenlabs',
      onProgress: setProgress
    }, async () => {
      return await generateWithElevenLabsV3({
        text,
        voiceId: selectedVoiceId,
        modelId: selectedModelId,
        stability: stability / 100,
        similarityBoost: similarityBoost / 100,
        style: style / 100,
        useSpeakerBoost
      }, setProgress);
    });

    if (result.success && result.data) {
      const blob = result.data;
      const url = URL.createObjectURL(blob);
      setAudioBlob(blob);
      setAudioUrl(url);
      showToast('success', 'Speech Generated!', 'Your voiceover is ready');
      await loadLimitInfo();
    } else if (result.limitReached) {
      showToast('error', 'Limit Reached', result.error || 'Generation limit exceeded');
    } else if (result.insufficientTokens) {
      showToast('error', 'Insufficient Tokens', result.error || 'Not enough tokens');
    } else {
      showToast('error', 'Generation Failed', result.error || 'Failed to generate speech');
    }

    setIsGenerating(false);
    setProgress('');
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleReplay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);
  };

  const handleDownload = () => {
    if (!audioBlob) return;

    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voiceover_${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('success', 'Downloaded', 'Audio file saved to your device');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const estimatedDuration = estimateAudioDuration(text);
  const estimatedCost = calculateTTSTokenCost(text, selectedModelId);
  const selectedVoice = getVoiceById(selectedVoiceId);
  const selectedModel = getModelById(selectedModelId);

  return (
    <div className="h-full flex flex-col bg-black">
      <StudioHeader
        icon={Volume2}
        title="Text-to-Speech Generation"
        subtitle={`Powered by ElevenLabs ${selectedModel.name}`}
        color={STUDIO_COLOR}
        limitInfo={limitInfo}
        tokenBalance={tokenBalance}
        onClose={onClose}
      />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black min-h-[40vh] lg:min-h-0">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Loader className="w-16 h-16 animate-spin text-[#00B4D8]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Volume2 className="w-8 h-8 text-[#00B4D8] animate-pulse" />
                </div>
              </div>
              <p className="text-white/60 text-sm text-center px-4">
                {progress || 'Generating speech...'}
              </p>
            </div>
          ) : audioUrl ? (
            <div className="w-full max-w-2xl space-y-6">
              {/* Audio Player */}
              <div className="p-8 rounded-2xl border border-white/10 bg-white/5">
                <audio ref={audioRef} src={audioUrl} className="hidden" />

                {/* Waveform Placeholder (simplified) */}
                <div className="mb-6">
                  <div className="flex items-center justify-center gap-1 h-24">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 rounded-full bg-gradient-to-t from-[#00B4D8] to-[#00B4D8]/30 transition-all"
                        style={{
                          height: `${Math.random() * 60 + 20}%`,
                          opacity: currentTime > 0 && i < (currentTime / duration) * 50 ? 1 : 0.3
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00B4D8] to-[#00B4D8]/50 transition-all"
                      style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-white/40 mt-2">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={handleReplay}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
                    title="Replay"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>

                  <button
                    onClick={togglePlayPause}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00B4D8] to-[#0090B8] hover:from-[#00C4E8] hover:to-[#00A0C8] text-white shadow-lg transition-all hover:scale-105"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="w-7 h-7 mx-auto" />
                    ) : (
                      <Play className="w-7 h-7 mx-auto ml-1" />
                    )}
                  </button>

                  <button
                    onClick={handleDownload}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
                    title="Download"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Voice Info */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/5">
                <div>
                  <p className="text-white font-medium">{selectedVoice.name}</p>
                  <p className="text-white/50 text-sm">{selectedVoice.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-xs">Generated with</p>
                  <p className="text-[#00B4D8] text-sm font-medium">{selectedModel.name}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center max-w-md px-4">
              <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <Volume2 className="w-16 h-16 text-white/20" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Audio Preview</h3>
              <p className="text-base text-white/40">
                Enter your text and click generate to create professional voiceovers with AI
              </p>
            </div>
          )}
        </div>

        {/* Control Panel */}
        <div className="w-full lg:w-[420px] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col bg-black max-h-[60vh] lg:max-h-none overflow-y-auto">
          <button
            onClick={() => setShowControls(!showControls)}
            className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 text-white hover:bg-white/5 transition-colors"
          >
            <span className="text-sm font-medium">Controls</span>
            {showControls ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className={`${showControls ? 'block' : 'hidden lg:block'}`}>
            {/* Model Selection */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-[#00B4D8]" />
                <div className="text-sm font-semibold text-white">AI Model</div>
              </div>
              <ModelSelector
                models={models}
                selectedModelId={selectedModelId}
                onSelectModel={setSelectedModelId}
                color={STUDIO_COLOR}
                disabled={isGenerating}
              />
            </div>

            {/* Voice Selection */}
            <div className="p-6 border-b border-white/10">
              <label className="text-sm font-medium text-white/80 mb-3 block">Voice Character</label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {ELEVENLABS_V3_VOICES.map((voice) => (
                  <button
                    key={voice.id}
                    onClick={() => setSelectedVoiceId(voice.id)}
                    disabled={isGenerating}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedVoiceId === voice.id
                        ? 'bg-[#00B4D8]/10 border-[#00B4D8]/40 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-medium text-sm mb-0.5">{voice.name}</div>
                    <div className="text-xs opacity-60">{voice.gender}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="p-6 border-b border-white/10">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-sm font-medium text-white/80 mb-3"
              >
                <span>Advanced Settings</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="space-y-4 mt-4">
                  {/* Stability */}
                  <div>
                    <div className="flex justify-between text-xs text-white/60 mb-2">
                      <span>Stability</span>
                      <span>{stability}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stability}
                      onChange={(e) => setStability(Number(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #00B4D8 0%, #00B4D8 ${stability}%, rgba(255,255,255,0.1) ${stability}%, rgba(255,255,255,0.1) 100%)`
                      }}
                    />
                  </div>

                  {/* Similarity Boost */}
                  <div>
                    <div className="flex justify-between text-xs text-white/60 mb-2">
                      <span>Similarity Boost</span>
                      <span>{similarityBoost}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={similarityBoost}
                      onChange={(e) => setSimilarityBoost(Number(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #00B4D8 0%, #00B4D8 ${similarityBoost}%, rgba(255,255,255,0.1) ${similarityBoost}%, rgba(255,255,255,0.1) 100%)`
                      }}
                    />
                  </div>

                  {/* Style */}
                  <div>
                    <div className="flex justify-between text-xs text-white/60 mb-2">
                      <span>Style Exaggeration</span>
                      <span>{style}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={style}
                      onChange={(e) => setStyle(Number(e.target.value))}
                      className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #00B4D8 0%, #00B4D8 ${style}%, rgba(255,255,255,0.1) ${style}%, rgba(255,255,255,0.1) 100%)`
                      }}
                    />
                  </div>

                  {/* Speaker Boost */}
                  <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-all">
                    <div>
                      <div className="text-sm font-medium text-white">Speaker Boost</div>
                      <div className="text-xs text-white/50">Enhance vocal clarity</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={useSpeakerBoost}
                      onChange={(e) => setUseSpeakerBoost(e.target.checked)}
                      className="w-5 h-5 text-[#00B4D8] bg-white/10 border-white/20 rounded focus:ring-2 focus:ring-[#00B4D8]"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Text Input - Always Visible */}
          <div className="p-6 border-t border-white/10 bg-black mt-auto">
            <label className="text-sm font-medium text-white/80 mb-3 block">Text to Convert</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste your text here... Maximum 5000 characters"
              className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 focus:border-[#00B4D8]/40 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none resize-none transition-colors"
              disabled={isGenerating}
              maxLength={5000}
            />

            <div className="flex items-center justify-between text-xs text-white/40 mt-2 mb-4">
              <span>{text.length} / 5000 characters</span>
              <span>~{estimatedDuration}s audio • {estimatedCost.toLocaleString()} tokens</span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !text.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-[#00B4D8] hover:bg-[#00C4E8] disabled:bg-white/5 text-black font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px]"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span className="text-white">Generating...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-5 h-5" />
                  <span>Generate Speech</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
