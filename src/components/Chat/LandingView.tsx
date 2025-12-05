import React, { useEffect, useState, useRef } from 'react';
import { ImageIcon, Video, Send, Sparkles, ArrowRight, Presentation, Music, Paperclip, Image, File } from 'lucide-react';
import { CompactModelSelector } from './CompactModelSelector';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface LandingViewProps {
  onQuickAction: (prompt: string, attachments?: File[]) => void;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onQuickAction, selectedModel = 'gpt-4o', onModelChange }) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [limits, setLimits] = useState({ images: 5, videos: 1, songs: 5, ppts: 5 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchLimits();
  }, [user]);

  const fetchLimits = async () => {
    if (!user) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data } = await supabase
      .from('daily_usage_limits')
      .select('feature_type')
      .eq('user_id', user.uid)
      .gte('created_at', startOfMonth);

    const usage = data || [];
    const imageCount = usage.filter(u => u.feature_type === 'image_generation').length;
    const videoCount = usage.filter(u => u.feature_type === 'video_generation').length;
    const songCount = usage.filter(u => u.feature_type === 'music_generation').length;
    const pptCount = usage.filter(u => u.feature_type === 'presentation_generation').length;

    setLimits({
      images: Math.max(0, 5 - imageCount),
      videos: Math.max(0, 1 - videoCount),
      songs: Math.max(0, 5 - songCount),
      ppts: Math.max(0, 5 - pptCount)
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() || attachedFiles.length > 0) {
      onQuickAction(input || 'Please analyze these files', attachedFiles);
      setInput('');
      setAttachedFiles([]);
    }
  };

  const suggestions = [
    {
      icon: ImageIcon,
      title: 'Generate Image',
      prompt: 'Create an image of a sunset over mountains',
      remaining: limits.images,
      total: 5
    },
    {
      icon: Video,
      title: 'Generate Video',
      prompt: 'Generate a video of ocean waves',
      remaining: limits.videos,
      total: 1
    },
    {
      icon: Presentation,
      title: 'Create PPT',
      prompt: 'Create a presentation about AI',
      remaining: limits.ppts,
      total: 5
    },
    {
      icon: Music,
      title: 'Generate Song',
      prompt: 'Create a calm instrumental music',
      remaining: limits.songs,
      total: 5
    }
  ];

  return (
    <div className="h-full flex flex-col p-4 md:p-6">
      <div className="flex-1 flex flex-col items-center justify-center max-w-4xl w-full mx-auto">
        {/* Logo and Title */}
        <div className={`text-center mb-8 md:mb-12 ${mounted ? 'opacity-100 transition-opacity duration-700' : 'opacity-0'}`}>
          <img
            src="/Black_Blue_White_Modern_Simple_Minimal_Gradient_Circle__Neon_Technology__AI_Logo__1_-removebg-preview copy.png"
            alt="KroniQ"
            className="h-48 sm:h-56 md:h-64 lg:h-72 w-auto object-contain mb-3 mx-auto drop-shadow-[0_0_20px_rgba(0,255,240,0.5)]"
          />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium text-white mb-3">
            Welcome to KroniQ
          </h1>
          <p className="text-white/60 text-sm md:text-base">
            How can I help you today?
          </p>
        </div>

        {/* Suggestion Cards */}
        <div className={`grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 w-full ${mounted ? 'opacity-100 transition-opacity duration-700 delay-200' : 'opacity-0'}`}>
          {suggestions.map((suggestion, index) => {
            const Icon = suggestion.icon;
            return (
              <button
                key={index}
                onClick={() => onQuickAction(suggestion.prompt)}
                className="group flex flex-col items-start gap-2 md:gap-3 p-3 md:p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-200 text-left active:scale-95"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="p-1.5 md:p-2 rounded-lg bg-white/5">
                    <Icon className="w-4 h-4 md:w-5 md:h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                  </div>
                  {user && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/70">
                      {suggestion.remaining}/{suggestion.total}
                    </span>
                  )}
                </div>
                <span className="text-xs md:text-sm text-white/90 group-hover:text-white transition-colors font-medium leading-snug">
                  {suggestion.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Area - Fixed at Bottom */}
      <div className={`w-full max-w-4xl mx-auto mt-auto ${mounted ? 'opacity-100 transition-opacity duration-700 delay-400' : 'opacity-0'}`}>
          <form
            onSubmit={handleSubmit}
            className="relative"
          >
            {onModelChange && (
              <div className="mb-3">
                <CompactModelSelector
                  selectedModel={selectedModel}
                  onModelChange={onModelChange}
                  category="chat"
                />
              </div>
            )}

            {attachedFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white"
                  >
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex items-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors focus-within:border-white/30">
              <div className="flex items-center gap-1 pl-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title="Upload image"
                >
                  <Image className="w-5 h-5" />
                </button>
              </div>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message KroniQ..."
                className="flex-1 bg-transparent px-5 py-4 text-white text-sm placeholder-white/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() && attachedFiles.length === 0}
                className="mr-3 p-2 bg-white text-slate-900 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-white/30 text-center mt-3">
              KroniQ can make mistakes. Check important info.
            </p>
          </form>
        </div>
    </div>
  );
};
