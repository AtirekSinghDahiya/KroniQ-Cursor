import React, { useState, useEffect } from 'react';
import {
    Image,
    X,
    Loader,
    Download,
    Sparkles,
    History,
    Plus,
    Wand2,
    ZoomIn
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
import { generateKieImage } from '../../../lib/kieAIService';
import { StudioHeader, GenerationLimitData } from '../../Studio/StudioHeader';
import { checkGenerationLimit } from '../../../lib/generationLimitsService';
import { getGenerationLimitMessage } from '../../../lib/unifiedGenerationService';

interface ImageStudioProps {
    onClose: () => void;
    projectId?: string;
}

interface GeneratedImage {
    imageUrl: string;
    prompt: string;
    model: string;
    createdAt: Date;
}

// Image models from screenshot
const IMAGE_MODELS = [
    { id: 'flux-kontext-pro', name: 'Flux Kontext Pro', description: 'Balanced image generation', speed: 'Premium' },
    { id: '4o-image', name: 'GPT-4o Image', description: 'OpenAI GPT-4o image generation', speed: 'Premium' },
    { id: 'google/nano-banana', name: 'Nano Banana', description: 'Google Gemini-powered generation', speed: 'Fast' },
    { id: 'google/imagen4-ultra', name: 'Imagen 4 Ultra', description: 'Ultra-realistic Google Imagen 4', speed: 'Premium' },
    { id: 'seedream/4.5', name: 'Seedream 4.5', description: 'Artistic and creative generation', speed: 'Fast' },
    { id: 'grok-imagine/text-to-image', name: 'Grok Imagine', description: 'Grok-powered image generation', speed: 'Fast' }
];

const BUTTON_GRADIENT = 'bg-gradient-to-r from-pink-500 to-purple-600';

export const ImageStudio: React.FC<ImageStudioProps> = ({ onClose, projectId: initialProjectId }) => {
    const { showToast } = useToast();
    const { user } = useAuth();
    const { projectId: activeProjectId } = useStudioMode();

    // State
    const [prompt, setPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState('flux-kontext-pro');
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState('');
    const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
    const [tokenBalance, setTokenBalance] = useState(0);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(initialProjectId || activeProjectId || null);
    const [historyProjects, setHistoryProjects] = useState<StudioProject[]>([]);
    const [limitInfo, setLimitInfo] = useState('');
    const [generationLimit, setGenerationLimit] = useState<GenerationLimitData | undefined>(undefined);
    const [showFullscreen, setShowFullscreen] = useState(false);

    const STUDIO_COLOR = '#14B8A6'; // Teal for images

    // Load saved image projects
    const refreshProjects = async () => {
        if (!user?.uid) return;
        try {
            const projectsResult = await getUserProjects(user.uid, 'image');
            if (projectsResult.success && projectsResult.projects) {
                setHistoryProjects(projectsResult.projects);
            }
        } catch (error) {
            console.error('Error loading image projects:', error);
        }
    };

    const loadLimitInfo = async () => {
        if (!user?.uid) return;
        const limit = await checkGenerationLimit(user.uid, 'image');
        setLimitInfo(getGenerationLimitMessage('image', limit.isPaid, limit.current, limit.limit));
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
                setSelectedModel(state.selectedModel || 'flux-kontext-pro');
                setAspectRatio(state.aspectRatio || '1:1');
                if (state.generatedImage) {
                    setGeneratedImage(state.generatedImage);
                }
            }
        } catch (error) {
            console.error('Error loading image project:', error);
        }
    };

    const saveProjectState = async (overrides: any = {}) => {
        if (!user?.uid) return null;

        const sessionState = {
            prompt,
            selectedModel,
            aspectRatio,
            generatedImage,
            ...overrides
        };

        try {
            if (currentProjectId) {
                await updateProjectState({ projectId: currentProjectId, sessionState });
                return currentProjectId;
            } else {
                const projectName = generateStudioProjectName('image', prompt);
                const result = await createStudioProject({
                    userId: user.uid,
                    studioType: 'image',
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
            console.error('Error saving image project:', error);
        }
        return null;
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            showToast('error', 'Empty Prompt', 'Please describe the image you want to create');
            return;
        }

        if (!user?.uid) {
            showToast('error', 'Authentication Required', 'Please log in to generate images');
            return;
        }

        setIsGenerating(true);
        setProgress('Initializing image generation...');
        setGeneratedImage(null);

        try {
            setProgress(`Generating with ${IMAGE_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}...`);

            const imageUrl = await generateKieImage(prompt, selectedModel);

            const image: GeneratedImage = {
                imageUrl,
                prompt,
                model: selectedModel,
                createdAt: new Date()
            };
            setGeneratedImage(image);

            // Deduct tokens
            const modelCost = getModelCost(selectedModel);
            const tokensToDeduct = modelCost?.tokensPerMessage || 5000; // Use actual token count

            // Use Firebase for token deduction and usage tracking
            const { deductTokens, incrementUsage } = await import('../../../lib/firestoreService');
            await deductTokens(user.uid, tokensToDeduct);
            await incrementUsage(user.uid, 'image', 1);

            await loadTokenBalance();
            await loadLimitInfo();

            // Save project
            await saveProjectState({ generatedImage: image });
            await refreshProjects();

            showToast('success', 'Image Generated!', `Deducted ${tokensToDeduct.toLocaleString()} tokens`);
            setProgress('');
        } catch (error: any) {
            console.error('Image generation error:', error);
            showToast('error', 'Generation Failed', error.message || 'Failed to generate image');
        } finally {
            setIsGenerating(false);
            setProgress('');
        }
    };

    const handleDownload = () => {
        if (!generatedImage) return;
        const link = document.createElement('a');
        link.href = generatedImage.imageUrl;
        link.download = `kroniq_image_${Date.now()}.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('success', 'Downloaded!', 'Image file downloaded');
    };

    const selectedModelInfo = IMAGE_MODELS.find(m => m.id === selectedModel);

    return (
        <div className="h-full flex flex-col bg-black overflow-hidden">
            {/* Header */}
            <StudioHeader
                icon={Image}
                title="Image Studio"
                subtitle="AI-Powered Image Generation"
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
                    <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-teal-600/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
                </div>

                {/* Left Sidebar - Library */}
                <div className="hidden lg:flex lg:w-80 border-r border-white/5 flex-col bg-black/40 backdrop-blur-xl h-full z-10">
                    <div className="p-4 border-b border-white/5">
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-white/80 mb-4">
                            <History className="w-4 h-4 text-teal-400" /> Library
                        </h2>
                        <button
                            onClick={() => {
                                setPrompt('');
                                setGeneratedImage(null);
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
                                <Image className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">No saved images yet</p>
                            </div>
                        ) : (
                            historyProjects.map(proj => (
                                <div
                                    key={proj.id}
                                    onClick={() => loadExistingProject(proj.id)}
                                    className={`group p-3 rounded-xl cursor-pointer transition-all border ${currentProjectId === proj.id
                                        ? 'bg-white/10 border-teal-500/50 shadow-inner'
                                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium text-sm text-white truncate w-full pr-2">
                                            {proj.name.replace('Image: ', '')}
                                        </span>
                                        {currentProjectId === proj.id && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse mt-1.5" />
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

                {/* Center - Image Preview */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 z-10 relative">
                    <div className="w-full max-w-2xl">
                        {isGenerating ? (
                            <div className="flex flex-col items-center justify-center min-h-[400px]">
                                <div className="relative mb-6">
                                    <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-full animate-pulse" />
                                    <Loader className="w-16 h-16 animate-spin text-teal-500 relative z-10" />
                                </div>
                                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-purple-400">
                                    Generating Image...
                                </h3>
                                <p className="text-white/40 text-sm mt-2">{progress}</p>
                            </div>
                        ) : generatedImage ? (
                            <div className="relative group">
                                <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-xl">
                                    <div className="relative">
                                        <img
                                            src={generatedImage.imageUrl}
                                            alt={generatedImage.prompt}
                                            className="w-full max-h-[60vh] object-contain"
                                        />
                                        <button
                                            onClick={() => setShowFullscreen(true)}
                                            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <ZoomIn className="w-5 h-5 text-white" />
                                        </button>
                                    </div>
                                    <div className="p-4 flex items-center justify-between border-t border-white/10">
                                        <div>
                                            <p className="text-sm font-medium text-white truncate max-w-md">{generatedImage.prompt}</p>
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
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-teal-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                                    <Image className="w-16 h-16 text-teal-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">AI Image Studio</h3>
                                <p className="text-white/40 max-w-md">
                                    Create stunning images with AI. Select a model, describe your image, and click generate.
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
                            {IMAGE_MODELS.map(model => (
                                <button
                                    key={model.id}
                                    onClick={() => setSelectedModel(model.id)}
                                    disabled={isGenerating}
                                    className={`p-3 rounded-xl border text-left transition-all ${selectedModel === model.id
                                        ? 'bg-teal-500/20 border-teal-500/50'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Image className="w-4 h-4 text-white/60" />
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
                            placeholder="Describe the image you want to create..."
                            className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 focus:border-teal-500/50 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none resize-none transition-all"
                            disabled={isGenerating}
                            maxLength={1000}
                        />
                    </div>

                    {/* Aspect Ratio */}
                    <div className="p-4 border-b border-white/5">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Aspect Ratio</h3>
                        <div className="grid grid-cols-5 gap-2">
                            {(['1:1', '16:9', '9:16', '4:3', '3:4'] as const).map(ar => (
                                <button
                                    key={ar}
                                    onClick={() => setAspectRatio(ar)}
                                    disabled={isGenerating}
                                    className={`py-2 rounded-lg text-xs transition-all ${aspectRatio === ar
                                        ? 'bg-teal-500/20 border border-teal-500/50 text-white'
                                        : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                                        }`}
                                >
                                    {ar}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate Button */}
                    <div className="p-4 mt-auto">
                        <div className="flex items-center justify-between text-xs text-white/40 mb-3">
                            <span>Est. Cost: ~5,000 tokens</span>
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
                                    <span>Generate Image</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Fullscreen Modal */}
            {showFullscreen && generatedImage && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-8"
                    onClick={() => setShowFullscreen(false)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg"
                        onClick={() => setShowFullscreen(false)}
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                    <img
                        src={generatedImage.imageUrl}
                        alt={generatedImage.prompt}
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            )}
        </div>
    );
};
