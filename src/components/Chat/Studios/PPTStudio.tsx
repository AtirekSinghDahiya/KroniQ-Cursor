import React, { useState, useEffect } from 'react';
import { Presentation, X, Sparkles, Download, Paperclip, Send, Loader, Play, Trash2 } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import { useAuth } from '../../../contexts/AuthContext';
import { generatePPTContent, generatePPTXFile, downloadPPTX, GeneratedPPT } from '../../../lib/pptGenerationService';
import { createProject, addMessage } from '../../../lib/chatService';
import { deductTokensForRequest } from '../../../lib/tokenService';
import { getModelCost } from '../../../lib/modelTokenPricing';
import { supabase } from '../../../lib/supabase';
import { useStudioMode } from '../../../contexts/StudioModeContext';
import { createStudioProject, updateProjectState, loadProject, generateStudioProjectName } from '../../../lib/studioProjectService';

interface PPTStudioProps {
  onClose: () => void;
  projectId?: string;
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

export const PPTStudio: React.FC<PPTStudioProps> = ({ onClose, projectId: initialProjectId }) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { projectId: activeProjectId } = useStudioMode();

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [tokenBalance, setTokenBalance] = useState(0);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(initialProjectId || activeProjectId || null);
  const [presentations, setPresentations] = useState<GeneratedPresentation[]>([]);

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
        setPresentations(state.presentations || []);
        console.log('✅ Loaded existing PPT project:', projectId);
      }
    } catch (error) {
      console.error('Error loading PPT project:', error);
    }
  };

  const saveProjectState = async () => {
    if (!user?.uid) return null;

    const sessionState = {
      prompt,
      presentations
    };

    try {
      if (currentProjectId) {
        await updateProjectState({
          projectId: currentProjectId,
          sessionState
        });
        console.log('✅ PPT project state updated');
        return currentProjectId;
      } else {
        const projectName = generateStudioProjectName('ppt', prompt);
        const result = await createStudioProject({
          userId: user.uid,
          studioType: 'ppt',
          name: projectName,
          description: prompt,
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
      let projectId = activeProjectId;

      if (!projectId) {
        setProgress('Creating presentation project...');
        const newProject = await createProject(
          `PPT: ${prompt.substring(0, 30)}`,
          'ppt',
          prompt
        );
        projectId = newProject.id;
      }

      await addMessage(projectId, 'user', prompt);

      setProgress('Generating presentation content...');
      const pptData = await generatePPTContent({
        topic: prompt,
        slideCount: 10,
        theme: 'professional'
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

      await addMessage(projectId, 'assistant', JSON.stringify({
        type: 'ppt',
        title: pptData.title,
        slideCount: pptData.slides.length,
        theme: pptData.theme
      }));

      setPresentations(prev => [presentationData, ...prev]);
      showToast('success', 'Presentation Generated!', `Deducted ${tokensToDeduct.toLocaleString()} tokens`);
      await saveProjectState();

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
    const filename = `${presentation.title.replace(/[^a-z0-9]/gi, '_')}_presentation`;
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
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

            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 border border-blue-500/30 rounded-lg flex items-center gap-2 text-sm transition-all">
                  <Presentation className="w-4 h-4" />
                  <span>Slides</span>
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-all">
                  <Presentation className="w-5 h-5" />
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
  );
};
