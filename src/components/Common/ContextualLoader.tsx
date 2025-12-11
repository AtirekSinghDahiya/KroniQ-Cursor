/**
 * Contextual Loader Component
 * Shows themed loading animations based on what's being generated
 */

import React from 'react';
import {
  Loader2,
  Music,
  Video,
  Image,
  Code,
  Rocket,
  Sparkles,
  Brain,
  Palette,
  FileText,
  Mic,
  BookOpen,
  Zap,
  Star,
  Globe
} from 'lucide-react';

export type LoadingContext =
  | 'space'
  | 'music'
  | 'video'
  | 'image'
  | 'code'
  | 'ai'
  | 'design'
  | 'document'
  | 'voice'
  | 'general';

interface ContextualLoaderProps {
  context: LoadingContext;
  message?: string;
  className?: string;
}

const contextConfig: Record<LoadingContext, {
  icon: React.ComponentType<{ className?: string }>;
  colors: string;
  particles: string[];
  animation: string;
  label: string;
}> = {
  space: {
    icon: Rocket,
    colors: 'from-pink-500 via-purple-500 to-pink-500',
    particles: ['🌟', '✨', '🚀', '🌙', '⭐'],
    animation: 'animate-bounce',
    label: 'Launching into space...'
  },
  music: {
    icon: Music,
    colors: 'from-green-500 via-teal-500 to-cyan-500',
    particles: ['🎵', '🎶', '🎸', '🎹', '🎤'],
    animation: 'animate-pulse',
    label: 'Composing your melody...'
  },
  video: {
    icon: Video,
    colors: 'from-red-500 via-orange-500 to-yellow-500',
    particles: ['🎬', '🎥', '🎞️', '📹', '🎪'],
    animation: 'animate-spin',
    label: 'Generating video...'
  },
  image: {
    icon: Image,
    colors: 'from-purple-500 via-pink-500 to-rose-500',
    particles: ['🎨', '🖼️', '🌈', '✨', '💎'],
    animation: 'animate-pulse',
    label: 'Creating your image...'
  },
  code: {
    icon: Code,
    colors: 'from-emerald-500 via-green-500 to-teal-500',
    particles: ['💻', '⚡', '🔧', '🛠️', '⚙️'],
    animation: 'animate-pulse',
    label: 'Writing code...'
  },
  ai: {
    icon: Brain,
    colors: 'from-purple-500 via-pink-500 to-cyan-500',
    particles: ['🤖', '🧠', '✨', '💡', '🔮'],
    animation: 'animate-pulse',
    label: 'AI is thinking...'
  },
  design: {
    icon: Palette,
    colors: 'from-pink-500 via-purple-500 to-purple-500',
    particles: ['🎨', '✨', '🌈', '💫', '🎭'],
    animation: 'animate-pulse',
    label: 'Designing...'
  },
  document: {
    icon: FileText,
    colors: 'from-pink-500 via-purple-500 to-purple-500',
    particles: ['📄', '✍️', '📝', '📋', '📑'],
    animation: 'animate-pulse',
    label: 'Creating document...'
  },
  voice: {
    icon: Mic,
    colors: 'from-orange-500 via-red-500 to-pink-500',
    particles: ['🎙️', '🔊', '🎵', '🗣️', '💬'],
    animation: 'animate-pulse',
    label: 'Recording voice...'
  },
  general: {
    icon: Sparkles,
    colors: 'from-gray-500 via-gray-400 to-gray-300',
    particles: ['✨', '💫', '⭐', '🌟', '✴️'],
    animation: 'animate-spin',
    label: 'Processing...'
  }
};

export const ContextualLoader: React.FC<ContextualLoaderProps> = ({
  context,
  message,
  className = ''
}) => {
  const config = contextConfig[context];
  const Icon = config.icon;

  return (
    <div className={`flex flex-col items-center justify-center gap-6 py-8 ${className}`}>
      {/* Main Icon with Glow */}
      <div className="relative">
        {/* Glow effect */}
        <div className={`absolute inset-0 bg-gradient-to-r ${config.colors} blur-2xl opacity-50 animate-pulse`} />

        {/* Icon */}
        <div className={`relative p-6 rounded-full bg-gradient-to-r ${config.colors} shadow-2xl ${config.animation}`}>
          <Icon className="w-12 h-12 text-white" />
        </div>

        {/* Orbiting particles */}
        <div className="absolute inset-0 animate-spin-slow">
          {config.particles.slice(0, 3).map((particle, i) => (
            <div
              key={i}
              className="absolute text-2xl animate-pulse"
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 120}deg) translateY(-60px)`,
                animationDelay: `${i * 0.2}s`
              }}
            >
              {particle}
            </div>
          ))}
        </div>
      </div>

      {/* Loading bar */}
      <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${config.colors} animate-loading-bar`} />
      </div>

      {/* Message */}
      <div className="text-center space-y-2">
        <p className="text-white font-semibold text-lg">
          {message || config.label}
        </p>
        <div className="flex items-center justify-center gap-1">
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* Floating particles background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {config.particles.map((particle, i) => (
          <div
            key={`bg-${i}`}
            className="absolute text-4xl opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          >
            {particle}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Detect context from message content
 */
export function detectLoadingContext(message: string): LoadingContext {
  const lower = message.toLowerCase();

  if (/space|rocket|planet|star|galaxy|cosmos|astro|universe/i.test(lower)) return 'space';
  if (/music|song|audio|sound|melody|beat|track|compose/i.test(lower)) return 'music';
  if (/video|clip|movie|film|footage|animation/i.test(lower)) return 'video';
  if (/image|photo|picture|draw|paint|art|illustration/i.test(lower)) return 'image';
  if (/code|program|function|script|algorithm|debug|api/i.test(lower)) return 'code';
  if (/voice|speak|talk|narrate|voiceover/i.test(lower)) return 'voice';
  if (/design|ui|ux|interface|layout|mockup/i.test(lower)) return 'design';
  if (/document|report|paper|essay|article|presentation|slide/i.test(lower)) return 'document';

  return 'ai';
}
