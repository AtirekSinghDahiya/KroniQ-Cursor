import React, { useState, useEffect, useRef } from 'react';
import {
    Music,
    Loader,
    Download,
    Play,
    Pause,
    History,
    Plus,
    Wand2,
    Volume2
} from 'lucide-react';
import { generateWithSuno } from '../../../lib/sunoMusicService';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
// import { deductTokensForRequest } from '../../../lib/tokenService';
import { getModelCost } from '../../../lib/modelTokenPricing';
import { getUserProfile } from '../../../lib/firestoreService';
import { useStudioMode } from '../../../contexts/StudioModeContext';
import {
    createStudioProject,
    updateProjectState,
    loadProject,
    generateStudioProjectName,
    getUserProjects,
    StudioProject
} from '../../../lib/studioProjectService';
import { StudioHeader, GenerationLimitData } from '../../Studio/StudioHeader';
import { checkGenerationLimit } from '../../../lib/generationLimitsService';
import { getGenerationLimitMessage } from '../../../lib/unifiedGenerationService';

interface MusicStudioProps {
    onClose: () => void;
    projectId?: string;
}

interface GeneratedSong {
    audioUrl: string;
    title: string;
    genre: string;
    createdAt: Date;
}

const GENRES = [
    'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'EDM',
    'Jazz', 'Classical', 'Country', 'Folk', 'Blues', 'Metal',
    'Indie', 'Soul', 'Reggae', 'Ambient'
];

const BUTTON_GRADIENT = 'bg-gradient-to-r from-pink-500 to-purple-600';

export const MusicStudio: React.FC<MusicStudioProps> = ({ onClose, projectId: initialProjectId }) => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const { projectId: activeProjectId } = useStudioMode();
    const audioRef = useRef<HTMLAudioElement>(null);

    // State
    const [description, setDescription] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('');
    const [instrumental, setInstrumental] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState('');
    const [generatedSong, setGeneratedSong] = useState<GeneratedSong | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [tokenBalance, setTokenBalance] = useState(0);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(initialProjectId || activeProjectId || null);
    const [historyProjects, setHistoryProjects] = useState<StudioProject[]>([]);
    const [limitInfo, setLimitInfo] = useState('');
    const [generationLimit, setGenerationLimit] = useState<GenerationLimitData | undefined>(undefined);

    const STUDIO_COLOR = '#9333EA'; // Purple for music

    // Load saved music projects
    const refreshProjects = async () => {
        if (!user?.uid) return;
        try {
            const projectsResult = await getUserProjects(user.uid, 'music');
            if (projectsResult.success && projectsResult.projects) {
                setHistoryProjects(projectsResult.projects);
            }
        } catch (error) {
            console.error('Error loading music projects:', error);
        }
    };

    const loadLimitInfo = async () => {
        if (!user?.uid) return;
        const limit = await checkGenerationLimit(user.uid, 'song');
        setLimitInfo(getGenerationLimitMessage('song', limit.isPaid, limit.current, limit.limit));
        setGenerationLimit({ current: limit.current, limit: limit.limit, isPaid: limit.isPaid });
    };

    useEffect(() => {
        if (user?.uid) {
            loadTokenBalance();
            loadLimitInfo();
            refreshProjects();
        }
    }, [user]);

    useEffect(() => {
        if (initialProjectId && user?.uid) {
            loadExistingProject(initialProjectId);
        }
    }, [initialProjectId, user]);

    // Audio event listeners
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
    }, [generatedSong]);

    const loadTokenBalance = async () => {
        if (!user?.uid) return;
        const profile = await getUserProfile(user.uid);
        if (profile) {
            const remaining = profile.tokensLimit - profile.tokensUsed;
            setTokenBalance(remaining > 0 ? remaining : 0);
        }
    };

    const loadExistingProject = async (projectId: string) => {
        try {
            const result = await loadProject(projectId);
            if (result.success && result.project) {
                setCurrentProjectId(projectId);
                const state = result.project.session_state || {};
                setDescription(state.description || '');
                setSelectedGenre(state.selectedGenre || '');
                setInstrumental(state.instrumental || false);
                if (state.generatedSong) {
                    setGeneratedSong(state.generatedSong);
                }
            }
        } catch (error) {
            console.error('Error loading music project:', error);
        }
    };

    const saveProjectState = async (overrides: any = {}) => {
        if (!user?.uid) return null;

        const sessionState = {
            description,
            selectedGenre,
            instrumental,
            generatedSong,
            ...overrides
        };

        try {
            if (currentProjectId) {
                await updateProjectState({ projectId: currentProjectId, sessionState });
                return currentProjectId;
            } else {
                const projectName = generateStudioProjectName('music', description);
                const result = await createStudioProject({
                    userId: user.uid,
                    studioType: 'music',
                    name: projectName,
                    description: description,
                    model: 'suno-ai',
                    sessionState
                });

                if (result.success && result.projectId) {
                    setCurrentProjectId(result.projectId);
                    return result.projectId;
                }
            }
        } catch (error) {
            console.error('Error saving music project:', error);
        }
        return null;
    };

    const handleGenerate = async () => {
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
        setGeneratedSong(null);

        try {
            setProgress('Generating with Suno AI...');

            const audioUrl = await generateWithSuno({
                prompt: description,
                style: selectedGenre || 'Pop',
                makeInstrumental: instrumental,
                model: 'V3_5'
            }, setProgress);

            const song: GeneratedSong = {
                audioUrl,
                title: description.substring(0, 50) + (description.length > 50 ? '...' : ''),
                genre: selectedGenre || 'Music',
                createdAt: new Date()
            };
            setGeneratedSong(song);

            // Deduct tokens
            const modelCost = getModelCost('suno-ai');
            const tokensToDeduct = modelCost?.tokensPerMessage || 50000; // Use actual token count

            // Use Firebase for token deduction and usage tracking
            const { deductTokens, incrementUsage } = await import('../../../lib/firestoreService');
            await deductTokens(user.uid, tokensToDeduct);
            await incrementUsage(user.uid, 'music', 1);

            await loadTokenBalance();
            await loadLimitInfo();

            // Save project
            await saveProjectState({ generatedSong: song });
            await refreshProjects();

            showToast('success', 'Music Generated!', `Deducted ${tokensToDeduct.toLocaleString()} tokens`);
            setProgress('');
        } catch (error: any) {
            console.error('Music generation error:', error);
            showToast('error', 'Generation Failed', error.message || 'Failed to generate music');
        } finally {
            setIsGenerating(false);
            setProgress('');
        }
    };

    const handleDownload = () => {
        if (!generatedSong) return;
        const link = document.createElement('a');
        link.href = generatedSong.audioUrl;
        link.download = `kroniq_music_${Date.now()}.mp3`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('success', 'Downloaded!', 'Music file downloaded');
    };

    const togglePlayPause = () => {
        if (!audioRef.current || !generatedSong) return;
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="h-full flex flex-col bg-black overflow-hidden">
            {/* Header */}
            <StudioHeader
                icon={Music}
                title="Music Studio"
                subtitle="AI-Powered Music Generation"
                color={STUDIO_COLOR}
                limitInfo={limitInfo}
                generationLimit={generationLimit}
                tokenBalance={tokenBalance}
                onClose={onClose}
            />

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Gradient Background */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[120px]" />
                </div>

                {/* Left Sidebar - Library */}
                <div className="hidden lg:flex lg:w-80 border-r border-white/5 flex-col bg-black/40 backdrop-blur-xl h-full z-10">
                    <div className="p-4 border-b border-white/5">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-white/80 mb-4">
                            <History className="w-4 h-4 text-purple-400" /> Library
                        </h2>
                        <button
                            onClick={() => {
                                setDescription('');
                                setSelectedGenre('');
                                setGeneratedSong(null);
                                setCurrentProjectId(null);
                            }}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-3 ${BUTTON_GRADIENT} text-white font-medium rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]`}
                        >
                            <Plus className="w-4 h-4" /> New Project
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {historyProjects.length === 0 ? (
                            <div className="text-center py-12 text-white/20">
                                <Music className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No saved songs yet</p>
                            </div>
                        ) : (
                            historyProjects.map(proj => (
                                <div
                                    key={proj.id}
                                    onClick={() => loadExistingProject(proj.id)}
                                    className={`group p-3 rounded-xl cursor-pointer transition-all border ${currentProjectId === proj.id
                                        ? 'bg-white/10 border-purple-500/50 shadow-inner'
                                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium text-sm text-white truncate w-full pr-2">
                                            {proj.name.replace('Music: ', '')}
                                        </span>
                                        {currentProjectId === proj.id && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse mt-1.5" />
                                        )}
                                    </div>
                                    <div className="text-[10px] text-white/40">
                                        {new Date(proj.updatedAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Center - Audio Player / Visualizer */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 z-10 relative">
                    <div className="w-full max-w-2xl">
                        {isGenerating ? (
                            <div className="flex flex-col items-center justify-center min-h-[400px]">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse" />
                                    <Loader className="w-16 h-16 animate-spin text-purple-500 relative z-10" />
                                </div>
                                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                                    Generating Music...
                                </h3>
                                <p className="text-white/40 text-sm mt-2">{progress}</p>
                            </div>
                        ) : generatedSong ? (
                            <div className="p-8 pb-10 rounded-[32px] border border-white/10 bg-gradient-to-b from-white/10 to-black/40 backdrop-blur-2xl shadow-2xl overflow-hidden">
                                <audio ref={audioRef} src={generatedSong.audioUrl} className="hidden" />

                                {/* Visualizer Bars */}
                                <div className="relative z-10 mb-8 h-32 flex items-center justify-center gap-1.5">
                                    {Array.from({ length: 30 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-2 rounded-full bg-gradient-to-t from-purple-500 to-pink-500 transition-all duration-100 shadow-[0_0_10px_rgba(147,51,234,0.3)]"
                                            style={{
                                                height: isPlaying ? `${Math.max(15, Math.random() * 100)}%` : '20%',
                                                opacity: isPlaying ? 1 : 0.3
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* Progress Bar */}
                                <div className="relative z-10 mb-8 px-2">
                                    <input
                                        type="range"
                                        min="0"
                                        max={duration || 100}
                                        value={currentTime}
                                        onChange={(e) => {
                                            if (audioRef.current) audioRef.current.currentTime = Number(e.target.value);
                                        }}
                                        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                    <div className="flex justify-between text-xs text-white/40 mt-2">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{formatTime(duration)}</span>
                                    </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        onClick={togglePlayPause}
                                        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${BUTTON_GRADIENT} shadow-lg`}
                                    >
                                        {isPlaying ? <Pause className="w-7 h-7 text-white" /> : <Play className="w-7 h-7 text-white ml-1" />}
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all"
                                    >
                                        <Download className="w-5 h-5 text-white" />
                                    </button>
                                </div>

                                <div className="text-center mt-6">
                                    <p className="text-white font-medium">{generatedSong.title}</p>
                                    <p className="text-xs text-white/40">{generatedSong.genre}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
                                    <Music className="w-16 h-16 text-purple-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">AI Music Studio</h3>
                                <p className="text-white/40 max-w-md">
                                    Create stunning music with AI. Select a genre, describe your song, and click generate.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Controls */}
                <div className="w-full lg:w-[380px] border-l border-white/5 flex flex-col bg-black/40 backdrop-blur-xl z-10 overflow-y-auto">
                    {/* Description */}
                    <div className="p-4 border-b border-white/5">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">Description</h3>
                            <span className="text-xs text-white/30">{description.length} / 500</span>
                        </div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the song you want to create... e.g., 'An upbeat pop song about summer adventures'"
                            className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 focus:border-purple-500/50 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none resize-none transition-all"
                            disabled={isGenerating}
                            maxLength={500}
                        />
                    </div>

                    {/* Genre Selection */}
                    <div className="p-4 border-b border-white/5">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Genre</h3>
                        <div className="grid grid-cols-4 gap-2">
                            {GENRES.map(genre => (
                                <button
                                    key={genre}
                                    onClick={() => setSelectedGenre(genre === selectedGenre ? '' : genre)}
                                    disabled={isGenerating}
                                    className={`py-2 px-2 rounded-lg text-xs transition-all ${selectedGenre === genre
                                        ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                                        }`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Instrumental Toggle */}
                    <div className="p-4 border-b border-white/5">
                        <button
                            onClick={() => setInstrumental(!instrumental)}
                            disabled={isGenerating}
                            className={`w-full px-4 py-3 rounded-xl border transition-all ${instrumental
                                ? 'bg-purple-500/20 border-purple-500/50 text-white'
                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Volume2 className="w-4 h-4" />
                                    <span className="text-sm font-medium">Instrumental Only</span>
                                </div>
                                <div className={`w-10 h-6 rounded-full transition-colors ${instrumental ? 'bg-purple-500' : 'bg-white/10'}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white mt-1 transition-transform ${instrumental ? 'ml-5' : 'ml-1'}`} />
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Generate Button */}
                    <div className="p-4 mt-auto">
                        <div className="flex items-center justify-between text-xs text-white/40 mb-3">
                            <span>Est. Cost: ~10,000 tokens</span>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !description.trim()}
                            className={`w-full flex items-center justify-center gap-2 px-6 py-4 ${BUTTON_GRADIENT} text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100`}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    <span>Generating...</span>
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-5 h-5" />
                                    <span>Generate Music</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
