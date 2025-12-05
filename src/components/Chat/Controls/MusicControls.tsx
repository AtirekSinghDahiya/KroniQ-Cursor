import React from 'react';
import { Music, Clock, Volume2 } from 'lucide-react';

interface MusicControlsProps {
  makeInstrumental: boolean;
  onMakeInstrumentalChange: (value: boolean) => void;
  duration: number;
  onDurationChange: (duration: number) => void;
}

export const MusicControls: React.FC<MusicControlsProps> = ({
  makeInstrumental,
  onMakeInstrumentalChange,
  duration,
  onDurationChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-white/70 text-sm font-semibold mb-3 flex items-center gap-2">
          <Music className="w-4 h-4" />
          Music Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onMakeInstrumentalChange(false)}
            className={`p-3 rounded-xl border transition-all ${
              !makeInstrumental
                ? 'border-[#00FFF0] bg-[#00FFF0]/10 text-white'
                : 'border-white/10 text-white/60 hover:border-white/30 hover:bg-white/5'
            }`}
          >
            <div className="text-2xl mb-1">🎤</div>
            <div className="text-xs font-semibold">With Vocals</div>
          </button>
          <button
            onClick={() => onMakeInstrumentalChange(true)}
            className={`p-3 rounded-xl border transition-all ${
              makeInstrumental
                ? 'border-[#00FFF0] bg-[#00FFF0]/10 text-white'
                : 'border-white/10 text-white/60 hover:border-white/30 hover:bg-white/5'
            }`}
          >
            <div className="text-2xl mb-1">🎸</div>
            <div className="text-xs font-semibold">Instrumental</div>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-white/70 text-sm font-semibold mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Duration: {duration}s
        </label>
        <input
          type="range"
          min="30"
          max="120"
          step="10"
          value={duration}
          onChange={(e) => onDurationChange(parseInt(e.target.value))}
          className="w-full accent-[#00FFF0]"
        />
        <div className="flex justify-between text-xs text-white/40 mt-1">
          <span>30s</span>
          <span>60s</span>
          <span>90s</span>
          <span>120s</span>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-start gap-2">
          <Volume2 className="w-4 h-4 text-[#00FFF0] mt-0.5" />
          <div className="text-xs text-white/60 leading-relaxed">
            Describe the style, mood, and instruments you want in your music. Be specific for best results.
          </div>
        </div>
      </div>
    </div>
  );
};
