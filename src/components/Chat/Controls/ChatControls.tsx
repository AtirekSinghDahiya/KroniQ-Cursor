import React from 'react';
import { Bot, Zap, Brain } from 'lucide-react';

interface ChatControlsProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  temperature?: number;
  onTemperatureChange?: (temp: number) => void;
}

export const ChatControls: React.FC<ChatControlsProps> = ({
  selectedModel,
  onModelChange,
  temperature = 1,
  onTemperatureChange,
}) => {
  const models = [
    { id: 'grok-4-fast', name: 'Grok 4 Fast', description: 'Fastest response', icon: Zap },
    { id: 'gpt-4-turbo-latest', name: 'GPT-4 Turbo', description: 'Most capable', icon: Brain },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced', icon: Bot },
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-white/70 text-sm font-semibold mb-3">AI Model</label>
        <div className="space-y-2">
          {models.map((model) => {
            const Icon = model.icon;
            const isSelected = selectedModel === model.id;

            return (
              <button
                key={model.id}
                onClick={() => onModelChange(model.id)}
                className={`w-full p-3 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'border-[#00FFF0] bg-[#00FFF0]/10 shadow-lg shadow-[#00FFF0]/20'
                    : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-gradient-to-br from-[#00FFF0] to-[#8A2BE2]' : 'bg-white/5'
                  }`}>
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-white/60'}`} />
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold mb-0.5 ${isSelected ? 'text-white' : 'text-white/80'}`}>
                      {model.name}
                    </div>
                    <div className="text-xs text-white/50">{model.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {onTemperatureChange && (
        <div>
          <label className="block text-white/70 text-sm font-semibold mb-2">
            Temperature: {temperature.toFixed(1)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
            className="w-full accent-[#00FFF0]"
          />
          <div className="flex justify-between text-xs text-white/40 mt-1">
            <span>Precise</span>
            <span>Balanced</span>
            <span>Creative</span>
          </div>
        </div>
      )}
    </div>
  );
};
