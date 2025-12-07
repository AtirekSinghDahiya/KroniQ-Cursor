import React, { useState, useEffect } from 'react';
import { Presentation, Loader, Download, Paperclip, Send, Trash2, Sparkles, X, History, Grid, Plus } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { generatePPTContent, generatePPTXFile, downloadPPTX, GeneratedPPT } from '../../../lib/pptGenerationService';
import { addMessage } from '../../../lib/chatService';
import { deductTokensForRequest } from '../../../lib/tokenService';
import { getModelCost } from '../../../lib/modelTokenPricing';
import { supabase } from '../../../lib/supabase';
import { useStudioMode } from '../../../contexts/StudioModeContext';
import { createStudioProject, updateProjectState, loadProject, generateStudioProjectName, getUserProjects, StudioProject } from '../../../lib/studioProjectService';

interface PPTStudioProps {
  onClose: () => void;
  projectId?: string;
  initialTopic?: string;
}

interface GeneratedPresentation {
  id: string;
  title: string;
  slideCount: number;
  timestamp: Date;
  data: GeneratedPPT;
  blob: Blob;
  projectId: string;
}

export const PPTStudio: React.FC<PPTStudioProps> = ({ onClose, projectId: initialProjectId, initialTopic }) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { projectId: activeProjectId } = useStudioMode();

  const [prompt, setPrompt] = useState(initialTopic || '');
  const [slideCount, setSlideCount] = useState(10);
  const [selectedTheme, setSelectedTheme] = useState<'professional' | 'modern' | 'creative' | 'minimal'>('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [tokenBalance, setTokenBalance] = useState(0);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(initialProjectId || activeProjectId || null);
  const [presentations, setPresentations] = useState<GeneratedPresentation[]>([]);
  const [historyProjects, setHistoryProjects] = useState<StudioProject[]>([]);

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
        setPrompt(state.prompt || '');

        // Regenerate blobs for presentations as they don't persist in JSON
        const loadedPresentations = state.presentations || [];
        const reconstructedPresentations = await Promise.all(
          loadedPresentations.map(async (p: GeneratedPresentation) => {
            if (p.data && (!p.blob || Object.keys(p.blob).length === 0)) {
              console.log('🔄 Regenerating blob for presentation:', p.title);
              const blob = await generatePPTXFile(p.data);
              return { ...p, blob, timestamp: new Date(p.timestamp) };
            }
            return { ...p, timestamp: new Date(p.timestamp) };
          })
        );

        setPresentations(reconstructedPresentations);
        console.log('✅ Loaded existing PPT project:', projectId);
      }
    } catch (error) {
      console.error('Error loading PPT project:', error);
    }
  };

  const saveProjectState = async (
    idToUse?: string | null,
    presentationsToSave?: GeneratedPresentation[],
    promptToSave?: string
  ) => {
    if (!user?.uid) return null;

    const projectIdToCheck = idToUse || currentProjectId;
    const presentationsList = presentationsToSave || presentations;
    const promptText = promptToSave !== undefined ? promptToSave : prompt;

    // Remove blob from state before saving as it's not JSON serializable
    const sanitizedPresentations = presentationsList.map(p => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { blob, ...rest } = p;
      return rest;
    });

    const sessionState = {
      prompt: promptText,
      presentations: sanitizedPresentations
    };

    try {
      if (projectIdToCheck) {
        await updateProjectState({
          projectId: projectIdToCheck,
          sessionState
        });
        console.log('✅ PPT project state updated');
        return projectIdToCheck;
      } else {
        const projectName = generateStudioProjectName('ppt', promptText);
        const result = await createStudioProject({
          userId: user.uid,
          studioType: 'ppt',
          name: projectName,
          description: promptText,
          model: 'ppt-generator',
          sessionState
        });

        if (result.success && result.projectId) {
          setCurrentProjectId(result.projectId);
          console.log('✅ New PPT project created:', result.projectId);
          showToast('success', 'Project Saved', 'Your presentation project has been saved');
          return result.projectId;
        }
      }
    } catch (error) {
      console.error('Error saving PPT project:', error);
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

    // Load history
    const projectsResult = await getUserProjects(user.uid, 'ppt');
    if (projectsResult.success && projectsResult.projects) {
      setHistoryProjects(projectsResult.projects);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('error', 'Empty Prompt', 'Please describe your presentation topic');
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
        projectId = await saveProjectState(null, [], prompt);
      }

      if (projectId) {
        // Force update current project ID if it wasn't set
        setCurrentProjectId(projectId);
      } else {
        throw new Error('Failed to create project');
      }

      await addMessage(projectId, 'user', prompt);

      setProgress('Generating presentation content...');
      const pptData = await generatePPTContent({
        topic: prompt,
        slideCount: slideCount,
        theme: selectedTheme,
        includeImages: true
      });

      setProgress('Creating downloadable file...');
      const blob = await generatePPTXFile(pptData);

      const modelCost = getModelCost('ppt-generator');
      const tokensToDeduct = modelCost.costPerMessage;

      setProgress('Deducting tokens...');
      await deductTokensForRequest(
        user.uid,
        'ppt-generator',
        'internal',
        tokensToDeduct,
        'ppt'
      );

      await loadTokenBalance();

      const presentationData: GeneratedPresentation = {
        id: Date.now().toString(),
        title: pptData.title,
        slideCount: pptData.slides.length,
        timestamp: new Date(),
        data: pptData,
        blob,
        projectId
      };

      // Format assistant message properly for structured content
      await addMessage(projectId, 'assistant', JSON.stringify({
        type: 'ppt',
        title: pptData.title,
        slideCount: pptData.slides.length,
        theme: pptData.theme,
        data: pptData // Important: save the data so it can be reconstructed
      }));

      // Update local state
      const newPresentations = [presentationData, ...presentations];
      setPresentations(newPresentations);

      showToast('success', 'Presentation Generated!', `Deducted ${tokensToDeduct.toLocaleString()} tokens`);

      // Save state with explicit new data
      await saveProjectState(projectId, newPresentations, prompt);

      setPrompt('');
      setProgress('');
    } catch (error: any) {
      console.error('PPT generation error:', error);
      showToast('error', 'Generation Failed', error.message || 'Failed to generate presentation');
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  const handleDownload = (presentation: GeneratedPresentation) => {
    const filename = `${presentation.title.replace(/[^a-z0-9]/gi, '_')} _presentation`;
    downloadPPTX(presentation.blob, filename);
    showToast('success', 'Downloaded!', 'Presentation file downloaded');
  };

  const handleDelete = (id: string) => {
    setPresentations(prev => prev.filter(p => p.id !== id));
    showToast('success', 'Deleted', 'Presentation removed');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isGenerating && prompt.trim()) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* Top Header */}
      <div className="border-b border-white/10 bg-black">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Presentation className="w-6 h-6" />
            <h1 className="text-xl font-bold">Presentation Studio</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">{tokenBalance.toLocaleString()}</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 active:scale-95 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Projects Sidebar */}
        <div className="hidden lg:flex lg:w-80 border-r border-white/10 flex-col bg-black h-full">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <History className="w-5 h-5 text-white/60" />
              <h2 className="font-semibold text-white">Saved Presentations</h2>
            </div>
            <button
              onClick={() => {
                setPrompt('');
                setPresentations([]);
                setCurrentProjectId(null);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-white/90 text-black font-medium rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" /> New Presentation
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {historyProjects.length === 0 ? (
              <div className="text-center py-8 text-white/40 text-sm">
                <Grid className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No presentations yet
              </div>
            ) : (
              <div className="space-y-2">
                {historyProjects.map(proj => (
                  <div
                    key={proj.id}
                    onClick={() => loadExistingProject(proj.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${currentProjectId === proj.id
                        ? 'bg-white/10 border-white/30'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                  >
                    <div className="font-medium text-sm text-white truncate mb-1">
                      {proj.name.replace('Presentation: ', '')}
                    </div>
                    <div className="text-xs text-white/50">
                      {new Date(proj.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content - Wrapped in overflow auto to handle scrolling */}
        <div className="flex-1 flex flex-col items-center p-8 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {/* Center Brand */}
          <div className="text-center mb-8">
            <h2 className="text-6xl font-bold mb-4 tracking-tight">KRONIQ</h2>
          </div>

          {/* Input Area */}
          <div className="w-full max-w-4xl">
            <div className="relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Turn your ideas into stunning slides in minutes"
                className="w-full h-32 px-6 py-4 bg-transparent border-none text-white text-base placeholder-white/30 focus:outline-none resize-none"
                disabled={isGenerating}
              />

              <div className="px-4 py-3 border-t border-white/10 space-y-3">
                {/* Controls Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Slide Count Selector */}
                    <div className="flex items-center gap-2">
                      <Presentation className="w-4 h-4 text-white/60" />
                      <select
                        value={slideCount}
                        onChange={(e) => setSlideCount(parseInt(e.target.value))}
                        className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-[#00FFF0]"
                        disabled={isGenerating}
                      >
                        <option value={5}>5 slides</option>
                        <option value={8}>8 slides</option>
                        <option value={10}>10 slides</option>
                        <option value={12}>12 slides</option>
                        <option value={15}>15 slides</option>
                        <option value={20}>20 slides</option>
                      </select>
                    </div>

                    {/* Theme Selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white/60">Theme:</span>
                      <select
                        value={selectedTheme}
                        onChange={(e) => setSelectedTheme(e.target.value as any)}
                        className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-[#00FFF0]"
                        disabled={isGenerating}
                      >
                        <option value="professional">Professional</option>
                        <option value="modern">Modern</option>
                        <option value="creative">Creative</option>
                        <option value="minimal">Minimal</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating || !prompt.trim()}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <Loader className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {isGenerating && progress && (
                <div className="px-4 py-2 border-t border-white/10 bg-white/5">
                  <p className="text-xs text-white/50">{progress}</p>
                </div>
              )}
            </div>
          </div>

          {/* Generated Presentations Grid */}
          {presentations.length > 0 && (
            <div className="w-full max-w-6xl mt-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {presentations.map((presentation) => (
                  <div
                    key={presentation.id}
                    className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition-all"
                  >
                    {/* Presentation Preview */}
                    <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center p-6">
                      <div className="text-center">
                        <Presentation className="w-12 h-12 text-white/60 mx-auto mb-3" />
                        <h3 className="text-sm font-semibold text-white line-clamp-2">
                          {presentation.title}
                        </h3>
                      </div>
                    </div>

                    {/* Presentation Info */}
                    <div className="p-4 border-t border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/50">
                          {presentation.slideCount} slides
                        </span>
                        <span className="text-xs text-white/50">
                          {presentation.timestamp.toLocaleDateString()}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDownload(presentation)}
                          className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </button>
                        <button
                          onClick={() => handleDelete(presentation.id)}
                          className="p-2 bg-white/10 hover:bg-red-500/20 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Hover Actions */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg">
                        <Presentation className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
