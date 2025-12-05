import React from 'react';
import { Clock, Sparkles, Maximize } from 'lucide-react';

interface VideoControlsProps {
  aspectRatio: '16:9' | '9:16' | '1:1';
  onAspectRatioChange: (ratio: '16:9' | '9:16' | '1:1') => void;
  duration: 4 | 6 | 8;
  onDurationChange: (duration: 4 | 6 | 8) => void;
  provider: string;
  onProviderChange: (provider: string) => void;
}

export const VideoControls: React.FC<VideoControlsProps> = ({
  aspectRatio,
  onAspectRatioChange,
  duration,
  onDurationChange,
  provider,
  onProviderChange,
}) => {
  const aspectRatios: Array<{ value: '16:9' | '9:16' | '1:1'; label: string; icon: string }> = [
    { value: '16:9', label: 'Landscape', icon: '▭' },
    { value: '9:16', label: 'Portrait', icon: '▯' },
    { value: '1:1', label: 'Square', icon: '⬜' },
  ];

  const durations: Array<{ value: 4 | 6 | 8; label: string }> = [
    { value: 4, label: '4 seconds' },
    { value: 6, label: '6 seconds' },
    { value: 8, label: '8 seconds' },
  ];

  const providers = [
    { value: 'veo3-new', label: 'Veo 3 (New)', description: 'Latest Google model' },
    { value: 'sora2-new', label: 'Sora 2', description: 'OpenAI model' },
    { value: 'veo3', label: 'Veo 3 (Legacy)', description: 'Previous version' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-white/70 text-sm font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Model
        </label>
        <div className="space-y-2">
          {providers.map((p) => (
            <button
              key={p.value}
              onClick={() => onProviderChange(p.value)}
              className={`w-full p-3 rounded-xl border transition-all text-left ${
                provider === p.value
                  ? 'border-[#00FFF0] bg-[#00FFF0]/10'
                  : 'border-white/10 hover:border-white/30 hover:bg-white/5'
              }`}
            >
              <div className="font-semibold text-white mb-0.5">{p.label}</div>
              <div className="text-xs text-white/50">{p.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-white/70 text-sm font-semibold mb-2 flex items-center gap-2">
          <Maximize className="w-4 h-4" />
          Aspect Ratio
        </label>
        <div className="grid grid-cols-3 gap-2">
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
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-white/70 text-sm font-semibold mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Duration
        </label>
        <div className="space-y-2">
          {durations.map((d) => (
            <button
              key={d.value}
              onClick={() => onDurationChange(d.value)}
              className={`w-full py-2.5 px-3 rounded-lg border transition-all text-sm font-semibold ${
                duration === d.value
                  ? 'border-[#00FFF0] bg-[#00FFF0]/10 text-white'
                  : 'border-white/10 text-white/60 hover:border-white/30'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
