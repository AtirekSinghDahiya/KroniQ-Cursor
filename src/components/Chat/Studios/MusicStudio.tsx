import React, { useState, useEffect } from 'react';
import { Music, X, Loader, Download, Play, Pause, Sparkles, Clock } from 'lucide-react';
import { generateMusicWithBeatoven } from '../../../lib/beatovenMusicService';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { createProject, addMessage } from '../../../lib/chatService';
import { deductTokensForRequest } from '../../../lib/tokenService';
import { getModelCost } from '../../../lib/modelTokenPricing';
import { supabase } from '../../../lib/supabase';
import { useStudioMode } from '../../../contexts/StudioModeContext';
import { createStudioProject, updateProjectState, loadProject, generateStudioProjectName } from '../../../lib/studioProjectService';
import { executeGeneration } from '../../../lib/unifiedGenerationService';
import { StudioMessageView, type StudioMessage } from './StudioMessageView';
import { saveStudioGeneration, loadStudioMessages, formatMusicMessage } from '../../../lib/studioMessagesService';

interface MusicStudioProps {
  onClose: () => void;
  projectId?: string;
}

interface GeneratedSong {
  audioUrl: string;
  title: string;
  genre: string;
  duration: string;
  projectId: string;
}

export const MusicStudio: React.FC<MusicStudioProps> = ({ onClose, projectId: initialProjectId }) => {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [description, setDescription] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [duration, setDuration] = useState<'short' | 'medium' | 'long'>('medium');
  const [instrumental, setInstrumental] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { projectId: activeProjectId } = useStudioMode();
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(initialProjectId || activeProjectId || null);
  const [generatedSongs, setGeneratedSongs] = useState<GeneratedSong[]>([]);
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<number | null>(null);
  const [progress, setProgress] = useState('');
  const [tokenBalance, setTokenBalance] = useState(0);

  const genres = [
    'Pop',
    'Rock',
    'Hip-Hop',
    'R&B',
    'Electronic',
    'Jazz',
    'Classical',
    'Country',
    'Folk',
    'Blues',
    'Metal',
    'Indie'
  ];

  const durationOptions = {
    short: { label: '30s', value: 30 },
    medium: { label: '1min', value: 60 },
    long: { label: '2min', value: 120 }
  };

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
        setDescription(state.description || '');
        setSelectedGenre(state.selectedGenre || '');
        setDuration(state.duration || 'medium');
        setInstrumental(state.instrumental || false);
        setGeneratedSongs(state.generatedSongs || []);
        console.log('✅ Loaded existing music project:', projectId);
      }
    } catch (error) {
      console.error('Error loading music project:', error);
    }
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

  const saveProjectState = async () => {
    if (!user?.uid) return null;

    const sessionState = {
      description,
      selectedGenre,
      duration,
      instrumental,
      generatedSongs
    };

    try {
      if (currentProjectId) {
        await updateProjectState({
          projectId: currentProjectId,
          sessionState
        });
        console.log('✅ Music project state updated');
        return currentProjectId;
      } else {
        const projectName = generateStudioProjectName('music', description);
        const result = await createStudioProject({
          userId: user.uid,
          studioType: 'music',
          name: projectName,
          description: description,
          model: 'suno',
          sessionState
        });

        if (result.success && result.projectId) {
          setCurrentProjectId(result.projectId);
          console.log('✅ New music project created:', result.projectId);
          showToast('success', 'Project Saved', 'Your music project has been saved');
          return result.projectId;
        }
      }
    } catch (error) {
      console.error('Error saving music project:', error);
    }
    return null;
  };


  const handleCreate = async () => {
    if (!description.trim()) {
      showToast('error', 'Empty Description', 'Please describe the music you want to create');
      return;
    }

    if (!user?.uid) {
      showToast('error', 'Authentication Required', 'Please log in to generate music');
      return;
    }

    setIsGenerating(true);
    setProgress('Initializing music generation...');

    try {
      let projectId = activeProjectId;

      if (!projectId) {
        setProgress('Creating music project...');
        const newProject = await createProject(
          `Music: ${description.substring(0, 30)}${description.length > 30 ? '...' : ''}`,
          'music',
          description
        );
        projectId = newProject.id;
      }

      await addMessage(projectId, 'user', description);

      setProgress('Starting music generation with Beatoven AI...');

      // Build Beatoven prompt with genre and style
      let beatovenPrompt = description;
      if (selectedGenre) {
        beatovenPrompt += ` in ${selectedGenre} style`;
      }
      if (instrumental) {
        beatovenPrompt += ', instrumental version';
      }
      beatovenPrompt += `, approximately ${durationOptions[duration].value} seconds`;

      const audioUrl = await generateMusicWithBeatoven(beatovenPrompt, setProgress);

      const modelCost = getModelCost('beatoven-ai');
      const tokensToDeduct = modelCost.costPerMessage;

      setProgress('Deducting tokens...');
      await deductTokensForRequest(
        user.uid,
        'beatoven-ai',
        'beatoven',
        tokensToDeduct,
        'song'
      );

      await loadTokenBalance();

      const songData: GeneratedSong = {
        audioUrl,
        title: description.substring(0, 50) + (description.length > 50 ? '...' : ''),
        genre: selectedGenre || 'Music',
        duration: durationOptions[duration].label,
        projectId
      };

      await addMessage(projectId, 'assistant', JSON.stringify({
        type: 'music',
        audioUrl,
        title: songData.title,
        genre: songData.genre,
        duration: songData.duration
      }));

      setGeneratedSongs(prev => [songData, ...prev]);
      showToast('success', 'Music Generated!', `Deducted ${tokensToDeduct.toLocaleString()} tokens`);
      await saveProjectState();
      setDescription('');
      setProgress('');
    } catch (error: any) {
      console.error('Music generation error:', error);
      showToast('error', 'Generation Failed', error.message || 'Failed to generate music');
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  const handleDownload = (song: GeneratedSong) => {
    const link = document.createElement('a');
    link.href = song.audioUrl;
    link.download = `${song.title.replace(/[^a-z0-9]/gi, '_')}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Downloaded!', 'Audio file downloaded');
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


  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
        {/* Top Header */}
        <div className="border-b border-white/10 bg-black">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <Music className="w-6 h-6" />
              <h1 className="text-xl font-bold">Music Studio</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-semibold">{tokenBalance.toLocaleString()}</span>
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 active:scale-95 rounded-lg transition-all"
                title="Close Studio"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Controls Sidebar */}
          <div className="w-96 border-r border-white/10 flex flex-col bg-black">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">Song Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., An upbeat pop song about summer adventures"
                  className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 focus:border-white/30 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none resize-none transition-colors"
                  disabled={isGenerating}
                />
              </div>

              {/* Genre Selection */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">Genre</label>
                <div className="grid grid-cols-2 gap-2">
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenre(genre === selectedGenre ? '' : genre)}
                      className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                        selectedGenre === genre
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                      }`}
                      disabled={isGenerating}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold text-white mb-3">Duration</label>
                <div className="flex gap-2">
                  {Object.entries(durationOptions).map(([key, { label }]) => (
                    <button
                      key={key}
                      onClick={() => setDuration(key as 'short' | 'medium' | 'long')}
                      className={`flex-1 px-4 py-2 text-sm rounded-lg border transition-all flex items-center justify-center gap-2 ${
                        duration === key
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                      }`}
                      disabled={isGenerating}
                    >
                      <Clock className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instrumental Toggle */}
              <div>
                <button
                  onClick={() => setInstrumental(!instrumental)}
                  className={`w-full px-4 py-3 rounded-lg border transition-all ${
                    instrumental
                      ? 'bg-white/10 border-white/20 text-white'
                      : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white'
                  }`}
                  disabled={isGenerating}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Instrumental</span>
                    <div className={`w-10 h-6 rounded-full transition-colors ${
                      instrumental ? 'bg-white/30' : 'bg-white/10'
                    }`}>
                      <div className={`w-4 h-4 rounded-full bg-white mt-1 transition-transform ${
                        instrumental ? 'ml-5' : 'ml-1'
                      }`} />
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Generate Button */}
            <div className="p-6 border-t border-white/10">
              <button
                onClick={handleCreate}
                disabled={isGenerating || !description.trim()}
                className="w-full py-3 px-6 bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Music className="w-5 h-5" />
                    <span>Generate Music</span>
                  </>
                )}
              </button>

              {isGenerating && progress && (
                <p className="text-xs text-white/40 text-center mt-3">{progress}</p>
              )}
            </div>
          </div>

          {/* Songs Display Area */}
          <div className="flex-1 overflow-y-auto bg-black p-6">
            {generatedSongs.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Music className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <p className="text-white/50 mb-2">No songs generated yet</p>
                  <p className="text-white/30 text-sm">Create your first song to get started</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedSongs.map((song, index) => (
                  <div
                    key={index}
                    className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1 line-clamp-2">{song.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <span>{song.genre}</span>
                          <span>•</span>
                          <span>{song.duration}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(song)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-all"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>

                    <audio
                      id={`audio-player-${index}`}
                      src={song.audioUrl}
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
  );
};
