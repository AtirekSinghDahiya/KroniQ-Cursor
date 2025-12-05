import React from 'react';
import { Mic, User, Zap } from 'lucide-react';

interface VoiceControlsProps {
  voiceId: string;
  onVoiceIdChange: (voiceId: string) => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  voiceId,
  onVoiceIdChange,
  speed,
  onSpeedChange,
}) => {
  const voices = [
    { id: 'alloy', name: 'Alloy', description: 'Neutral and balanced', gender: 'Neutral' },
    { id: 'echo', name: 'Echo', description: 'Male voice, clear', gender: 'Male' },
    { id: 'fable', name: 'Fable', description: 'British accent', gender: 'Male' },
    { id: 'onyx', name: 'Onyx', description: 'Deep and smooth', gender: 'Male' },
    { id: 'nova', name: 'Nova', description: 'Warm and friendly', gender: 'Female' },
    { id: 'shimmer', name: 'Shimmer', description: 'Soft and gentle', gender: 'Female' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-white/70 text-sm font-semibold mb-3 flex items-center gap-2">
          <User className="w-4 h-4" />
          Voice Selection
        </label>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {voices.map((voice) => (
            <button
              key={voice.id}
              onClick={() => onVoiceIdChange(voice.id)}
              className={`w-full p-3 rounded-xl border transition-all text-left ${
                voiceId === voice.id
                  ? 'border-[#00FFF0] bg-[#00FFF0]/10'
                  : 'border-white/10 hover:border-white/30 hover:bg-white/5'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <div className="font-semibold text-white">{voice.name}</div>
                <div className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                  {voice.gender}
                </div>
              </div>
              <div className="text-xs text-white/50">{voice.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-white/70 text-sm font-semibold mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Speech Speed: {speed}x
        </label>
        <input
          type="range"
          min="0.25"
          max="4"
          step="0.25"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="w-full accent-[#00FFF0]"
        />
        <div className="flex justify-between text-xs text-white/40 mt-1">
          <span>0.25x</span>
          <span>1x</span>
          <span>2x</span>
          <span>4x</span>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-start gap-2">
          <Mic className="w-4 h-4 text-[#00FFF0] mt-0.5" />
          <div className="text-xs text-white/60 leading-relaxed">
            Enter the text you want to convert to speech. Maximum 4096 characters.
          </div>
        </div>
      </div>
    </div>
  );
};
