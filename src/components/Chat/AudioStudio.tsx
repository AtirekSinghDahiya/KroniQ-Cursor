import React, { useState, useEffect } from 'react';
import { Mic, Volume2, X, Loader, Sparkles } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { executeGeneration, getGenerationLimitMessage } from '../../lib/unifiedGenerationService';
import { checkGenerationLimit } from '../../lib/generationLimitsService';
import { supabase } from '../../lib/supabase';

interface AudioStudioProps {
  onClose?: () => void;
}

type AudioService = 'elevenlabs' | 'gemini';

export const AudioStudio: React.FC<AudioStudioProps> = ({ onClose }) => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [selectedService, setSelectedService] = useState<AudioService>('elevenlabs');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<{ audioUrl: string; title: string; tags?: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState('');
  const [limitInfo, setLimitInfo] = useState<string>('');
  const [tokenBalance, setTokenBalance] = useState(0);

  const services = [
    {
      id: 'elevenlabs' as AudioService,
      label: 'ElevenLabs TTS',
      icon: Mic,
      description: 'Professional voice synthesis with 10 voice options',
    },
    {
      id: 'gemini' as AudioService,
      label: 'Gemini TTS',
      icon: Volume2,
      description: "Google's text-to-speech service",
    },
  ];

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.uid) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('tokens_balance')
      .eq('id', user.uid)
      .maybeSingle();

    if (profile) {
      setTokenBalance(profile.tokens_balance || 0);
    }

    const generationType = 'voiceover';
    const limit = await checkGenerationLimit(user.uid, generationType);
    setLimitInfo(getGenerationLimitMessage(generationType, limit.isPaid, limit.current, limit.limit));
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      showToast('error', 'Empty Description', 'Please describe what you want to create');
      return;
    }

    if (!user?.uid) {
      showToast('error', 'Authentication Required', 'Please log in to generate audio');
      return;
    }

    setIsGenerating(true);
    setGeneratedAudio(null);

    showToast('info', 'Coming Soon', `${selectedService} integration will be available soon`);

    setIsGenerating(false);
    setProgress('');
  };

  const handleDownload = () => {
    if (generatedAudio) {
      const link = document.createElement('a');
      link.href = generatedAudio.audioUrl;
      link.download = `${generatedAudio.title.replace(/[^a-z0-9]/gi, '_')}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('success', 'Downloaded!', 'Audio file downloaded');
    }
  };

  const togglePlay = () => {
    const audio = document.getElementById('audio-player') as HTMLAudioElement;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Top Header */}
      <div className="relative border-b border-white/10 bg-black">
        <div className="flex items-center justify-between px-6 sm:px-8 py-5 sm:py-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/20">
              <Mic className="w-6 h-6 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white">Voice Studio</h1>
                <span className="hidden sm:inline-flex px-2.5 py-1 text-xs font-semibold bg-white/10 text-white border border-white/20 rounded-full">
                  AI Powered
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/50">{limitInfo}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex items-center gap-2.5 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white/50 leading-none mb-1">Tokens</span>
                <span className="text-sm font-bold text-white leading-none">{tokenBalance.toLocaleString()}</span>
              </div>
            </div>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-white/10 active:scale-95 rounded-lg transition-all"
                title="Close Studio"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Service Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {services.map((service) => {
              const Icon = service.icon;
              const isSelected = selectedService === service.id;

              return (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={`p-5 rounded-xl border-2 transition-all text-left ${
                    isSelected
                      ? 'bg-white/10 border-white/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-white/10'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{service.label}</h3>
                      <p className="text-xs text-white/50">{service.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Input Section */}
          {!generatedAudio ? (
            <div className="max-w-3xl mx-auto">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 sm:p-8 mb-6">
                <label className="block text-sm font-semibold text-white mb-3">
                  Voice Script *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
"Enter the text you want to convert to speech"
                  }
                  className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 focus:border-white/30 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none resize-none transition-colors"
                  disabled={isGenerating}
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-white/40">{description.length}/3000</span>
                </div>
              </div>


              {/* Generate Button */}
              <div className="max-w-3xl mx-auto">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !description.trim()}
                  className="w-full py-4 px-6 bg-white hover:bg-white/90 disabled:bg-white/10 text-black font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>Generate Voice</span>
                    </>
                  )}
                </button>
              </div>

              {isGenerating && progress && (
                <div className="max-w-3xl mx-auto mt-4 text-center">
                  <p className="text-sm text-white/50">{progress}</p>
                </div>
              )}

              {/* Tips Section */}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/5 border border-white/10 rounded-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{generatedAudio.title}</h3>
                    {generatedAudio.tags && <p className="text-sm text-white/50">{generatedAudio.tags}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDownload}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-all"
                      title="Download"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setGeneratedAudio(null)}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-all"
                      title="Create New"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-6 mb-4">
                  <audio
                    id="audio-player"
                    src={generatedAudio.audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full"
                    controls
                  />
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={togglePlay}
                    className="p-4 bg-white hover:bg-white/90 text-black rounded-full transition-all"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
