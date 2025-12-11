import React from 'react';
import { Code, Palette, MessageSquare, Video, ArrowRight, X, Mic, Music, Image } from 'lucide-react';
import { IntentResult } from '../../lib/intentClassifier';

interface IntentDialogProps {
  intent: IntentResult;
  onConfirm: () => void;
  onCancel: () => void;
}

export const IntentDialog: React.FC<IntentDialogProps> = ({ intent, onConfirm, onCancel }) => {
  const getIcon = () => {
    switch (intent.intent) {
      case 'code':
        return <Code className="w-8 h-8 text-cyan-400" />;
      case 'design':
        return <Palette className="w-8 h-8 text-pink-400" />;
      case 'video':
        return <Video className="w-8 h-8 text-purple-400" />;
      case 'voice':
        return <Mic className="w-8 h-8 text-teal-400" />;
      case 'music':
        return <Music className="w-8 h-8 text-violet-400" />;
      case 'image':
        return <Image className="w-8 h-8 text-rose-400" />;
      default:
        return <MessageSquare className="w-8 h-8 text-blue-400" />;
    }
  };

  const getGradient = () => {
    switch (intent.intent) {
      case 'code':
        return 'from-purple-500/20 to-pink-500/20';
      case 'design':
        return 'from-pink-500/20 to-purple-500/20';
      case 'video':
        return 'from-purple-500/20 to-indigo-500/20';
      case 'voice':
        return 'from-teal-500/20 to-purple-500/20';
      case 'music':
        return 'from-violet-500/20 to-purple-500/20';
      case 'image':
        return 'from-rose-500/20 to-pink-500/20';
      default:
        return 'from-pink-500/20 to-purple-500/20';
    }
  };

  const confidencePercentage = Math.round(intent.confidence * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md glass-panel rounded-2xl shadow-2xl border border-white/20 animate-scale-in overflow-hidden">
        <div className={`relative p-6 bg-gradient-to-br ${getGradient()}`}>
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 p-2 glass-panel rounded-xl hover:bg-white/20 transition-all button-press"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 glass-panel rounded-xl">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Route to {intent.suggestedStudio}?</h3>
              <p className="text-sm text-white/70">Confidence: {confidencePercentage}%</p>
            </div>
          </div>

          <p className="text-white/80 text-sm mb-4">
            {intent.reasoning}
          </p>

          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${confidencePercentage}%` }}
            />
          </div>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-white/70 text-sm">
            We detected that your prompt might be better suited for the <span className="text-white font-semibold">{intent.suggestedStudio}</span>. Would you like to switch?
          </p>

          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              className="flex-1 bg-gradient-to-r from-purple-500 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/20 transition-all button-press flex items-center justify-center gap-2"
            >
              Switch to {intent.suggestedStudio.split(' ')[0]}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 glass-panel border border-white/20 rounded-xl text-white font-medium hover:bg-white/10 transition-all button-press"
            >
              Stay in Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
