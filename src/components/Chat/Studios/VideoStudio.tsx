import React, { useState, useEffect, useRef } from 'react';
import {
    Video,
    X,
    Loader,
    Download,
    Play,
    Pause,
    Sparkles,
    History,
    Plus,
    Clock,
    Wand2
} from 'lucide-react';
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
import { generateKieVideo } from '../../../lib/kieAIService';
import { StudioHeader, GenerationLimitData } from '../../Studio/StudioHeader';
import { checkGenerationLimit } from '../../../lib/generationLimitsService';
import { getGenerationLimitMessage } from '../../../lib/unifiedGenerationService';

interface VideoStudioProps {
    onClose: () => void;
    projectId?: string;
}

interface GeneratedVideo {
    videoUrl: string;
    prompt: string;
    model: string;
    createdAt: Date;
}

// Video models from screenshot
const VIDEO_MODELS = [
    { id: 'veo3_fast', name: 'Veo 3.1 Fast', description: 'Google Veo 3.1 fast generation', speed: 'Fast' },
    { id: 'veo3', name: 'Veo 3.1 Quality', description: 'Highest quality Google Veo', speed: 'Premium' },
    { id: 'sora-2', name: 'Sora 2', description: 'OpenAI Sora cinematic video', speed: 'Premium' },
    { id: 'wan', name: 'Wan 2.5', description: 'Creative video generation', speed: 'Fast' },
    { id: 'kling', name: 'Kling 2.6', description: 'Realistic video with audio', speed: 'Premium' },
    { id: 'grok', name: 'Grok Video', description: 'Grok-powered video generation', speed: 'Fast' },
    { id: 'runway-gen3', name: 'Runway Gen-3', description: 'Professional video generation', speed: 'Premium' }
];

const BUTTON_GRADIENT = 'bg-gradient-to-r from-pink-500 to-purple-600';

export const VideoStudio: React.FC<VideoStudioProps> = ({ onClose, projectId: initialProjectId }) => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const { projectId: activeProjectId } = useStudioMode();
    const videoRef = useRef<HTMLVideoElement>(null);

    // State
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState('veo3_fast');
    const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
    const [duration, setDuration] = useState<5 | 8 | 10>(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState('');
    const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [tokenBalance, setTokenBalance] = useState(0);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(initialProjectId || activeProjectId || null);
    const [historyProjects, setHistoryProjects] = useState<StudioProject[]>([]);
    const [limitInfo, setLimitInfo] = useState('');
    const [generationLimit, setGenerationLimit] = useState<GenerationLimitData | undefined>(undefined);

    const STUDIO_COLOR = '#F97316'; // Orange for video

    // Load saved video projects
    const refreshProjects = async () => {
        if (!user?.uid) return;
        try {
            const projectsResult = await getUserProjects(user.uid, 'video');
            if (projectsResult.success && projectsResult.projects) {
                setHistoryProjects(projectsResult.projects);
            }
        } catch (error) {
            console.error('Error loading video projects:', error);
        }
    };

    useEffect(() => {
        if (user?.uid) {
            loadTokenBalance();
            loadLimitInfo();
            refreshProjects();
        }
    }, [user]);

    const loadLimitInfo = async () => {
        if (!user?.uid) return;
        const limit = await checkGenerationLimit(user.uid, 'video');
        setLimitInfo(getGenerationLimitMessage('video', limit.isPaid, limit.current, limit.limit));
        setGenerationLimit({ current: limit.current, limit: limit.limit, isPaid: limit.isPaid });
    };

    useEffect(() => {
        if (initialProjectId && user?.uid) {
            loadExistingProject(initialProjectId);
        }
    }, [initialProjectId, user]);

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
                setPrompt(state.prompt || '');
                setSelectedModel(state.selectedModel || 'veo3_fast');
                setAspectRatio(state.aspectRatio || '16:9');
                setDuration(state.duration || 5);
                if (state.generatedVideo) {
                    setGeneratedVideo(state.generatedVideo);
                }
            }
        } catch (error) {
            console.error('Error loading video project:', error);
        }
    };

    const saveProjectState = async (overrides: any = {}) => {
        if (!user?.uid) return null;

        const sessionState = {
            prompt,
            selectedModel,
            aspectRatio,
            duration,
            generatedVideo,
            ...overrides
        };

        try {
            if (currentProjectId) {
                await updateProjectState({ projectId: currentProjectId, sessionState });
                return currentProjectId;
            } else {
                const projectName = generateStudioProjectName('video', prompt);
                const result = await createStudioProject({
                    userId: user.uid,
                    studioType: 'video',
                    name: projectName,
                    description: prompt,
                    model: selectedModel,
                    sessionState
                });

                if (result.success && result.projectId) {
                    setCurrentProjectId(result.projectId);
                    return result.projectId;
                }
            }
        } catch (error) {
            console.error('Error saving video project:', error);
        }
        return null;
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            showToast('error', 'Empty Prompt', 'Please describe the video you want to create');
            return;
        }

        if (!user?.uid) {
            showToast('error', 'Authentication Required', 'Please log in to generate videos');
            return;
        }

        setIsGenerating(true);
        setProgress('Initializing video generation...');
        setGeneratedVideo(null);

        try {
            setProgress(`Generating with ${VIDEO_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}...`);

            const videoUrl = await generateKieVideo(prompt, selectedModel);

            const video: GeneratedVideo = {
                videoUrl,
                prompt,
                model: selectedModel,
                createdAt: new Date()
            };
            setGeneratedVideo(video);

            // Deduct tokens
            const modelCost = getModelCost(selectedModel);
            const tokensToDeduct = modelCost?.tokensPerMessage || 15000; // Use actual token token count

            // Use Firebase for token deduction and usage tracking
            const { deductTokens, incrementUsage } = await import('../../../lib/firestoreService');
            await deductTokens(user.uid, tokensToDeduct);
            await incrementUsage(user.uid, 'video', 1);

            await loadTokenBalance();
            await loadLimitInfo();

            // Save project
            await saveProjectState({ generatedVideo: video });
            await refreshProjects();

            showToast('success', 'Video Generated!', `Deducted ${tokensToDeduct.toLocaleString()} tokens`);
            setProgress('');
        } catch (error: any) {
            console.error('Video generation error:', error);
            showToast('error', 'Generation Failed', error.message || 'Failed to generate video');
        } finally {
            setIsGenerating(false);
            setProgress('');
        }
    };

    const handleDownload = () => {
        if (!generatedVideo) return;
        const link = document.createElement('a');
        link.href = generatedVideo.videoUrl;
        link.download = `kroniq_video_${Date.now()}.mp4`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('success', 'Downloaded!', 'Video file downloaded');
    };

    const togglePlayPause = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const selectedModelInfo = VIDEO_MODELS.find(m => m.id === selectedModel);

    return (
        <div className="h-full flex flex-col bg-black overflow-hidden">
            {/* Header */}
            <StudioHeader
                icon={Video}
                title="Video Studio"
                subtitle="AI-Powered Video Generation"
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
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[120px]" />
                </div>

                {/* Left Sidebar - Library */}
                <div className="hidden lg:flex lg:w-80 border-r border-white/5 flex-col bg-black/40 backdrop-blur-xl h-full z-10">
                    <div className="p-4 border-b border-white/5">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-white/80 mb-4">
                            <History className="w-4 h-4 text-orange-400" /> Library
                        </h2>
                        <button
                            onClick={() => {
                                setPrompt('');
                                setGeneratedVideo(null);
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
                                <Video className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No saved videos yet</p>
                            </div>
                        ) : (
                            historyProjects.map(proj => (
                                <div
                                    key={proj.id}
                                    onClick={() => loadExistingProject(proj.id)}
                                    className={`group p-3 rounded-xl cursor-pointer transition-all border ${currentProjectId === proj.id
                                        ? 'bg-white/10 border-orange-500/50 shadow-inner'
                                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium text-sm text-white truncate w-full pr-2">
                                            {proj.name.replace('Video: ', '')}
                                        </span>
                                        {currentProjectId === proj.id && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse mt-1.5" />
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

                {/* Center - Video Preview */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 z-10 relative">
                    <div className="w-full max-w-3xl">
                        {isGenerating ? (
                            <div className="flex flex-col items-center justify-center min-h-[400px]">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full animate-pulse" />
                                    <Loader className="w-16 h-16 animate-spin text-orange-500 relative z-10" />
                                </div>
                                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-400">
                                    Generating Video...
                                </h3>
                                <p className="text-white/40 text-sm mt-2">{progress}</p>
                            </div>
                        ) : generatedVideo ? (
                            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl">
                                <video
                                    ref={videoRef}
                                    src={generatedVideo.videoUrl}
                                    className="w-full aspect-video"
                                    controls
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onEnded={() => setIsPlaying(false)}
                                />
                                <div className="p-4 flex items-center justify-between border-t border-white/10">
                                    <div>
                                        <p className="text-sm font-medium text-white truncate max-w-md">{generatedVideo.prompt}</p>
                                        <p className="text-xs text-white/40">{selectedModelInfo?.name}</p>
                                    </div>
                                    <button
                                        onClick={handleDownload}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                                    >
                                        <Download className="w-4 h-4" />
                                        <span className="text-sm">Download</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-orange-500/20 to-pink-500/20 flex items-center justify-center mb-6">
                                    <Video className="w-16 h-16 text-orange-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">AI Video Studio</h3>
                                <p className="text-white/40 max-w-md">
                                    Create stunning videos with AI. Select a model, describe your video, and click generate.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar - Controls */}
                <div className="w-full lg:w-[380px] border-l border-white/5 flex flex-col bg-black/40 backdrop-blur-xl z-10 overflow-y-auto">
                    {/* Model Selection */}
                    <div className="p-4 border-b border-white/5">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Model Selection</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {VIDEO_MODELS.map(model => (
                                <button
                                    key={model.id}
                                    onClick={() => setSelectedModel(model.id)}
                                    disabled={isGenerating}
                                    className={`p-3 rounded-xl border text-left transition-all ${selectedModel === model.id
                                        ? 'bg-orange-500/20 border-orange-500/50'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Video className="w-4 h-4 text-white/60" />
                                        <span className="text-sm font-medium text-white">{model.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${model.speed === 'Premium' ? 'bg-purple-500/20 text-purple-300' : 'bg-green-500/20 text-green-300'
                                            }`}>
                                            {model.speed}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Prompt */}
                    <div className="p-4 border-b border-white/5 flex-1">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider">Prompt</h3>
                            <span className="text-xs text-white/30">{prompt.length} / 1000</span>
                        </div>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Describe the video you want to create..."
                            className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 focus:border-orange-500/50 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none resize-none transition-all"
                            disabled={isGenerating}
                            maxLength={1000}
                        />
                    </div>

                    {/* Settings */}
                    <div className="p-4 border-b border-white/5">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Settings</h3>

                        {/* Aspect Ratio */}
                        <div className="mb-4">
                            <label className="text-xs text-white/50 mb-2 block">Aspect Ratio</label>
                            <div className="flex gap-2">
                                {(['16:9', '9:16', '1:1'] as const).map(ar => (
                                    <button
                                        key={ar}
                                        onClick={() => setAspectRatio(ar)}
                                        disabled={isGenerating}
                                        className={`flex-1 py-2 rounded-lg text-sm transition-all ${aspectRatio === ar
                                            ? 'bg-orange-500/20 border border-orange-500/50 text-white'
                                            : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                                            }`}
                                    >
                                        {ar}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="text-xs text-white/50 mb-2 block">Duration</label>
                            <div className="flex gap-2">
                                {([5, 8, 10] as const).map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDuration(d)}
                                        disabled={isGenerating}
                                        className={`flex-1 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-all ${duration === d
                                            ? 'bg-orange-500/20 border border-orange-500/50 text-white'
                                            : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                                            }`}
                                    >
                                        <Clock className="w-3 h-3" />
                                        {d}s
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="p-4 mt-auto">
                        <div className="flex items-center justify-between text-xs text-white/40 mb-3">
                            <span>Est. Cost: ~15,000 tokens</span>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt.trim()}
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
                                    <span>Generate Video</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
