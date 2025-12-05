/**
 * StudioMessageView - Chat-like message display for studios
 * Shows user prompts and model responses with generated content
 */

import React, { useRef, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Download, Copy, User, Bot } from 'lucide-react';
import { MarkdownRenderer } from '../MarkdownRenderer';

export interface StudioMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  payload?: any;
  created_at?: string;
}

interface StudioMessageViewProps {
  messages: StudioMessage[];
  onDownload?: (url: string, filename?: string) => void;
  onCopy?: (content: string) => void;
  renderMedia?: (message: StudioMessage) => React.ReactNode;
}

export const StudioMessageView: React.FC<StudioMessageViewProps> = ({
  messages,
  onDownload,
  onCopy,
  renderMedia
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-6 p-6">
      {messages.map((message, index) => (
        <div
          key={message.id || index}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`flex gap-3 max-w-3xl ${
              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            {/* Avatar */}
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-purple-500/20 text-purple-400'
              }`}
            >
              {message.role === 'user' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            {/* Message Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-white">
                  {message.role === 'user' ? 'User' : 'Model'}
                </span>
                {message.created_at && (
                  <span className="text-xs text-gray-500">
                    {formatTime(message.created_at)}
                  </span>
                )}
              </div>

              {/* Content */}
              <div
                className={`rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-500/10 border border-blue-500/20'
                    : 'bg-gray-800/50 border border-gray-700/50'
                }`}
              >
                {/* Text Content */}
                {message.content && (
                  <div className="prose prose-invert max-w-none mb-3">
                    <MarkdownRenderer content={message.content} />
                  </div>
                )}

                {/* Media Content (images, audio, video, etc.) */}
                {renderMedia && message.role === 'assistant' && message.payload && (
                  <div className="mt-3">
                    {renderMedia(message)}
                  </div>
                )}

                {/* Action Buttons for Assistant Messages */}
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-700/50">
                    <button
                      onClick={() => onCopy?.(message.content)}
                      className="p-1.5 rounded hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
                      title="Copy"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 rounded hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
                      title="Like"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      className="p-1.5 rounded hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
                      title="Dislike"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                    {message.payload?.url && onDownload && (
                      <button
                        onClick={() => onDownload(message.payload.url)}
                        className="p-1.5 rounded hover:bg-white/5 transition-colors text-gray-400 hover:text-white ml-auto"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
