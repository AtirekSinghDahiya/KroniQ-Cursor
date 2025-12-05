import React, { useState } from 'react';
import { Download, Image as ImageIcon, Video as VideoIcon, Music, X, Maximize2 } from 'lucide-react';

interface MediaPreviewProps {
  type: 'image' | 'video' | 'audio';
  url: string;
  prompt?: string;
  metadata?: any;
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({ type, url, prompt, metadata }) => {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `generated-${type}-${Date.now()}.${type === 'image' ? 'png' : type === 'video' ? 'mp4' : 'mp3'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const renderContent = () => {
    switch (type) {
      case 'image':
        return (
          <div className="relative group">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00FFF0] border-t-transparent" />
              </div>
            )}
            <img
              src={url}
              alt={prompt || 'Generated image'}
              className="w-full rounded-lg shadow-2xl"
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
            <button
              onClick={() => setShowFullscreen(true)}
              className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        );

      case 'video':
        return (
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00FFF0] border-t-transparent" />
              </div>
            )}
            <video
              src={url}
              controls
              className="w-full rounded-lg shadow-2xl"
              onLoadedData={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            >
              Your browser does not support video playback.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="bg-gradient-to-br from-[#00FFF0]/10 to-[#8A2BE2]/10 rounded-lg p-6 border border-[#00FFF0]/20">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-[#00FFF0]/20 to-[#8A2BE2]/20">
                <Music className="w-6 h-6 text-[#00FFF0]" />
              </div>
              <div>
                <div className="text-white font-semibold">Generated Audio</div>
                {prompt && <div className="text-white/50 text-sm mt-1">{prompt}</div>}
              </div>
            </div>
            <audio
              src={url}
              controls
              className="w-full"
              onLoadedData={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            >
              Your browser does not support audio playback.
            </audio>
          </div>
        );
    }
  };

  return (
    <>
      <div className="my-4 max-w-2xl">
        <div className="rounded-xl overflow-hidden bg-black/20 backdrop-blur-sm border border-[#00FFF0]/20">
          {prompt && (
            <div className="px-4 py-3 bg-gradient-to-r from-[#00FFF0]/10 to-[#8A2BE2]/10 border-b border-[#00FFF0]/20">
              <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
                {type === 'image' && <ImageIcon className="w-3 h-3" />}
                {type === 'video' && <VideoIcon className="w-3 h-3" />}
                {type === 'audio' && <Music className="w-3 h-3" />}
                <span className="uppercase font-semibold">Generated {type}</span>
              </div>
              <div className="text-white/80 text-sm">{prompt}</div>
            </div>
          )}

          <div className="p-4">
            {renderContent()}
          </div>

          <div className="px-4 py-3 bg-black/40 border-t border-[#00FFF0]/10 flex items-center justify-between">
            <div className="text-xs text-white/40">
              {metadata?.timestamp && new Date(metadata.timestamp).toLocaleString()}
            </div>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00FFF0]/20 to-[#8A2BE2]/20 border border-[#00FFF0]/30 text-[#00FFF0] hover:border-[#00FFF0]/50 transition-all text-sm font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
        </div>

        {metadata && Object.keys(metadata).length > 1 && (
          <div className="mt-2 px-4 text-xs text-white/40">
            {metadata.seed && <span>Seed: {metadata.seed}</span>}
            {metadata.duration && <span className="ml-3">Duration: {metadata.duration}s</span>}
            {metadata.model && <span className="ml-3">Model: {metadata.model}</span>}
          </div>
        )}
      </div>

      {showFullscreen && type === 'image' && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowFullscreen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setShowFullscreen(false)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={url}
            alt={prompt || 'Generated image'}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
};
