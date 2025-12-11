import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, X, Loader, Download, Play, Pause, Upload,
  Wand2, Volume2, Settings, History, FileAudio
} from 'lucide-react';
import { generateWithElevenLabs, ELEVENLABS_VOICES } from '../../../lib/elevenlabsTTSService';
import { generateWithGeminiTTS } from '../../../lib/geminiTTSService';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { addMessage } from '../../../lib/chatService';
import { deductTokensForRequest } from '../../../lib/tokenService';
import { getModelCost } from '../../../lib/modelTokenPricing';
import { supabase } from '../../../lib/supabase';
import { useStudioMode } from '../../../contexts/StudioModeContext';
import { createStudioProject, updateProjectState, loadProject, generateStudioProjectName } from '../../../lib/studioProjectService';

interface VoiceStudioProps {
  onClose: () => void;
  projectId?: string;
}

type StudioTab = 'tts' | 'voice-changer' | 'sound-effects' | 'voice-isolator';

interface GeneratedAudio {
  url: string;
  title: string;
  type: StudioTab;
  projectId: string;
  timestamp: Date;
}

const soundEffectCategories = [
  {
    id: 'animals',
    name: 'Animals',
    icon: '🦁',
    gradient: 'from-orange-500 to-red-500'
  },
  {
    id: 'bass',
    name: 'Bass',
    icon: '🔊',
    gradient: 'from-blue-600 to-purple-600'
  },
  {
    id: 'booms',
    name: 'Booms',
    icon: '💥',
    gradient: 'from-red-500 to-orange-500'
  },
  {
    id: 'braams',
    name: 'Braams',
    icon: '⚡',
    gradient: 'from-yellow-500 to-red-500'
  },
  {
    id: 'brass',
    name: 'Brass',
    icon: '🎺',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    id: 'cymbals',
    name: 'Cymbals',
    icon: '🥁',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'devices',
    name: 'Devices',
    icon: '⚙️',
    gradient: 'from-gray-600 to-blue-600'
  },
  {
    id: 'drones',
    name: 'Drones',
    icon: '🚁',
    gradient: 'from-red-600 to-gray-600'
  }
];

const quickPrompts = [
  { icon: '📖', text: 'Narrate a story' },
  { icon: '😄', text: 'Tell a silly joke' },
  { icon: '📻', text: 'Record an advertisement' },
  { icon: '🌍', text: 'Speak in different languages' },
  { icon: '🎬', text: 'Direct a dramatic movie scene' },
  { icon: '🎮', text: 'Hear from a video game character' },
  { icon: '🎙️', text: 'Introduce your podcast' },
  { icon: '🧘', text: 'Guide a meditation class' }
];

export const VoiceStudio: React.FC<VoiceStudioProps> = ({ onClose, projectId: initialProjectId }) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { projectId: activeProjectId } = useStudioMode();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<StudioTab>('tts');
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(ELEVENLABS_VOICES[0]);
  const [speed, setSpeed] = useState(1.0);
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [styleExaggeration, setStyleExaggeration] = useState(0);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(initialProjectId || activeProjectId || null);
  const [generatedAudios, setGeneratedAudios] = useState<GeneratedAudio[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [progress, setProgress] = useState('');
  const [tokenBalance, setTokenBalance] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [soundSearch, setSoundSearch] = useState('');
  const [showVoiceSelector, setShowVoiceSelector] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadTokenBalance();
    }
  }, [user]);

  useEffect(() => {
    if (initialProjectId && user?.uid) {
      loadExistingProject(initialProjectId);
    }
  }, [initialProjectId, user]);

  const loadExistingProject = async (projectId: string) => {
    try {
      const result = await loadProject(projectId);
      if (result.success && result.project) {
        const state = result.project.session_state || {};
        setText(state.text || '');
        setSelectedVoice(state.selectedVoice || ELEVENLABS_VOICES[0]);
        setSpeed(state.speed || 1.0);
        setStability(state.stability || 0.5);
        setSimilarity(state.similarity || 0.75);
        setGeneratedAudios(state.generatedAudios || []);
        console.log('✅ Loaded existing voice project:', projectId);
      }
    } catch (error) {
      console.error('Error loading voice project:', error);
    }
  };

  const saveProjectState = async () => {
    if (!user?.uid) return null;

    const sessionState = {
      text,
      selectedVoice,
      speed,
      stability,
      similarity,
      generatedAudios
    };

    try {
      if (currentProjectId) {
        await updateProjectState({
          projectId: currentProjectId,
          sessionState
        });
        console.log('✅ Voice project state updated');
        return currentProjectId;
      } else {
        const projectName = generateStudioProjectName('voice', text);
        const result = await createStudioProject({
          userId: user.uid,
          studioType: 'voice',
          name: projectName,
          description: text,
          model: 'elevenlabs',
          sessionState
        });

        if (result.success && result.projectId) {
          setCurrentProjectId(result.projectId);
          console.log('✅ New voice project created:', result.projectId);
          showToast('success', 'Project Saved', 'Your voice project has been saved');
          return result.projectId;
        }
      }
    } catch (error) {
      console.error('Error saving voice project:', error);
    }
    return null;
  };

  const loadTokenBalance = async () => {
    if (!user?.uid) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('tokens_balance')
      .eq('id', user.uid)
      .maybeSingle();

    if (profile) {
      setTokenBalance(profile.tokens_balance || 0);
    }
  };

  const handleGenerate = async () => {
    if (activeTab === 'tts' && !text.trim()) {
      showToast('error', 'Empty Text', 'Please enter text to convert to speech');
      return;
    }

    if (activeTab === 'voice-changer' && !uploadedFile) {
      showToast('error', 'No File', 'Please upload an audio file');
      return;
    }

    if (!user?.uid) {
      showToast('error', 'Authentication Required', 'Please log in');
      return;
    }

    setIsGenerating(true);
    setProgress('Initializing...');

    try {
      let projectId = currentProjectId;

      if (!projectId) {
        projectId = await saveProjectState();
        if (projectId) {
          setCurrentProjectId(projectId);
        } else {
          throw new Error('Failed to create project');
        }
      }

      await addMessage(projectId, 'user', text || 'Voice generation request');

      let audioUrl: string;

      if (activeTab === 'tts') {
        try {
          audioUrl = await generateWithElevenLabs({
            text,
            voice: selectedVoice.id,
            model: 'eleven_turbo_v2_5',
            stability,
            similarity_boost: similarity
          }, setProgress);
        } catch (elevenLabsError: any) {
          console.warn('ElevenLabs failed, trying Gemini TTS fallback:', elevenLabsError.message);
          showToast('info', 'Using Alternative TTS', 'Switching to Gemini TTS');

          // Fallback to Gemini TTS
          audioUrl = await generateWithGeminiTTS({
            text,
            voice: 'nova',
            speed: 1.0
          }, setProgress);
        }
      } else if (activeTab === 'voice-changer') {
        setProgress('Processing voice change...');
        audioUrl = 'data:audio/mp3;base64,placeholder';
      } else if (activeTab === 'sound-effects') {
        setProgress('Generating sound effect...');
        audioUrl = 'data:audio/mp3;base64,placeholder';
      } else {
        setProgress('Isolating voice...');
        audioUrl = 'data:audio/mp3;base64,placeholder';
      }

      const modelCost = getModelCost('elevenlabs');

      // Calculate dynamic token cost - MINIMUM 1000 tokens for TTS generation
      // TTS pricing is typically per character, so we use tokensPerMessage as base + text length
      const baseTokens = Math.max(1000, Math.ceil(modelCost.tokensPerMessage * 0.1)); // Minimum 1000 tokens
      const charCost = text.length * 2; // 2 tokens per character for TTS

      const tokensToDeduct = baseTokens + charCost;

      console.log('💰 Voice Token Calculation:', {
        model: 'elevenlabs',
        baseTokens,
        chars: text.length,
        charCost,
        total: tokensToDeduct
      });

      setProgress('Deducting tokens...');
      await deductTokensForRequest(
        user.uid,
        'elevenlabs',
        'elevenlabs',
        tokensToDeduct,
        'voice'
      );

      await loadTokenBalance();

      const audioData: GeneratedAudio = {
        url: audioUrl,
        title: text.substring(0, 50) || 'Generated Audio',
        type: activeTab,
        projectId,
        timestamp: new Date()
      };

      await addMessage(projectId, 'assistant', JSON.stringify({
        type: 'voice',
        audioUrl,
        title: audioData.title,
        voiceType: activeTab
      }));

      setGeneratedAudios(prev => [audioData, ...prev]);
      showToast('success', 'Audio Generated!', `Deducted ${tokensToDeduct.toLocaleString()} tokens`);
      await saveProjectState();

      setText('');
      setProgress('');
    } catch (error: any) {
      console.error('Voice generation error:', error);
      showToast('error', 'Generation Failed', error.message || 'Failed to generate audio');
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        showToast('error', 'File Too Large', 'Maximum file size is 50MB');
        return;
      }
      setUploadedFile(file);
      showToast('success', 'File Uploaded', file.name);
    }
  };

  const handleDownload = async (audio: GeneratedAudio) => {
    const { downloadAudio } = await import('../../../lib/downloadUtils');
    const success = await downloadAudio(audio.url, audio.title);
    if (success) {
      showToast('success', 'Downloaded!', 'Audio saved to Downloads folder');
    } else {
      showToast('info', 'Opened in Browser', 'Right-click to save the audio');
    }
  };

  const togglePlay = (index: number) => {
    const audio = document.getElementById(`audio-player-${index}`) as HTMLAudioElement;
    if (audio) {
      if (currentlyPlaying === index) {
        audio.pause();
        setCurrentlyPlaying(null);
      } else {
        if (currentlyPlaying !== null) {
          const prevAudio = document.getElementById(`audio-player-${currentlyPlaying}`) as HTMLAudioElement;
          if (prevAudio) prevAudio.pause();
        }
        audio.play();
        setCurrentlyPlaying(index);
      }
    }
  };

  const applyQuickPrompt = (prompt: string) => {
    setText(prompt);
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white overflow-hidden">
      {/* Top Header */}
      <div className="border-b border-white/10 bg-[#0a0a0a]">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Mic className="w-6 h-6" />
            <h1 className="text-xl font-bold">
              {activeTab === 'tts' && 'Text to Speech'}
              {activeTab === 'voice-changer' && 'Voice Changer'}
              {activeTab === 'sound-effects' && 'Sound Effects'}
              {activeTab === 'voice-isolator' && 'Voice Isolator'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg transition-all text-sm">
              <FileAudio className="w-4 h-4" />
              <span>Feedback</span>
            </button>

            <button className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-lg transition-all text-sm">
              <Settings className="w-4 h-4" />
              <span>Documentation</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 active:scale-95 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Input/Generation Area */}
        <div className="flex-1 flex flex-col">
          {/* Text to Speech Tab */}
          {activeTab === 'tts' && (
            <div className="flex-1 flex flex-col p-6">
              <div className="flex-1 mb-6">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Start typing here or paste any text you want to turn into lifelike speech..."
                  className="w-full h-full px-6 py-4 bg-transparent border-none text-white text-lg placeholder-white/30 focus:outline-none resize-none"
                  disabled={isGenerating}
                />
              </div>

              {/* Quick Prompts */}
              <div className="mb-6">
                <p className="text-sm text-white/50 mb-3">Get started with</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => applyQuickPrompt(prompt.text)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-left text-sm transition-all flex items-center gap-2"
                      disabled={isGenerating}
                    >
                      <span>{prompt.icon}</span>
                      <span className="truncate">{prompt.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-white/50">
                  <span>{tokenBalance.toLocaleString()} credits remaining</span>
                  <span>0:00 total duration</span>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !text.trim()}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      <span>Generate speech</span>
                    </>
                  )}
                </button>
              </div>

              {isGenerating && progress && (
                <p className="text-xs text-white/40 text-center mt-3">{progress}</p>
              )}
            </div>
          )}

          {/* Voice Changer Tab */}
          {activeTab === 'voice-changer' && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="w-full max-w-2xl">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="border-2 border-dashed border-white/20 rounded-2xl p-12">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/5 rounded-xl mb-4">
                      <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Click to upload, or drag and drop</h3>
                    <p className="text-white/50 mb-4">Audio or video files up to 50MB each</p>

                    {uploadedFile ? (
                      <div className="mb-4 p-4 bg-white/5 rounded-lg">
                        <p className="text-sm text-white/70">Uploaded: {uploadedFile.name}</p>
                      </div>
                    ) : null}

                    <div className="flex items-center gap-4 justify-center">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                      >
                        Choose File
                      </button>
                      <span className="text-white/30">or</span>
                      <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all flex items-center gap-2">
                        <Mic className="w-4 h-4" />
                        Record audio
                      </button>
                    </div>
                  </div>
                </div>

                {uploadedFile && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5" />
                          <span>Generate speech</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/50">
                  <span>{tokenBalance.toLocaleString()} credits remaining</span>
                  <span>0:00 total duration</span>
                </div>
              </div>
            </div>
          )}

          {/* Sound Effects Tab */}
          {activeTab === 'sound-effects' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Content Area */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-8">
                  {/* Categories Grid */}
                  <div className="mb-8">
                    <h3 className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wide">Browse Categories</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {soundEffectCategories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => setSoundSearch(category.name.toLowerCase())}
                          className="group relative overflow-hidden rounded-xl aspect-[4/3]"
                        >
                          <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />
                          <div className="relative h-full flex flex-col items-center justify-center gap-2 p-4">
                            <span className="text-3xl">{category.icon}</span>
                            <span className="text-white font-semibold text-sm">{category.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main Generation Area */}
                  <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    {/* Prompt Input */}
                    <div className="p-6 border-b border-white/10">
                      <label className="block text-sm font-semibold text-white mb-3">
                        Describe your sound effect
                      </label>
                      <textarea
                        value={soundSearch}
                        onChange={(e) => setSoundSearch(e.target.value)}
                        placeholder="e.g., A deep drum hit with reverb, footsteps on wooden floor, dramatic whoosh transition..."
                        className="w-full h-32 px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/20 focus:bg-black/40 transition-all resize-none"
                        disabled={isGenerating}
                      />
                    </div>

                    {/* Duration Selection */}
                    <div className="px-6 py-4 border-b border-white/10">
                      <label className="block text-sm font-semibold text-white mb-3">Duration</label>
                      <div className="flex gap-2">
                        <button className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-all">
                          <div className="flex items-center justify-center gap-2">
                            <Volume2 className="w-4 h-4" />
                            <span>0.5s</span>
                          </div>
                        </button>
                        <button className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-all">
                          <div className="flex items-center justify-center gap-2">
                            <Volume2 className="w-4 h-4" />
                            <span>1s</span>
                          </div>
                        </button>
                        <button className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-all">
                          <div className="flex items-center justify-center gap-2">
                            <Volume2 className="w-4 h-4" />
                            <span>2s</span>
                          </div>
                        </button>
                        <button className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-all">
                          <div className="flex items-center justify-center gap-2">
                            <Volume2 className="w-4 h-4" />
                            <span>5s</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <div className="p-6">
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !soundSearch.trim()}
                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-white/5 disabled:to-white/5 text-white font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20"
                      >
                        {isGenerating ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Generating sound effect...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-5 h-5" />
                            <span>Generate Sound Effect</span>
                          </>
                        )}
                      </button>
                      {isGenerating && progress && (
                        <p className="text-xs text-white/40 text-center mt-3">{progress}</p>
                      )}
                    </div>
                  </div>

                  {/* Info Footer */}
                  <div className="mt-6 flex items-center justify-between text-sm text-white/50">
                    <span>{tokenBalance.toLocaleString()} tokens remaining</span>
                    <span>Powered by AI sound generation</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Voice Isolator Tab */}
          {activeTab === 'voice-isolator' && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <Wand2 className="w-16 h-16 text-white/20 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Voice Isolation</h3>
                <p className="text-white/50 mb-6">Remove background noise and isolate vocals from audio</p>
                <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-all">
                  Coming Soon
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Settings & History */}
        <div className="w-96 border-l border-white/10 flex flex-col bg-[#0a0a0a]">
          {/* Tabs */}
          <div className="border-b border-white/10 px-6">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowHistory(false)}
                className={`px-4 py-3 border-b-2 text-sm font-medium transition-colors ${!showHistory ? 'border-white text-white' : 'border-transparent text-white/50 hover:text-white'
                  }`}
              >
                Settings
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className={`px-4 py-3 border-b-2 text-sm font-medium transition-colors ${showHistory ? 'border-white text-white' : 'border-transparent text-white/50 hover:text-white'
                  }`}
              >
                History
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {!showHistory ? (
              <>
                {/* Mode Tabs */}
                <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                  <button
                    onClick={() => setActiveTab('tts')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-all ${activeTab === 'tts' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
                      }`}
                  >
                    Text to Speech
                  </button>
                  <button
                    onClick={() => setActiveTab('voice-changer')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded transition-all ${activeTab === 'voice-changer' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
                      }`}
                  >
                    Voice Changer
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('sound-effects')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded border transition-all ${activeTab === 'sound-effects'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                      }`}
                  >
                    Sound Effects
                  </button>
                  <button
                    onClick={() => setActiveTab('voice-isolator')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded border transition-all ${activeTab === 'voice-isolator'
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                      }`}
                  >
                    Isolator
                  </button>
                </div>

                {/* Voice Selector */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Voice</label>
                  <button
                    onClick={() => setShowVoiceSelector(!showVoiceSelector)}
                    className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500" />
                      <span className="font-medium">{selectedVoice.name}</span>
                    </div>
                    <span className="text-white/50">›</span>
                  </button>

                  {showVoiceSelector && (
                    <div className="mt-2 max-h-64 overflow-y-auto bg-white/5 border border-white/10 rounded-lg">
                      {ELEVENLABS_VOICES.map((voice) => (
                        <button
                          key={voice.id}
                          onClick={() => {
                            setSelectedVoice(voice);
                            setShowVoiceSelector(false);
                          }}
                          className="w-full px-4 py-3 hover:bg-white/10 flex items-center gap-3 transition-all"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500" />
                          <span className="text-sm">{voice.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Model Selector */}
                <div>
                  <label className="block text-sm font-semibold mb-3">Model</label>
                  <button className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-between transition-all">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-white/10 rounded text-xs font-medium">V2</span>
                      <span className="font-medium">Eleven Multilingual v2</span>
                    </div>
                    <span className="text-white/50">›</span>
                  </button>
                </div>

                {/* Speed Control */}
                {activeTab === 'tts' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-semibold">Speed</label>
                      <div className="flex items-center gap-4 text-sm text-white/50">
                        <span>Slower</span>
                        <span>Faster</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={speed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="w-full accent-white"
                    />
                  </div>
                )}

                {/* Stability Control */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold">Stability</label>
                    <div className="flex items-center gap-4 text-sm text-white/50">
                      <span>More variable</span>
                      <span>More stable</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={stability}
                    onChange={(e) => setStability(parseFloat(e.target.value))}
                    className="w-full accent-white"
                  />
                </div>

                {/* Similarity Control */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold">Similarity</label>
                    <div className="flex items-center gap-4 text-sm text-white/50">
                      <span>Low</span>
                      <span>High</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={similarity}
                    onChange={(e) => setSimilarity(parseFloat(e.target.value))}
                    className="w-full accent-white"
                  />
                </div>

                {/* Style Exaggeration */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold">Style Exaggeration</label>
                    <div className="flex items-center gap-4 text-sm text-white/50">
                      <span>None</span>
                      <span>Exaggerated</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={styleExaggeration}
                    onChange={(e) => setStyleExaggeration(parseFloat(e.target.value))}
                    className="w-full accent-white"
                  />
                </div>

                {/* Remove Background Noise */}
                {activeTab === 'voice-changer' && (
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <span className="text-sm font-medium">Remove Background Noise</span>
                    <button
                      onClick={() => setRemoveBackground(!removeBackground)}
                      className={`w-12 h-6 rounded-full transition-colors ${removeBackground ? 'bg-white/30' : 'bg-white/10'
                        }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white mt-1 transition-transform ${removeBackground ? 'ml-7' : 'ml-1'
                        }`} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* History View */
              <div className="space-y-3">
                {generatedAudios.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/50 text-sm">No audio generated yet</p>
                  </div>
                ) : (
                  generatedAudios.map((audio, index) => (
                    <div
                      key={index}
                      className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-white line-clamp-1">{audio.title}</h4>
                          <p className="text-xs text-white/50 mt-1">
                            {audio.timestamp.toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDownload(audio)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-all"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>

                      <audio
                        id={`audio-player-${index}`}
                        src={audio.url}
                        onEnded={() => setCurrentlyPlaying(null)}
                        className="hidden"
                      />

                      <button
                        onClick={() => togglePlay(index)}
                        className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center gap-2 transition-all"
                      >
                        {currentlyPlaying === index ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                        <span className="text-sm">
                          {currentlyPlaying === index ? 'Pause' : 'Play'}
                        </span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
