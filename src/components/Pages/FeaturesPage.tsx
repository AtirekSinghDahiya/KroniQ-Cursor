import React from 'react';
import { X, Code, Palette, MessageSquare, Zap, Shield, Globe, Sparkles, Cpu, Database } from 'lucide-react';

interface FeaturesPageProps {
  onClose: () => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onClose }) => {
  const features = [
    {
      icon: MessageSquare,
      title: 'AI Chat Assistant',
      description: 'Intelligent conversations powered by advanced AI models including GPT-4, Claude, and Gemini.',
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      icon: Code,
      title: 'Code Studio',
      description: 'Write, debug, and optimize code with AI assistance. Supports multiple programming languages.',
      gradient: 'from-purple-500 to-pink-600',
    },
    {
      icon: Palette,
      title: 'Design Studio',
      description: 'Create stunning designs with AI-powered tools. Generate images, mockups, and creative assets.',
      gradient: 'from-orange-500 to-red-600',
    },
    {
      icon: Sparkles,
      title: 'Custom AI Personality',
      description: 'Personalize your AI assistant with different personalities, creativity levels, and response styles.',
      gradient: 'from-green-500 to-teal-600',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Optimized performance with instant responses and real-time collaboration capabilities.',
      gradient: 'from-yellow-500 to-orange-600',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Enterprise-grade security with end-to-end encryption. Your data stays private and protected.',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      icon: Globe,
      title: 'Multi-Language Support',
      description: 'Communicate in multiple languages with automatic translation and localization features.',
      gradient: 'from-pink-500 to-rose-600',
    },
    {
      icon: Cpu,
      title: 'Advanced AI Models',
      description: 'Access to the latest AI models from OpenAI, Anthropic, and Google for superior results.',
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      icon: Database,
      title: 'Cloud Storage',
      description: 'Store and manage your projects, chats, and creations with unlimited cloud storage.',
      gradient: 'from-teal-500 to-cyan-600',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel backdrop-blur-3xl border border-white/20 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="sticky top-0 glass-panel backdrop-blur-3xl border-b border-white/10 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-3xl font-bold text-white">Features</h2>
            <p className="text-white/60 text-sm mt-1">Discover what makes KroniQ powerful</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all button-press"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto scrollbar-thin max-h-[calc(90vh-100px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="glass-panel glass-panel-hover rounded-2xl p-6 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/70 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 glass-panel rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Coming Soon
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-white/70">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2" />
                  <div>
                    <p className="font-medium text-white">Team Collaboration</p>
                    <p className="text-sm text-white/60">Work together in real-time with your team</p>
                  </div>
                </div>
              </div>
              <div className="text-white/70">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2" />
                  <div>
                    <p className="font-medium text-white">API Access</p>
                    <p className="text-sm text-white/60">Integrate KroniQ into your own applications</p>
                  </div>
                </div>
              </div>
              <div className="text-white/70">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2" />
                  <div>
                    <p className="font-medium text-white">Advanced Analytics</p>
                    <p className="text-sm text-white/60">Track usage, performance, and insights</p>
                  </div>
                </div>
              </div>
              <div className="text-white/70">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2" />
                  <div>
                    <p className="font-medium text-white">Voice Assistant</p>
                    <p className="text-sm text-white/60">Interact with AI using voice commands</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
