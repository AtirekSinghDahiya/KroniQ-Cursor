import React, { useState } from 'react';
import { Music, Loader, Download, Play, Pause } from 'lucide-react';
import { generateSunoMusic } from '../../lib/sunoService';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { checkGenerationLimit, incrementGenerationCount } from '../../lib/generationLimitsService';
import { deductTokensForRequest } from '../../lib/tokenService';
import { getModelCost } from '../../lib/modelTokenPricing';

interface MusicGeneratorProps {
  onClose: () => void;
  initialPrompt?: string;
}

export const MusicGenerator: React.FC<MusicGeneratorProps> = ({
  onClose,
  initialPrompt = ''
}) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [description, setDescription] = useState(initialPrompt);
  const [genre, setGenre] = useState('');
  const [title, setTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMusic, setGeneratedMusic] = useState<{ audioUrl: string; title: string; tags: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState('');

  const handleGenerate = async () => {
    if (!description.trim()) {
      showToast('error', 'Empty Description', 'Please describe the music you want to create');
      return;
    }

    if (!user?.uid) {
      showToast('error', 'Authentication Required', 'Please log in to generate music');
      return;
    }

    // Check generation limit BEFORE generating
    const limitCheck = await checkGenerationLimit(user.uid, 'song');
    if (!limitCheck.canGenerate) {
      showToast('error', 'Generation Limit Reached', limitCheck.message);
      return;
    }

    setIsGenerating(true);
    setGeneratedMusic(null);
    setProgress('Starting music generation...');

    try {
      const result = await generateSunoMusic({
        description,
        genre: genre || undefined,
        title: title || undefined
      }, (status) => setProgress(status));

      setGeneratedMusic(result);

      // Deduct tokens
      const modelCost = getModelCost('suno-ai');
      await deductTokensForRequest(user.uid, 'suno-ai', 'suno', modelCost.costPerMessage, 'song');
      console.log('✅ Tokens deducted for music generation');

      // Increment usage count for free users
      await incrementGenerationCount(user.uid, 'song');
      console.log('✅ Music generation count incremented');

      showToast('success', 'Music Generated!', 'Your song is ready to play');
      setProgress('');
    } catch (error: any) {
      console.error('Music generation error:', error);
      showToast('error', 'Generation Failed', error.message || 'Failed to generate music');
      setProgress('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedMusic) {
      const link = document.createElement('a');
      link.href = generatedMusic.audioUrl;
      link.download = `${generatedMusic.title.replace(/[^a-z0-9]/gi, '_')}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('success', 'Downloaded!', 'Music file downloaded');
    }
  };

  const togglePlay = () => {
    const audio = document.getElementById('music-audio') as HTMLAudioElement;
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
    <div className="h-full flex flex-col bg-black p-6">
      {/* Input Section */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">
            Music Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the music you want to create (e.g., 'A calm and relaxing piano track with soft melodies')"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/30 resize-none"
            rows={4}
            maxLength={3000}
          />
          <div className="text-xs text-white/40 mt-1">{description.length}/3000</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Style/Genre
            </label>
            <input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g., Classical, Jazz, Pop, Electronic, Rock"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Peaceful Piano Meditation"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-white/30"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !description.trim()}
          className="w-full py-3 px-6 bg-white hover:bg-white/90 text-black rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Music className="w-5 h-5" />
              Generate Music
            </>
          )}
        </button>
      </div>

      {/* Progress */}
      {progress && (
        <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-lg">
          <p className="text-sm text-white/50">{progress}</p>
        </div>
      )}

      {/* Generated Music */}
      {generatedMusic && (
        <div className="p-6 bg-white/5 border border-white/10 rounded-lg space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">{generatedMusic.title}</h3>
            <p className="text-sm text-white/50">{generatedMusic.tags}</p>
          </div>

          <audio
            id="music-audio"
            src={generatedMusic.audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          <div className="flex gap-3">
            <button
              onClick={togglePlay}
              className="flex-1 py-3 px-6 bg-white/10 border border-white/20 text-white rounded-lg font-medium hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Play
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="py-3 px-6 bg-white/10 border border-white/20 text-white rounded-lg font-medium hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-auto pt-6">
        <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
          <h4 className="text-sm font-semibold text-white mb-2">Tips</h4>
          <ul className="text-xs text-white/60 space-y-1">
            <li>• Be detailed in your prompt - include emotions, rhythm, instruments</li>
            <li>• Specify the genre or style clearly</li>
            <li>• Generation typically takes 1-3 minutes</li>
            <li>• Each generation produces 2 unique variations</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
