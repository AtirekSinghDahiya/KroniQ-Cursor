import React, { useState } from 'react';
import { X, Wand2, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { generateImage } from '../../lib/imageService';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { saveImageToProject } from '../../lib/contentSaveService';
import { checkGenerationLimit, incrementGenerationCount } from '../../lib/generationLimitsService';
import { deductTokensForRequest } from '../../lib/tokenService';
import { getModelCost } from '../../lib/modelTokenPricing';

interface SimpleImageGeneratorProps {
  onClose: () => void;
  initialPrompt?: string;
}

export const SimpleImageGenerator: React.FC<SimpleImageGeneratorProps> = ({
  onClose,
  initialPrompt = ''
}) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'square' | 'landscape' | 'portrait' | '4:3' | '3:4'>('square');
  const [numImages, setNumImages] = useState(1);
  const [outputFormat, setOutputFormat] = useState<'JPEG' | 'PNG' | 'WebP'>('JPEG');
  const [selectedModel, setSelectedModel] = useState('flux-pro');
  const [showControls, setShowControls] = useState(true);

  const models = [
    { id: 'flux-pro', name: 'Flux Pro', description: 'High-quality image generation', speed: 'Fast', provider: 'kie-ai' },
    { id: 'flux-dev', name: 'Flux Dev', description: 'Fast image generation', speed: 'Fast', provider: 'kie-ai' },
    { id: 'sdxl', name: 'Stable Diffusion XL', description: 'Open-source image model', speed: 'Medium', provider: 'kie-ai' },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast('error', 'Empty Prompt', 'Please enter a description for your image');
      return;
    }

    if (!user?.uid) {
      showToast('error', 'Authentication Required', 'Please log in to generate images');
      return;
    }

    // Check generation limit BEFORE generating
    const limitCheck = await checkGenerationLimit(user.uid, 'image');
    if (!limitCheck.canGenerate) {
      showToast('error', 'Generation Limit Reached', limitCheck.message);
      return;
    }

    setIsGenerating(true);
    setGeneratedImageUrl(null);
    setProgress('Starting...');

    try {
      setProgress('Generating image with Kie AI...');

      const result = await generateImage({
        prompt,
        model: selectedModel
      });

      setGeneratedImageUrl(result.url);

      // Deduct tokens
      const modelCost = getModelCost(selectedModel);
      const provider = 'kie-ai';
      await deductTokensForRequest(user.uid, selectedModel, provider, modelCost.costPerMessage, 'image');
      console.log('✅ Tokens deducted for image generation');

      // Increment usage count for free users
      await incrementGenerationCount(user.uid, 'image');
      console.log('✅ Image generation count incremented');

      // Save to project
      await saveImageToProject(user.uid, prompt, imageUrl, {
        model: selectedModel,
        dimensions: aspectRatio,
        provider
      });
      console.log('✅ Image saved to project');

      showToast('success', 'Image Generated!', 'Your image is ready and saved to projects');
    } catch (error: any) {
      console.error('Image generation error:', error);
      const errorMessage = error.message || 'Failed to generate image. Please check your API key and try again.';
      showToast('error', 'Generation Failed', errorMessage);
      setProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const aspectRatios = [
    { id: 'square' as const, label: 'Square', icon: '⬜', ratio: '1:1' },
    { id: 'landscape' as const, label: 'Landscape', icon: '▭', ratio: '16:9' },
    { id: 'portrait' as const, label: 'Portrait', icon: '▯', ratio: '9:16' },
    { id: '4:3' as const, label: '4:3', icon: '▬', ratio: '4:3' },
    { id: '3:4' as const, label: '3:4', icon: '▯', ratio: '3:4' }
  ];

  return (
    <div className="h-full flex flex-col bg-black">
      {/* Header - Responsive */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 text-teal-400 flex-shrink-0" />
          <h1 className="text-base sm:text-lg font-semibold text-white truncate">Image Generation</h1>
          <p className="hidden md:block text-sm text-white/40">Create stunning images with AI</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-lg text-white/60 hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Preview Section */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black min-h-[40vh] lg:min-h-0">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-4">
              <Loader className="w-12 h-12 sm:w-16 sm:h-16 animate-spin text-teal-400" />
              <p className="text-white/60 text-sm sm:text-base text-center px-4">{progress || 'Generating your image...'}</p>
            </div>
          ) : generatedImageUrl ? (
            <div className="max-w-full w-full">
              <img
                src={generatedImageUrl}
                alt="Generated"
                className="w-full rounded-lg border border-white/10 shadow-2xl max-h-[60vh] lg:max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="text-center max-w-md px-4">
              <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6 rounded-full bg-white/5 flex items-center justify-center">
                <Wand2 className="w-12 h-12 sm:w-16 sm:h-16 text-white/20" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Image preview</h3>
              <p className="text-sm sm:text-base text-white/40">
                Your generated image will appear here. Enter a prompt and click generate to start.
              </p>
            </div>
          )}
        </div>

        {/* Controls Section - Responsive */}
        <div className="w-full lg:w-[400px] xl:w-[420px] border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col bg-black max-h-[60vh] lg:max-h-none overflow-y-auto">
          {/* Collapsible Controls Toggle - Mobile Only */}
          <button
            onClick={() => setShowControls(!showControls)}
            className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 text-white hover:bg-white/5 transition-colors"
          >
            <span className="text-sm font-medium">Controls</span>
            {showControls ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <div className={`${showControls ? 'block' : 'hidden lg:block'}`}>
            {/* Model Selector */}
            <div className="p-4 sm:p-6 border-b border-white/10">
              <div className="text-sm font-semibold text-white mb-3">Model</div>
              <div className="space-y-2">
                {models.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border transition-all touch-manipulation ${
                      selectedModel === model.id
                        ? 'border-teal-500/40 bg-teal-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 active:bg-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{model.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/60">{model.speed}</span>
                    </div>
                    <p className="text-xs text-white/50">{model.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio - Responsive Grid */}
            <div className="p-4 sm:p-6 border-b border-white/10">
              <label className="text-sm font-medium text-white/80 mb-3 block">Aspect Ratio</label>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {aspectRatios.map((ar) => (
                  <button
                    key={ar.id}
                    onClick={() => setAspectRatio(ar.id)}
                    disabled={isGenerating}
                    className={`flex flex-col items-center gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-lg border transition-all touch-manipulation min-h-[60px] sm:min-h-[70px] ${
                      aspectRatio === ar.id
                        ? 'bg-teal-500/20 border-teal-500/50 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 active:bg-white/15'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl">{ar.icon}</span>
                    <span className="text-[9px] sm:text-[10px] font-medium">{ar.ratio}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Images - Responsive Grid */}
            <div className="p-4 sm:p-6 border-b border-white/10">
              <label className="text-sm font-medium text-white/80 mb-3 block">Number of Images: {numImages}</label>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumImages(num)}
                    disabled={isGenerating}
                    className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg border text-sm font-medium transition-all touch-manipulation min-h-[44px] ${
                      numImages === num
                        ? 'bg-teal-500/20 border-teal-500/50 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 active:bg-white/15'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Output Format - Responsive Grid */}
            <div className="p-4 sm:p-6 border-b border-white/10">
              <label className="text-sm font-medium text-white/80 mb-3 block">Output Format</label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {(['JPEG', 'PNG', 'WebP'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setOutputFormat(format)}
                    disabled={isGenerating}
                    className={`py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg border text-sm font-medium transition-all touch-manipulation min-h-[44px] ${
                      outputFormat === format
                        ? 'bg-teal-500/20 border-teal-500/50 text-white'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 active:bg-white/15'
                    }`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Prompt Input - Always Visible */}
          <div className="p-4 sm:p-6 border-t border-white/10 bg-black mt-auto">
            <label className="text-sm font-medium text-white/80 mb-3 block">Prompt</label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Describe your image... e.g., 'A majestic dragon soaring through stormy clouds'"
                className="w-full h-20 sm:h-24 px-3 sm:px-4 py-2.5 sm:py-3 bg-white/5 border border-white/10 focus:border-teal-500/40 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none resize-none transition-colors"
                disabled={isGenerating}
              />
              <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 text-xs text-white/30">
                {prompt.length}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 bg-teal-500 hover:bg-teal-600 disabled:bg-white/5 text-white font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation min-h-[48px] active:scale-98"
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
    </div>
  );
};
