import React, { useState } from 'react';
import {
  Home,
  Sparkles,
  Image as ImageIcon,
  Video,
  Music,
  FileCode,
  Send,
  Menu,
  Settings,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { ProfileButton } from '../Common/ProfileButton';

type TabType = 'featured' | 'chat' | 'images' | 'video' | 'audio' | 'code';
type StudioType = 'chat' | 'image' | 'video' | 'audio' | 'code' | 'ppt';

export const MainChatNew: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const { navigateTo } = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('featured');
  const [activeStudio, setActiveStudio] = useState<StudioType | null>(null);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [systemInstructions, setSystemInstructions] = useState('');
  const [showSettings, setShowSettings] = useState(true);

  // If a studio is active, render that studio component
  if (activeStudio === 'code') {
    return <div>Code Studio Component</div>;
  }
  if (activeStudio === 'image') {
    return <div>Image Studio Component</div>;
  }
  if (activeStudio === 'video') {
    return <div>Video Studio Component</div>;
  }
  if (activeStudio === 'audio') {
    return <div>Audio Studio Component</div>;
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-60 bg-[#1a1a1a] border-r border-white/10 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Menu className="w-5 h-5 text-white/70" />
            <h1 className="text-lg font-semibold">Kroniq AI</h1>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-white/80 hover:text-white">
            <Home className="w-4 h-4" />
            <span className="text-sm">Home</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-white/80 hover:text-white mt-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">Playground</span>
          </button>

          <div className="mt-6 mb-2 px-3">
            <span className="text-xs text-white/40 uppercase tracking-wider">Recent</span>
          </div>

          <div className="space-y-0.5">
            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-white/60 hover:text-white truncate">
              Untitled conversation
            </button>
          </div>
        </div>

        {/* Bottom section */}
        <div className="p-3 border-t border-white/10 space-y-2">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-white/70 hover:text-white">
            <Settings className="w-4 h-4" />
            <span className="text-sm">Settings</span>
          </button>
          <div className="px-3 py-2">
            <div className="text-xs text-white/40">
              {currentUser?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar with Title */}
        <div className="h-14 bg-[#1a1a1a] border-b border-white/10 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <Menu className="w-4 h-4 text-white/70" />
            </button>
            <span className="text-sm font-medium text-white/90">Untitled prompt</span>
            <button className="text-white/50 hover:text-white/80">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <ProfileButton tokenBalance={userData?.tokensLimit || 0} />
          </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Content Header with Logo */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-4xl w-full">
              <h1 className="text-5xl font-semibold text-center mb-8">
                Kroniq AI Studio
              </h1>

              {/* Tabs */}
              <div className="flex items-center justify-center gap-6 mb-12">
                <button
                  onClick={() => setActiveTab('featured')}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                    activeTab === 'featured'
                      ? 'text-white border-blue-500'
                      : 'text-white/50 border-transparent hover:text-white/70'
                  }`}
                >
                  Featured
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                    activeTab === 'chat'
                      ? 'text-white border-blue-500'
                      : 'text-white/50 border-transparent hover:text-white/70'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('images')}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                    activeTab === 'images'
                      ? 'text-white border-blue-500'
                      : 'text-white/50 border-transparent hover:text-white/70'
                  }`}
                >
                  Images
                </button>
                <button
                  onClick={() => setActiveTab('video')}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                    activeTab === 'video'
                      ? 'text-white border-blue-500'
                      : 'text-white/50 border-transparent hover:text-white/70'
                  }`}
                >
                  Video
                </button>
                <button
                  onClick={() => setActiveTab('audio')}
                  className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                    activeTab === 'audio'
                      ? 'text-white border-blue-500'
                      : 'text-white/50 border-transparent hover:text-white/70'
                  }`}
                >
                  Audio
                </button>
              </div>

              {/* Model Cards */}
              <div className="space-y-3 max-w-2xl mx-auto">
                <button
                  onClick={() => setActiveStudio('chat')}
                  className="w-full flex items-center gap-4 p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl transition-all text-left group"
                >
                  <div className="p-3 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white/90">GPT-4 Turbo</h3>
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">NEW</span>
                    </div>
                    <p className="text-xs text-white/50">Advanced AI model with reasoning capabilities</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </button>

                <button
                  onClick={() => setActiveStudio('image')}
                  className="w-full flex items-center gap-4 p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl transition-all text-left group"
                >
                  <div className="p-3 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                    <ImageIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white/90 mb-1">DALL-E 3</h3>
                    <p className="text-xs text-white/50">Generate high-quality images from text</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveStudio('video')}
                  className="w-full flex items-center gap-4 p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl transition-all text-left group"
                >
                  <div className="p-3 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                    <Video className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white/90 mb-1">Sora</h3>
                    <p className="text-xs text-white/50">Create videos from text descriptions</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveStudio('audio')}
                  className="w-full flex items-center gap-4 p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl transition-all text-left group"
                >
                  <div className="p-3 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                    <Music className="w-5 h-5 text-pink-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white/90 mb-1">Music Generator</h3>
                    <p className="text-xs text-white/50">Generate music and audio</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveStudio('code')}
                  className="w-full flex items-center gap-4 p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl transition-all text-left group"
                >
                  <div className="p-3 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                    <FileCode className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white/90 mb-1">Code Assistant</h3>
                    <p className="text-xs text-white/50">Build applications with AI</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-white/10 bg-[#1a1a1a] p-4">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/20 resize-none"
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '200px' }}
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 text-xs text-white/50 hover:text-white/70">
                    <Sparkles className="w-3 h-3" />
                    <span>Model: {selectedModel}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-xs text-white/40">
                  {userData?.tokensLimit?.toLocaleString() || 0} tokens
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Settings */}
      {showSettings && (
        <div className="w-80 bg-[#1a1a1a] border-l border-white/10 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Model Selection */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-white/70 mb-2">
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/20"
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="claude-sonnet">Claude Sonnet</option>
              </select>
            </div>

            {/* System Instructions */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-white/70 mb-2">
                System Instructions
              </label>
              <textarea
                value={systemInstructions}
                onChange={(e) => setSystemInstructions(e.target.value)}
                placeholder="Optional tone and style instructions..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder-white/30 focus:outline-none focus:border-white/20 resize-none"
                rows={4}
              />
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-xs font-medium text-white/70 mb-2">
                Temperature
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                className="w-full"
              />
              <div className="flex justify-between text-xs text-white/40 mt-1">
                <span>Precise</span>
                <span>Creative</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
