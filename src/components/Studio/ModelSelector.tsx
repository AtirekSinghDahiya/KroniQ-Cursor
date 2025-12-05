import React from 'react';
import { Check, Zap, Clock } from 'lucide-react';

export interface ModelOption {
  id: string;
  name: string;
  description: string;
  speed: 'Fastest' | 'Fast' | 'Medium' | 'Slow';
  tokenCost: number;
  recommended?: boolean;
}

export interface ModelSelectorProps {
  models: ModelOption[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  color: string;
  disabled?: boolean;
}

const speedIcons = {
  'Fastest': Zap,
  'Fast': Zap,
  'Medium': Clock,
  'Slow': Clock
};

const speedColors = {
  'Fastest': '#00FF88',
  'Fast': '#00FFF0',
  'Medium': '#FFB800',
  'Slow': '#FF6B6B'
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModelId,
  onSelectModel,
  color,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      {models.map((model) => {
        const isSelected = selectedModelId === model.id;
        const SpeedIcon = speedIcons[model.speed];
        const speedColor = speedColors[model.speed];

        return (
          <button
            key={model.id}
            onClick={() => !disabled && onSelectModel(model.id)}
            disabled={disabled}
            className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border transition-all relative group ${
              isSelected
                ? 'border-white/30 bg-white/10'
                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            style={
              isSelected
                ? {
                    borderColor: `${color}40`,
                    backgroundColor: `${color}10`
                  }
                : undefined
            }
          >
            {/* Selection indicator */}
            {isSelected && (
              <div
                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${color}30` }}
              >
                <Check className="w-3 h-3" style={{ color }} />
              </div>
            )}

            {/* Recommended badge */}
            {model.recommended && (
              <div
                className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  backgroundColor: color,
                  color: '#000'
                }}
              >
                Recommended
              </div>
            )}

            <div className="flex items-start justify-between pr-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-white/90'}`}>
                    {model.name}
                  </span>
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${speedColor}20`,
                      color: speedColor
                    }}
                  >
                    <SpeedIcon className="w-3 h-3" />
                    {model.speed}
                  </div>
                </div>
                <p className={`text-xs ${isSelected ? 'text-white/70' : 'text-white/50'}`}>
                  {model.description}
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="text-xs text-white/40">
                    {model.tokenCost.toLocaleString()} tokens
                  </span>
                </div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
