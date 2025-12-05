import React, { useState, useEffect } from 'react';
import { X, Wand2, Download, Loader } from 'lucide-react';
import { generateImage, ImageModel } from '../../lib/kieImageService';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import { saveImageToProject } from '../../lib/contentSaveService';

interface GeneratedImage {
  url: string;
  model?: string;
  prompt?: string;
  seed?: number;
  timestamp?: Date;
}

interface ImageGeneratorProps {
  onClose: () => void;
  onImageGenerated?: (image: GeneratedImage) => void;
  initialPrompt?: string;
  selectedModel?: string;
}

const ASPECT_RATIOS = [
  { id: 'square', label: 'Square', ratio: '1:1', icon: '□' },
  { id: 'landscape', label: 'Landscape', ratio: '16:9', icon: '▭' },
  { id: 'portrait', label: 'Portrait', ratio: '9:16', icon: '▯' },
  { id: '4:3', label: '4:3', ratio: '4:3', icon: '▬' },
  { id: '3:4', label: '3:4', ratio: '3:4', icon: '▯' }
];

const OUTPUT_FORMATS = ['JPEG', 'PNG', 'WebP'];

export const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  onClose,
  onImageGenerated,
  initialPrompt = '',
  selectedModel
}) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImageModel, setSelectedImageModel] = useState<ImageModel>(
    (selectedModel as ImageModel) || 'nano-banana'
  );
  const [aspectRatio, setAspectRatio] = useState('square');
  const [outputFormat, setOutputFormat] = useState('JPEG');

  useEffect(() => {
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialPrompt]);

  useEffect(() => {
    if (selectedModel) setSelectedImageModel(selectedModel as ImageModel);
  }, [selectedModel]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGeneratedImages([]);

    try {
      const result = await generateImage(prompt, selectedImageModel, user?.uid);

      const image: GeneratedImage = {
        url: result.url,
        model: selectedImageModel,
        prompt: prompt,
        seed: result.seed,
        timestamp: new Date()
      };

      setGeneratedImages([image]);
      showToast('success', 'Image Generated!', 'Your image has been created');

      if (user) {
        try {
          await saveImageToProject(user.uid, prompt, result.url, {
            model: selectedImageModel,
            dimensions: '1024x1024',
            provider: 'kie-ai'
          });
        } catch (saveError) {
          console.error('Failed to save image:', saveError);
        }
      }

      if (onImageGenerated) {
        onImageGenerated(image);
      }
    } catch (error: any) {
      console.error('Image generation error:', error);
      showToast('error', 'Generation Failed', error?.message || 'Could not generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `kroniq-${Date.now()}.${outputFormat.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-full bg-black">
      {/* Left Panel - Controls */}
      <div className="w-[400px] border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-teal-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Image Generation</h2>
              <p className="text-xs text-white/40">Create stunning images with AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-white/5 text-white/40 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60">Model</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setSelectedImageModel('nano-banana')}
                disabled={isGenerating}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedImageModel === 'nano-banana'
                    ? 'bg-teal-500/20 border border-teal-500/40 text-white'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <div className="font-semibold">Nano Banana</div>
                <div className="text-[10px] opacity-60">Google</div>
              </button>
              <button
                onClick={() => setSelectedImageModel('seedreem')}
                disabled={isGenerating}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedImageModel === 'seedreem'
                    ? 'bg-teal-500/20 border border-teal-500/40 text-white'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <div className="font-semibold">Seedreem</div>
                <div className="text-[10px] opacity-60">Flux</div>
              </button>
              <button
                onClick={() => setSelectedImageModel('gpt-4o-image')}
                disabled={isGenerating}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedImageModel === 'gpt-4o-image'
                    ? 'bg-teal-500/20 border border-teal-500/40 text-white'
                    : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <div className="font-semibold">GPT-4o</div>
                <div className="text-[10px] opacity-60">OpenAI</div>
              </button>
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your image... e.g., 'A majestic dragon soaring through stormy clouds'"
              className="w-full h-32 px-3 py-2 bg-white/5 border border-white/10 focus:border-teal-500/40 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none resize-none transition-colors"
              disabled={isGenerating}
            />
            <div className="text-xs text-white/30">{prompt.length} / 2000</div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60">Aspect Ratio</label>
            <div className="grid grid-cols-5 gap-2">
              {ASPECT_RATIOS.map((ar) => (
                <button
                  key={ar.id}
                  onClick={() => setAspectRatio(ar.id)}
                  disabled={isGenerating}
                  className={`px-2 py-3 rounded-lg text-xs font-medium transition-all flex flex-col items-center gap-1 ${
                    aspectRatio === ar.id
                      ? 'bg-teal-500/20 border border-teal-500/40 text-white'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg">{ar.icon}</span>
                  <span className="text-[10px]">{ar.ratio}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note: Generates 1 image per request for optimal quality */}

          {/* Output Format */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/60">Output Format</label>
            <div className="grid grid-cols-3 gap-2">
              {OUTPUT_FORMATS.map((format) => (
                <button
                  key={format}
                  onClick={() => setOutputFormat(format)}
                  disabled={isGenerating}
                  className={`py-2 rounded-lg text-xs font-medium transition-all ${
                    outputFormat === format
                      ? 'bg-teal-500/20 border border-teal-500/40 text-white'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-white/5 text-white font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Generate Image</span>
              </>
            )}
          </button>

          {/* Tips */}
          <div className="p-3 bg-white/5 rounded-lg border border-white/10">
            <h4 className="text-xs font-semibold text-white mb-2">Tips</h4>
            <ul className="text-[11px] text-white/50 space-y-1">
              <li>• Add style keywords: "photorealistic", "oil painting", "anime"</li>
              <li>• Describe lighting: "golden hour", "dramatic shadows"</li>
              <li>• Include quality: "highly detailed", "8k", "sharp focus"</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black">
        {isGenerating ? (
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-12 h-12 animate-spin text-teal-400" />
            <p className="text-sm text-white/60">Generating your image...</p>
          </div>
        ) : generatedImages.length > 0 ? (
          <div className="w-full max-w-3xl space-y-4">
            <div className="relative group">
              <img
                src={generatedImages[0].url}
                alt="Generated"
                className="w-full rounded-lg border border-white/10"
              />
              <button
                onClick={() => handleDownload(generatedImages[0].url)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-black/80 hover:bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
            {generatedImages[0].prompt && (
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <p className="text-xs text-white/60 mb-1">Prompt:</p>
                <p className="text-sm text-white">{generatedImages[0].prompt}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center max-w-md">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
              <Wand2 className="w-12 h-12 text-white/20" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Image preview</h3>
              <p className="text-sm text-white/40">
                Your generated image will appear here. Enter a prompt and click generate to start.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
