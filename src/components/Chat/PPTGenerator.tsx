import React, { useState } from 'react';
import { X, Presentation, Loader, Download } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { generatePPTContent, generatePPTXFile, downloadPPTX, GeneratedPPT } from '../../lib/pptGenerationService';
import { savePPTToProject } from '../../lib/contentSaveService';
import { checkGenerationLimit, incrementGenerationCount } from '../../lib/generationLimitsService';

interface PPTGeneratorProps {
  onClose: () => void;
  initialTopic?: string;
}

export const PPTGenerator: React.FC<PPTGeneratorProps> = ({
  onClose,
  initialTopic = ''
}) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [topic, setTopic] = useState(initialTopic);
  const [slideCount, setSlideCount] = useState(5);
  const [theme, setTheme] = useState('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPPT, setGeneratedPPT] = useState<GeneratedPPT | null>(null);
  const [pptBlob, setPPTBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState('');

  const themes = [
    { id: 'professional', name: 'Professional', description: 'Clean business style' },
    { id: 'modern', name: 'Modern', description: 'Contemporary design' },
    { id: 'creative', name: 'Creative', description: 'Bold and colorful' },
    { id: 'minimal', name: 'Minimal', description: 'Simple and elegant' },
  ];

  const slideCounts = [3, 5, 7, 10, 15];

  const handleGenerate = async () => {
    if (!topic.trim()) {
      showToast('error', 'Empty Topic', 'Please enter a presentation topic');
      return;
    }

    if (!user?.uid) {
      showToast('error', 'Authentication Required', 'Please log in to generate presentations');
      return;
    }

    // Check generation limit
    const limitCheck = await checkGenerationLimit(user.uid, 'ppt');
    if (!limitCheck.canGenerate) {
      showToast('error', 'Generation Limit Reached', limitCheck.message);
      return;
    }

    setIsGenerating(true);
    setGeneratedPPT(null);
    setPPTBlob(null);

    try {
      // Step 1: Generate content with AI
      setProgress('Generating presentation content with AI...');
      const pptData = await generatePPTContent({
        topic,
        slideCount,
        theme: theme as 'professional' | 'modern' | 'creative' | 'minimal'
      });

      setGeneratedPPT(pptData);

      // Step 2: Create downloadable file
      setProgress('Creating downloadable file...');
      const blob = await generatePPTXFile(pptData);
      setPPTBlob(blob);

      // Step 3: Save to project
      setProgress('Saving to your projects...');
      await savePPTToProject(
        user.uid,
        topic,
        pptData,
        {
          slideCount,
          theme
        }
      );

      // Step 4: Track generation
      await incrementGenerationCount(user.uid, 'ppt');

      showToast('success', 'PPT Generated!', `Your ${slideCount}-slide presentation is ready`);
      setProgress('');
    } catch (error: any) {
      console.error('PPT generation error:', error);
      showToast('error', 'Generation Failed', error.message || 'Failed to generate presentation');
      setProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (pptBlob && generatedPPT) {
      const filename = `${topic.replace(/[^a-z0-9]/gi, '_')}_presentation`;
      downloadPPTX(pptBlob, filename);
      showToast('success', 'Downloaded!', 'Presentation file downloaded');
    }
  };

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Presentation className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 flex-shrink-0" />
          <h1 className="text-base sm:text-lg font-semibold text-white truncate">PPT Generator</h1>
          <p className="hidden md:block text-sm text-white/40">Create AI-powered presentations</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Preview Section */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black min-h-[40vh] lg:min-h-0">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-4">
              <Loader className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-orange-400" />
              <p className="text-white/60 text-sm sm:text-base text-center px-4">{progress || 'Generating your presentation...'}</p>
            </div>
          ) : generatedPPT ? (
            <div className="max-w-full w-full text-center space-y-6 max-h-[60vh] overflow-y-auto px-4">
              <div className="p-8 rounded-lg border border-white/10 bg-white/5">
                <Presentation className="w-24 h-24 mx-auto mb-4 text-orange-400" />
                <h3 className="text-xl font-bold text-white mb-2">Presentation Ready!</h3>
                <p className="text-white/60 mb-2">{generatedPPT.title}</p>
                <p className="text-white/40 mb-6">{slideCount} slides created</p>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Presentation
                </button>
              </div>

              {/* Preview slides */}
              <div className="space-y-4">
                <h4 className="text-white font-medium text-left">Preview:</h4>
                {generatedPPT.slides.map((slide, index) => (
                  <div key={index} className="p-4 rounded-lg border border-white/10 bg-white/5 text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-orange-400 font-bold">Slide {index + 1}</span>
                      <span className="text-white/40 text-sm">({slide.layout})</span>
                    </div>
                    <h5 className="text-white font-semibold mb-2">{slide.title}</h5>
                    <ul className="space-y-1 text-white/60 text-sm">
                      {slide.content.map((point, i) => (
                        <li key={i}>• {point}</li>
                      ))}
                    </ul>
                    {slide.notes && (
                      <p className="mt-2 text-white/40 text-xs italic">Notes: {slide.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center max-w-md px-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <Presentation className="w-12 h-12 sm:w-16 sm:h-16 text-white/20" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Presentation preview</h3>
              <p className="text-sm sm:text-base text-white/40">
                Your generated presentation will appear here. Enter a topic and click generate to start.
              </p>
            </div>
          )}
        </div>

        {/* Controls Section */}
        <div className="w-full lg:w-[400px] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col p-4 sm:p-6 space-y-6 overflow-y-auto">
          {/* Topic Input */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60">Presentation Topic</label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., AI in Healthcare, Climate Change Solutions, Future of Work..."
              className="w-full h-24 px-3 py-2 bg-white/5 border border-white/10 focus:border-orange-500/40 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none resize-none transition-colors"
              disabled={isGenerating}
            />
          </div>

          {/* Slide Count */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60">Number of Slides</label>
            <div className="flex gap-2 flex-wrap">
              {slideCounts.map((count) => (
                <button
                  key={count}
                  onClick={() => setSlideCount(count)}
                  disabled={isGenerating}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    slideCount === count
                      ? 'bg-orange-500/20 border border-orange-500/40 text-white'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60">Theme</label>
            <div className="space-y-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  disabled={isGenerating}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    theme === t.id
                      ? 'bg-orange-500/20 border border-orange-500/40'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="font-medium text-white text-sm">{t.name}</div>
                  <div className="text-xs text-white/50">{t.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-white/5 text-white font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Presentation className="w-4 h-4" />
                <span>Generate Presentation</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
