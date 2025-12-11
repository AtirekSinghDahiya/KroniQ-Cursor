import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  Volume2,
  Play,
  Pause,
  Download,
  Loader,
  RotateCcw,
  Sparkles,
  History,
  Plus,
  Settings,
  Mic,
  ChevronRight,
  Music
} from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import {
  generateWithElevenLabsV3,
  ELEVENLABS_V3_MODELS,
  ELEVENLABS_V3_VOICES,
  estimateAudioDuration,
  calculateTTSTokenCost,
  getVoiceById
} from '../../../lib/elevenlabsV3Service';
import { executeGeneration, getGenerationLimitMessage } from '../../../lib/unifiedGenerationService';
import { checkGenerationLimit } from '../../../lib/generationLimitsService';
// Removed StudioHeader import to fix potential crash
// import { StudioHeader } from '../../Studio/StudioHeader';
import { createStudioProject, updateProjectState, loadProject, generateStudioProjectName, getUserProjects, StudioProject } from '../../../lib/studioProjectService';
import { useStudioMode } from '../../../contexts/StudioModeContext';
import { uploadTTSAudio, fetchAudioBlob } from '../../../lib/storageService';
import { getUserProfile } from '../../../lib/firestoreService';

interface TTSStudioProps {
  onClose: () => void;
  initialText?: string;
  projectId?: string;
}

export const TTSStudio: React.FC<TTSStudioProps> = ({
  onClose,
  initialText = '',
  projectId: initialProjectId
}) => {
  console.log('✅ TTSStudio Component Rendering');
  const { showToast } = useToast();
  const { user } = useAuth();
  const { projectId: activeProjectId } = useStudioMode();
  const audioRef = useRef<HTMLAudioElement>(null);

  // STUDIO THEME
  const STUDIO_GRADIENT = 'from-pink-500 via-purple-500 to-indigo-500';
  const BUTTON_GRADIENT = 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500';

  // TTS State
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

  // Limit info
  const [limitInfo, setLimitInfo] = useState<string>('');
  const [generationLimit, setGenerationLimit] = useState<{ current: number; limit: number; isPaid?: boolean } | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(initialProjectId || activeProjectId || null);
  const [historyProjects, setHistoryProjects] = useState<StudioProject[]>([]);
  const [isLoadingProject, setIsLoadingProject] = useState(false);

  // Refresh saved TTS projects list
  const refreshProjects = async () => {
    if (!user?.uid) return;
    try {
      const projectsResult = await getUserProjects(user.uid, 'tts');
      if (projectsResult.success && projectsResult.projects) {
        setHistoryProjects(projectsResult.projects);
      }
    } catch (error) {
      console.error('Error loading TTS projects:', error);
    }
  };

  useEffect(() => {
    loadLimitInfo();
    refreshProjects();
  }, [user]);

  useEffect(() => {
    if (initialProjectId && user?.uid) {
      loadExistingProject(initialProjectId);
    }
  }, [initialProjectId, user]);

  const loadExistingProject = async (projectId: string) => {
    setIsLoadingProject(true);
    try {
      const result = await loadProject(projectId);
      if (result.success && result.project) {
        setCurrentProjectId(projectId);
        const state = result.project.session_state || {};

        setText(state.text || '');
        setSelectedModelId(state.selectedModelId || ELEVENLABS_V3_MODELS.TURBO_V3.id);
        setSelectedVoiceId(state.selectedVoiceId || ELEVENLABS_V3_VOICES[0].id);
        setStability(state.stability || 50);
        setSimilarityBoost(state.similarityBoost || 75);
        setStyle(state.style || 0);
        setUseSpeakerBoost(state.useSpeakerBoost ?? true);

        // Restore audio logic with multiple fallbacks
        if (state.audioStorageUrl) {
          try {
            console.log('🔄 Attempting to restore audio from Firebase Storage...');
            const blob = await fetchAudioBlob(state.audioStorageUrl);

            if (blob) {
              const url = URL.createObjectURL(blob);
              setAudioBlob(blob);
              setAudioUrl(url);
              console.log('✅ Restored audio blob from Firebase Storage');
            } else {
              console.warn('⚠️ Could not fetch audio blob (likely CORS), falling back to direct URL');
              setAudioBlob(null);
              setAudioUrl(state.audioStorageUrl);
            }
          } catch (e) {
            console.error('❌ Failed to restore audio from Storage, using direct URL:', e);
            setAudioBlob(null);
            setAudioUrl(state.audioStorageUrl);
          }
        } else if (state.audioBase64) {
          // Fallback: Use base64 data URL
          console.log('🔄 Restoring audio from base64 fallback...');
          try {
            // Convert base64 data URL to blob for consistent handling
            const response = await fetch(state.audioBase64);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setAudioBlob(blob);
            setAudioUrl(url);
            console.log('✅ Restored audio from base64');
          } catch (b64Error) {
            console.warn('⚠️ Could not convert base64, using directly:', b64Error);
            setAudioBlob(null);
            setAudioUrl(state.audioBase64);
          }
        } else {
          setAudioBlob(null);
          setAudioUrl(null);
        }
      }
    } catch (error) {
      console.error('Error loading TTS project:', error);
      showToast('error', 'Load Failed', 'Could not load the saved project');
    } finally {
      setIsLoadingProject(false);
    }
  };

  const saveProjectState = async (overrides: any = {}, audioBlobOverride: Blob | null = null) => {
    if (!user?.uid) return null;

    let projectIdToUse = currentProjectId;

    // 1. Create project if needed
    if (!projectIdToUse) {
      const projectName = generateStudioProjectName('tts', text);
      const initialSessionState = {
        text,
        selectedModelId,
        selectedVoiceId,
        stability,
        similarityBoost,
        style,
        useSpeakerBoost,
        audioStorageUrl: null,
        ...overrides
      };

      const result = await createStudioProject({
        userId: user.uid,
        studioType: 'tts',
        name: projectName,
        description: text,
        model: selectedModelId,
        sessionState: initialSessionState
      });

      if (result.success && result.projectId) {
        projectIdToUse = result.projectId;
        setCurrentProjectId(result.projectId);
      } else {
        console.error('❌ Failed to create TTS project:', result.error);
        return null;
      }
    }

    // 2. Upload audio if available (using override if provided for immediate saves)
    const blobToSave = audioBlobOverride || audioBlob;
    let audioStorageUrl: string | null = null;
    let audioBase64: string | null = null;

    if (blobToSave && projectIdToUse) {
      try {
        const uploadResult = await uploadTTSAudio(projectIdToUse, blobToSave);
        if (uploadResult.success && uploadResult.url) {
          audioStorageUrl = uploadResult.url;
          console.log('✅ Audio uploaded to Firebase Storage');
        } else {
          throw new Error(uploadResult.error || 'Upload failed');
        }
      } catch (e) {
        console.warn('⚠️ Firebase Storage upload failed (likely CORS), using base64 fallback');
        // Fallback: Convert blob to base64 data URL for smaller audio files (<1MB)
        if (blobToSave.size < 1024 * 1024) { // Less than 1MB
          try {
            const reader = new FileReader();
            audioBase64 = await new Promise<string>((resolve, reject) => {
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blobToSave);
            });
            console.log('✅ Audio saved as base64 fallback');
          } catch (b64Error) {
            console.error('❌ Base64 conversion also failed:', b64Error);
          }
        } else {
          console.warn('⚠️ Audio too large for base64 fallback (>1MB)');
        }
      }
    }

    // 3. Update project with final state
    const finalSessionState = {
      text,
      selectedModelId,
      selectedVoiceId,
      stability,
      similarityBoost,
      style,
      useSpeakerBoost,
      audioStorageUrl, // Firebase Storage URL (null if upload failed)
      audioBase64, // Base64 fallback (null if not needed or too large)
      ...overrides
    };

    try {
      await updateProjectState({
        projectId: projectIdToUse!,
        sessionState: finalSessionState
      });
      console.log('✅ Project saved:', projectIdToUse);
      return projectIdToUse;
    } catch (error) {
      console.error('❌ Error saving project state:', error);
      return projectIdToUse;
    }
  };

  useEffect(() => {
    return () => {
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Audio Event Listeners
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
    const profile = await getUserProfile(user.uid);

    if (profile) setTokenBalance(profile.tokensLimit - profile.tokensUsed);

    const limit = await checkGenerationLimit(user.uid, 'tts');
    setLimitInfo(getGenerationLimitMessage('tts', limit.isPaid, limit.current, limit.limit));
    setGenerationLimit({ current: limit.current, limit: limit.limit, isPaid: limit.isPaid });
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      showToast('error', 'Empty Text', 'Please enter text.');
      return;
    }
    if (!user?.uid) {
      showToast('error', 'Login Required', 'Please log in.');
      return;
    }

    setIsGenerating(true);
    setAudioBlob(null);
    if (audioUrl && audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);

    const baseCost = 500;
    const perCharCost = 10;
    const totalCost = baseCost + (text.length * perCharCost);

    const result = await executeGeneration({
      userId: user.uid,
      generationType: 'tts',
      modelId: 'elevenlabs',
      provider: 'elevenlabs',
      customCost: totalCost,
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

      // Save immediately with the blob to fix race condition
      const savedId = await saveProjectState({}, blob);

      if (savedId) {
        showToast('success', 'Generated', 'Audio ready and saved.');
        await refreshProjects();
      }
      await loadLimitInfo();
    } else {
      showToast('error', 'Failed', result.error || 'Generation failed');
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
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `speech_${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('success', 'Downloaded', 'File saved.');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedVoice = getVoiceById(selectedVoiceId);
  const estimatedDuration = estimateAudioDuration(text);
  const estimatedCost = calculateTTSTokenCost(text, selectedModelId);

  return (
    <div className="h-full flex flex-col bg-black text-white font-sans selection:bg-pink-500/30">
      {/* Inline Simple Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg border border-pink-500/40 bg-pink-500/20">
            <Volume2 className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-white">Text to Speech</h1>

              {/* Generation Limit Display */}
              {generationLimit && (
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
                  title={generationLimit.isPaid ? 'Unlimited (token-based)' : `${generationLimit.limit - generationLimit.current} remaining today`}
                >
                  <Mic className="w-4 h-4 text-pink-400" />
                  <span className="text-xs font-medium text-white/80">
                    {generationLimit.isPaid ? (
                      <span className="text-pink-400">∞</span>
                    ) : (
                      <>
                        <span className={generationLimit.current >= generationLimit.limit ? 'text-red-400' : 'text-white'}>
                          {generationLimit.current}
                        </span>
                        <span className="text-white/50">/{generationLimit.limit}</span>
                      </>
                    )}
                  </span>
                  {!generationLimit.isPaid && (
                    <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${Math.min((generationLimit.current / generationLimit.limit) * 100, 100)}%`,
                          backgroundColor: generationLimit.current >= generationLimit.limit ? '#ef4444' :
                            generationLimit.current >= generationLimit.limit * 0.8 ? '#eab308' : '#ec4899'
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Token Balance */}
              {tokenBalance > 0 && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <span className="text-xs font-medium text-white/80">
                    {tokenBalance.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-white/40">tokens</span>
                </div>
              )}
            </div>
            <span className="text-xs text-white/40">AI Voice Studio</span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-white/60">
          <span className="sr-only">Close</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[120px]" />
        </div>

        {/* Saved Projects Sidebar - Glassmorphism */}
        <div className="hidden lg:flex lg:w-80 border-r border-white/5 flex-col bg-black/40 backdrop-blur-xl h-full z-10">
          <div className="p-4 border-b border-white/5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white/80 mb-4">
              <History className="w-4 h-4 text-pink-400" /> Library
            </h2>
            <button
              onClick={() => {
                setText('');
                setAudioBlob(null);
                setAudioUrl(null);
                setCurrentProjectId(null);
              }}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${BUTTON_GRADIENT} text-white font-medium rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]`}
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {historyProjects.length === 0 ? (
              <div className="text-center py-12 text-white/20">
                <Music className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">No saved voices yet</p>
              </div>
            ) : (
              historyProjects.map(proj => (
                <div
                  key={proj.id}
                  onClick={() => loadExistingProject(proj.id)}
                  className={`group p-3 rounded-xl cursor-pointer transition-all border ${currentProjectId === proj.id
                    ? 'bg-white/10 border-pink-500/50 shadow-inner'
                    : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                    }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm text-white truncate w-full pr-2">
                      {proj.name.replace('Voice: ', '')}
                    </span>
                    {currentProjectId === proj.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse mt-1.5" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/40 group-hover:text-white/60">
                    <span>{new Date(proj.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Workspace */}
        <div className="flex-1 flex flex-col lg:flex-row z-10 relative">

          {/* Audio Visualizer & Preview Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative">
            <div className="w-full max-w-2xl">

              {isGenerating ? (
                <div className="flex flex-col items-center justify-center min-h-[300px]">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full animate-pulse" />
                    <Loader className="w-16 h-16 animate-spin text-pink-500 relative z-10" />
                  </div>
                  <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                    Generating Voice...
                  </h3>
                  <p className="text-white/40 text-sm mt-2">{progress}</p>
                </div>
              ) : audioUrl ? (
                <div className="relative group">
                  {/* Glass Player Card */}
                  <div className="p-8 pb-10 rounded-[32px] border border-white/10 bg-gradient-to-b from-white/10 to-black/40 backdrop-blur-2xl shadow-2xl overflow-hidden">
                    <audio ref={audioRef} src={audioUrl} className="hidden" crossOrigin="anonymous" />

                    {/* Decorative Background Blob behind player */}
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-pink-500/5 to-purple-600/5 z-0" />

                    {/* Visualizer */}
                    <div className="relative z-10 mb-8 h-32 flex items-center justify-center gap-1.5">
                      {/* Animated bars - using CSS for simulation if blob not available, or just visual effect */}
                      {Array.from({ length: 30 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-2 rounded-full bg-gradient-to-t from-pink-500 to-purple-500 transition-all duration-100 shadow-[0_0_10px_rgba(236,72,153,0.3)]"
                          style={{
                            height: isPlaying ? `${Math.max(15, Math.random() * 100)}%` : '20%',
                            opacity: isPlaying ? 1 : 0.3
                          }}
                        />
                      ))}
                    </div>

                    {/* Time & Progress */}
                    <div className="relative z-10 mb-8 px-2">
                      <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={(e) => {
                          if (audioRef.current) audioRef.current.currentTime = Number(e.target.value);
                        }}
                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-pink-500 hover:accent-pink-400"
                      />
                      <div className="flex justify-between mt-2 text-xs font-medium text-white/50 font-mono">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="relative z-10 flex items-center justify-center gap-8">
                      <button onClick={handleReplay} className="p-3 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all">
                        <RotateCcw className="w-6 h-6" />
                      </button>

                      <button
                        onClick={togglePlayPause}
                        className={`w-20 h-20 rounded-full flex items-center justify-center ${BUTTON_GRADIENT} shadow-xl shadow-pink-500/30 transition-all hover:scale-105 active:scale-95`}
                      >
                        {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                      </button>

                      <button onClick={handleDownload} className="p-3 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all">
                        <Download className="w-6 h-6" />
                      </button>
                    </div>
                  </div>

                  {/* Voice Info Tag */}
                  <div className="mx-auto w-max mt-6 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/60 flex items-center gap-2">
                    <Mic className="w-3 h-3 text-pink-400" />
                    <span>{selectedVoice.name}</span>
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    <span>{ELEVENLABS_V3_MODELS.TURBO_V3.name}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 rounded-[2rem] bg-gradient-to-tr from-pink-500/20 to-purple-500/20 flex items-center justify-center border border-white/5 relative group">
                    <div className="absolute inset-0 bg-pink-500/10 blur-xl rounded-[2rem] transition-all group-hover:bg-pink-500/20" />
                    <Sparkles className="w-10 h-10 text-pink-400 relative z-10" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">AI Voice Studio</h2>
                  <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
                    Create ultra-realistic speech in seconds. Select a voice, type your text, and let AI do the rest.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Controls & Input */}
          <div className="w-full lg:w-[400px] bg-[#0A0A0A]/90 backdrop-blur-3xl border-l border-white/5 flex flex-col shadow-2xl z-20">
            {/* Input Area */}
            <div className="flex-1 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-bold text-white/60 uppercase tracking-widest flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-pink-500" /> Script
                </label>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${text.length > 4500
                  ? 'border-red-500/50 text-red-400 bg-red-500/10'
                  : 'border-white/10 text-white/30 bg-white/5'
                  }`}>
                  {text.length} / 5000
                </span>
              </div>

              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text here... telling a story, explaining a concept, or just saying hello!"
                className="flex-1 w-full bg-white/5 hover:bg-white/[0.07] focus:bg-white/10 border border-white/10 rounded-2xl p-5 text-sm text-white/90 placeholder-white/20 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 resize-none transition-all leading-relaxed custom-scrollbar"
                spellCheck={false}
              />

              <div className="mt-4 flex items-center justify-between text-xs text-white/30 px-2 font-mono">
                <span>~ {estimatedDuration}s duration</span>
                <span>{estimatedCost.toLocaleString()} tokens</span>
              </div>
            </div>

            {/* Settings Area */}
            <div className="p-6 bg-black/20 border-t border-white/5 space-y-6">
              {/* Voice Selector */}
              <div>
                <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3 block">Voice Selection</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                  {ELEVENLABS_V3_VOICES.map((voice) => (
                    <button
                      key={voice.id}
                      onClick={() => setSelectedVoiceId(voice.id)}
                      className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden group ${selectedVoiceId === voice.id
                        ? 'bg-pink-500/10 border-pink-500/50 text-white'
                        : 'bg-white/5 border-white/5 text-white/50 hover:bg-white/10'
                        }`}
                    >
                      <div className="relative z-10">
                        <div className="font-semibold text-xs mb-0.5">{voice.name}</div>
                        <div className="text-[10px] opacity-60">{voice.gender}</div>
                      </div>
                      {selectedVoiceId === voice.id && (
                        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-transparent opacity-50" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Advanced Settings Toggle */}
              <div className="pt-2">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all text-xs font-medium text-white/60"
                >
                  <span className="flex items-center gap-2">
                    <Settings className={`w-3.5 h-3.5 ${showAdvanced ? 'text-pink-400' : ''}`} />
                    Advanced Controls
                  </span>
                  <ChevronRight className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
                </button>

                {showAdvanced && (
                  <div className="mt-3 p-4 rounded-xl bg-black/40 border border-white/5 space-y-5 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-white/40">
                        <span>Stability</span>
                        <span className="text-pink-400">{stability}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={stability}
                        onChange={(e) => setStability(Number(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-pink-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] uppercase font-bold text-white/40">
                        <span>Clarity + Boost</span>
                        <span className="text-purple-400">{similarityBoost}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={similarityBoost}
                        onChange={(e) => setSimilarityBoost(Number(e.target.value))}
                        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-purple-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim()}
                className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-pink-500/20 transition-all ${isGenerating || !text.trim()
                  ? 'bg-white/5 text-white/20 cursor-not-allowed'
                  : `${BUTTON_GRADIENT} text-white hover:shadow-pink-500/40 hover:scale-[1.02] active:scale-[0.98]`
                  }`}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" /> Generating...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" /> Generate Speech
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
