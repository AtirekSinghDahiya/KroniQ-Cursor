import React from 'react';
import { Image, Layers, Maximize } from 'lucide-react';

interface ImageControlsProps {
  aspectRatio: string;
  onAspectRatioChange: (ratio: string) => void;
  numImages: number;
  onNumImagesChange: (num: number) => void;
  outputFormat: string;
  onOutputFormatChange: (format: string) => void;
}

export const ImageControls: React.FC<ImageControlsProps> = ({
  aspectRatio,
  onAspectRatioChange,
  numImages,
  onNumImagesChange,
  outputFormat,
  onOutputFormatChange,
}) => {
  const aspectRatios = [
    { value: '1:1', label: 'Square', icon: '⬜' },
    { value: '16:9', label: 'Landscape', icon: '▭' },
    { value: '9:16', label: 'Portrait', icon: '▯' },
    { value: '4:3', label: '4:3', icon: '▭' },
    { value: '3:4', label: '3:4', icon: '▯' },
  ];

  const formats = [
    { value: 'jpeg', label: 'JPEG' },
    { value: 'png', label: 'PNG' },
    { value: 'webp', label: 'WebP' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-white/70 text-sm font-semibold mb-3 flex items-center gap-2">
          <Maximize className="w-4 h-4" />
          Aspect Ratio
        </label>
        <div className="grid grid-cols-2 gap-2">
          {aspectRatios.map((ratio) => (
            <button
              key={ratio.value}
              onClick={() => onAspectRatioChange(ratio.value)}
              className={`p-3 rounded-xl border transition-all ${
                aspectRatio === ratio.value
                  ? 'border-[#00FFF0] bg-[#00FFF0]/10 text-white'
                  : 'border-white/10 text-white/60 hover:border-white/30 hover:bg-white/5'
              }`}
            >
              <div className="text-2xl mb-1">{ratio.icon}</div>
              <div className="text-xs font-semibold">{ratio.label}</div>
              <div className="text-[10px] opacity-60">{ratio.value}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-white/70 text-sm font-semibold mb-2 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Number of Images: {numImages}
        </label>
        <input
          type="range"
          min="1"
          max="4"
          step="1"
          value={numImages}
          onChange={(e) => onNumImagesChange(parseInt(e.target.value))}
          className="w-full accent-[#00FFF0]"
        />
        <div className="flex justify-between text-xs text-white/40 mt-1">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
        </div>
      </div>

      <div>
        <label className="block text-white/70 text-sm font-semibold mb-2 flex items-center gap-2">
          <Image className="w-4 h-4" />
          Output Format
        </label>
        <div className="flex gap-2">
          {formats.map((format) => (
            <button
              key={format.value}
              onClick={() => onOutputFormatChange(format.value)}
              className={`flex-1 py-2 px-3 rounded-lg border transition-all text-sm font-semibold ${
                outputFormat === format.value
                  ? 'border-[#00FFF0] bg-[#00FFF0]/10 text-white'
                  : 'border-white/10 text-white/60 hover:border-white/30'
              }`}
            >
              {format.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
