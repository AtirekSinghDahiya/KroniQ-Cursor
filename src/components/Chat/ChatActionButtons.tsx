import React from 'react';
import { Paperclip, Image as ImageIcon, Mic, Globe, Brain, Clock, Sparkles } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface ChatActionButtonsProps {
  selectedModel: string;
  onAttachFile?: () => void;
  onUploadImage?: () => void;
  onRecordVoice?: () => void;
  onSearchWeb?: () => void;
  onDeepResearch?: () => void;
  onThinkLonger?: () => void;
}

const MODEL_CAPABILITIES: Record<string, {
  attachFile: boolean;
  uploadImage: boolean;
  recordVoice: boolean;
  searchWeb: boolean;
  deepResearch: boolean;
  thinkLonger: boolean;
}> = {
  'grok-2': { attachFile: true, uploadImage: true, recordVoice: true, searchWeb: true, deepResearch: true, thinkLonger: true },
  'grok-4': { attachFile: true, uploadImage: true, recordVoice: true, searchWeb: true, deepResearch: true, thinkLonger: true },
  'gpt-5': { attachFile: true, uploadImage: true, recordVoice: true, searchWeb: true, deepResearch: true, thinkLonger: true },
  'gpt-5-chat': { attachFile: true, uploadImage: true, recordVoice: true, searchWeb: true, deepResearch: true, thinkLonger: true },
  'claude-sonnet': { attachFile: true, uploadImage: true, recordVoice: true, searchWeb: true, deepResearch: true, thinkLonger: true },
  'claude-3.5-sonnet': { attachFile: true, uploadImage: true, recordVoice: true, searchWeb: true, deepResearch: true, thinkLonger: true },
  'nemotron': { attachFile: true, uploadImage: false, recordVoice: true, searchWeb: true, deepResearch: true, thinkLonger: true },
  'qwen': { attachFile: true, uploadImage: false, recordVoice: true, searchWeb: true, deepResearch: true, thinkLonger: true },
  'qwen-thinking': { attachFile: true, uploadImage: false, recordVoice: true, searchWeb: true, deepResearch: true, thinkLonger: true },
  'deepseek': { attachFile: true, uploadImage: false, recordVoice: true, searchWeb: true, deepResearch: true, thinkLonger: true },
  'gemini': { attachFile: true, uploadImage: true, recordVoice: true, searchWeb: true, deepResearch: true, thinkLonger: true },
  'gemini-flash': { attachFile: true, uploadImage: true, recordVoice: true, searchWeb: true, deepResearch: true, thinkLonger: true },
  'kimi': { attachFile: true, uploadImage: false, recordVoice: true, searchWeb: true, deepResearch: true, thinkLonger: true },
  'chatgpt-image': { attachFile: true, uploadImage: true, recordVoice: true, searchWeb: true, deepResearch: true, thinkLonger: true },
};

export const ChatActionButtons: React.FC<ChatActionButtonsProps> = ({
  selectedModel,
  onAttachFile,
  onUploadImage,
  onRecordVoice,
  onSearchWeb,
  onDeepResearch,
  onThinkLonger,
}) => {
  const { theme } = useTheme();

  const capabilities = MODEL_CAPABILITIES[selectedModel] || {
    attachFile: false,
    uploadImage: false,
    recordVoice: false,
    searchWeb: false,
    deepResearch: false,
    thinkLonger: false,
  };

  const buttonClass = (enabled: boolean) =>
    `p-2 rounded-lg transition-all ${
      enabled
        ? theme === 'light'
          ? 'text-gray-700 hover:bg-gray-100 active:scale-95 cursor-pointer'
          : 'text-white/70 hover:bg-white/10 active:scale-95 cursor-pointer'
        : theme === 'light'
        ? 'text-gray-300 cursor-not-allowed opacity-50'
        : 'text-white/20 cursor-not-allowed opacity-50'
    }`;

  const iconSize = 'w-5 h-5';

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={capabilities.attachFile ? onAttachFile : undefined}
        disabled={!capabilities.attachFile}
        className={buttonClass(capabilities.attachFile)}
        title={capabilities.attachFile ? 'Attach file' : 'File attachment not supported by this model'}
      >
        <Paperclip className={iconSize} />
      </button>

      <button
        onClick={capabilities.uploadImage ? onUploadImage : undefined}
        disabled={!capabilities.uploadImage}
        className={buttonClass(capabilities.uploadImage)}
        title={capabilities.uploadImage ? 'Upload image' : 'Image upload not supported by this model'}
      >
        <ImageIcon className={iconSize} />
      </button>

      <button
        onClick={capabilities.recordVoice ? onRecordVoice : undefined}
        disabled={!capabilities.recordVoice}
        className={buttonClass(capabilities.recordVoice)}
        title={capabilities.recordVoice ? 'Record voice' : 'Voice input not supported by this model'}
      >
        <Mic className={iconSize} />
      </button>

      <div className={`w-px h-6 mx-1 ${theme === 'light' ? 'bg-gray-300' : 'bg-white/20'}`} />

      <button
        onClick={capabilities.searchWeb ? onSearchWeb : undefined}
        disabled={!capabilities.searchWeb}
        className={buttonClass(capabilities.searchWeb)}
        title={capabilities.searchWeb ? 'Search web' : 'Web search not supported by this model'}
      >
        <Globe className={iconSize} />
      </button>

      <button
        onClick={capabilities.deepResearch ? onDeepResearch : undefined}
        disabled={!capabilities.deepResearch}
        className={buttonClass(capabilities.deepResearch)}
        title={capabilities.deepResearch ? 'Deep research mode' : 'Deep research not supported by this model'}
      >
        <Brain className={iconSize} />
      </button>

      <button
        onClick={capabilities.thinkLonger ? onThinkLonger : undefined}
        disabled={!capabilities.thinkLonger}
        className={buttonClass(capabilities.thinkLonger)}
        title={capabilities.thinkLonger ? 'Think longer (extended reasoning)' : 'Extended reasoning not supported by this model'}
      >
        <Clock className={iconSize} />
      </button>
    </div>
  );
};
