import React, { useRef, useState } from 'react';
import { ArrowUp, Paperclip, Mic, Image as ImageIcon, MoreHorizontal, Brain, Zap, Search, X, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { enhancePrompt, isPromptEnhancementAvailable } from '../../lib/promptEnhancer';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (attachments?: File[], options?: string[]) => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  selectedModel: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  attachedFiles?: File[];
  onFilesChange?: (files: File[]) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  onKeyPress,
  placeholder = 'Type your message...',
  disabled = false,
  conversationHistory,
  attachedFiles: externalFiles,
  onFilesChange,
}) => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>(externalFiles || []);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const chatOptions = [
    { id: 'deep-research', label: 'Deep Research', icon: Search, color: 'cyan' },
    { id: 'think-longer', label: 'Think Longer', icon: Brain, color: 'purple' },
    { id: 'creative-mode', label: 'Creative Mode', icon: Zap, color: 'orange' },
  ];

  const toggleOption = (optionId: string) => {
    setSelectedOptions(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newFiles = [...attachedFiles, ...files];
      setAttachedFiles(newFiles);
      if (onFilesChange) {
        onFilesChange(newFiles);
      }
      showToast('success', 'Files Attached', `${files.length} file(s) attached`);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = attachedFiles.filter((_, i) => i !== index);
    setAttachedFiles(newFiles);
    if (onFilesChange) {
      onFilesChange(newFiles);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      const newFiles = [...attachedFiles, ...files];
      setAttachedFiles(newFiles);
      if (onFilesChange) {
        onFilesChange(newFiles);
      }
      showToast('success', 'Image Pasted', `${files.length} image(s) pasted from clipboard`);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!value.trim() || isEnhancing) return;

    if (!isPromptEnhancementAvailable()) {
      showToast('error', 'Feature Unavailable', 'Prompt enhancement requires API configuration');
      return;
    }

    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(value);
      onChange(enhanced);
      showToast('success', 'Prompt Enhanced!', 'Your prompt has been improved');
    } catch (error: any) {
      showToast('error', 'Enhancement Failed', error.message || 'Could not enhance prompt');
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Active Options Display */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((optionId) => {
            const option = chatOptions.find(o => o.id === optionId);
            if (!option) return null;
            const Icon = option.icon;
            return (
              <div
                key={optionId}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  option.color === 'cyan'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : option.color === 'purple'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                    : 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{option.label}</span>
                <button
                  onClick={() => toggleOption(optionId)}
                  className="ml-1 hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Attached Files Preview */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachedFiles.map((file, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                theme === 'light'
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-white/10 text-white'
              }`}
            >
              <Paperclip className="w-4 h-4" />
              <span className="max-w-[150px] truncate">{file.name}</span>
              <button
                onClick={() => handleRemoveFile(index)}
                className="ml-1 hover:text-red-500"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Container */}
      <div className="w-full">
        <div className={`relative rounded-2xl shadow-lg border-2 ${
          theme === 'light'
            ? 'bg-white/95 backdrop-blur-xl border-gray-200'
            : 'bg-white/10 backdrop-blur-xl border-white/20'
        }`}>
          <div className="flex items-end gap-2 p-2">
            {/* Left Action Buttons */}
            <div className="flex items-center gap-1 pb-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileAttach}
                className="hidden"
                accept="*/*"
              />
              <input
                ref={imageInputRef}
                type="file"
                multiple
                onChange={handleFileAttach}
                className="hidden"
                accept="image/*"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'light'
                    ? 'hover:bg-gray-100 text-gray-600'
                    : 'hover:bg-white/10 text-gray-400'
                }`}
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                onClick={() => imageInputRef.current?.click()}
                disabled={disabled}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'light'
                    ? 'hover:bg-gray-100 text-gray-600'
                    : 'hover:bg-white/10 text-gray-400'
                }`}
                title="Upload image"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              {/* Enhance Prompt Button */}
              {isPromptEnhancementAvailable() && (
                <button
                  onClick={handleEnhancePrompt}
                  disabled={disabled || isEnhancing || !value.trim()}
                  className={`p-2 rounded-lg transition-all ${
                    isEnhancing
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse'
                      : disabled || !value.trim()
                      ? theme === 'light'
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 cursor-not-allowed'
                      : theme === 'light'
                      ? 'hover:bg-purple-100 text-purple-600'
                      : 'hover:bg-purple-500/20 text-purple-400'
                  }`}
                  title={isEnhancing ? 'Enhancing...' : 'Enhance prompt with AI'}
                >
                  <Sparkles className={`w-4 h-4 ${isEnhancing ? 'animate-spin' : ''}`} />
                </button>
              )}

              {/* More Actions Button */}
              <div className="relative">
                <button
                  onClick={() => setShowMoreActions(!showMoreActions)}
                  disabled={disabled}
                  className={`p-2 rounded-lg transition-colors ${
                    showMoreActions
                      ? theme === 'light'
                        ? 'bg-gray-200 text-gray-700'
                        : 'bg-white/20 text-white'
                      : theme === 'light'
                      ? 'hover:bg-gray-100 text-gray-600'
                      : 'hover:bg-white/10 text-gray-400'
                  }`}
                  title="More actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {/* More Actions Dropdown */}
                {showMoreActions && (
                  <div
                    className={`absolute bottom-full left-0 mb-2 p-2 rounded-xl shadow-2xl border z-50 min-w-[200px] ${
                      theme === 'light'
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-900 border-white/20'
                    }`}
                  >
                    {chatOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = selectedOptions.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() => {
                            toggleOption(option.id);
                            setShowMoreActions(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isSelected
                              ? option.color === 'cyan'
                                ? 'bg-cyan-500/20 text-cyan-400'
                                : option.color === 'purple'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-orange-500/20 text-orange-400'
                              : theme === 'light'
                                ? 'hover:bg-gray-100 text-gray-700'
                                : 'hover:bg-white/10 text-white/80'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Text Input */}
            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
              }}
              onKeyPress={onKeyPress}
              onPaste={handlePaste}
              placeholder={placeholder}
              disabled={disabled}
              className={`flex-1 bg-transparent px-4 py-3 resize-none focus:outline-none text-sm font-medium ${
                theme === 'light'
                  ? 'text-gray-800 placeholder-gray-400'
                  : 'text-white/90 placeholder-white/40'
              }`}
              rows={1}
              style={{ minHeight: '24px', maxHeight: '200px' }}
            />

            {/* Right Action Buttons */}
            <div className="flex items-center gap-1 pb-2">
              <button
                onClick={() => showToast('info', 'Coming Soon', 'Voice input coming soon!')}
                disabled={disabled}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'light'
                    ? 'hover:bg-gray-100 text-gray-600'
                    : 'hover:bg-white/10 text-gray-400'
                }`}
                title="Voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  console.log('💬 Send button clicked!');
                  console.log('💬 Value:', value);
                  console.log('💬 Files:', attachedFiles.length);
                  console.log('💬 Options:', selectedOptions);
                  console.log('💬 Disabled:', disabled);
                  onSend(attachedFiles.length > 0 ? attachedFiles : undefined, selectedOptions.length > 0 ? selectedOptions : undefined);
                  setAttachedFiles([]);
                  setSelectedOptions([]);
                  if (onFilesChange) {
                    onFilesChange([]);
                  }
                }}
                disabled={(!value.trim() && attachedFiles.length === 0) || disabled}
                className={`p-2 rounded-xl transition-all ${
                  value.trim() && !disabled
                    ? theme === 'light'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500'
                    : theme === 'light'
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-center justify-center px-2">
        <p className={`text-xs ${
          theme === 'light' ? 'text-gray-400' : 'text-white/30'
        }`}>
          KroniQ can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
};
