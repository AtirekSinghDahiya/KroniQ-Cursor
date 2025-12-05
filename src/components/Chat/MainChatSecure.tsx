import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChatSidebar } from './ChatSidebar';
import { FloatingNavbar } from '../Layout/FloatingNavbar';
import {
  createProject,
  createMessage,
  subscribeToProjects,
  subscribeToMessages,
  type Project,
  type Message
} from '../../lib/dataService';
import {
  generateAIResponse,
  classifyIntent,
  type AIMessage
} from '../../lib/aiServiceSecure';
import { MessageCreditsService } from '../../lib/messageCreditsService';

export const MainChat: React.FC = () => {
  const { showToast } = useToast();
  const { navigateTo } = useNavigation();
  const { currentUser, userData } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider] = useState<string>('openai');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToProjects((loadedProjects) => {
      setProjects(loadedProjects);
    });

    return unsubscribe;
  }, [currentUser]);

  useEffect(() => {
    if (!activeProjectId) {
      setMessages([]);
      return;
    }

    const unsubscribe = subscribeToMessages(activeProjectId, (loadedMessages) => {
      setMessages(loadedMessages);
    });

    return unsubscribe;
  }, [activeProjectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    setInputValue('');
    setIsLoading(true);

    try {
      if (!user?.uid) {
        throw new Error('Not authenticated');
      }

      const creditCheck = await MessageCreditsService.checkAndResetLimits(user.uid);
      if (!creditCheck.success) {
        throw new Error('Failed to check message credits');
      }

      const credits = await MessageCreditsService.getUserCredits(user.uid);
      if (!credits || !MessageCreditsService.canSendMessage(credits)) {
        const upgradeMsg = MessageCreditsService.getUpgradeMessage(credits!);
        showToast('error', 'Message Limit Reached', upgradeMsg || 'You have reached your message limit');
        setIsLoading(false);
        return;
      }

      const intent = await classifyIntent(text);

      if (intent.intent !== 'chat' && intent.confidence >= 0.7 && !activeProjectId) {
        const project = await createProject(
          `${intent.intent} Project`,
          intent.intent as Project['type'],
          text.substring(0, 100),
          selectedProvider
        );

        showToast('success', 'Opening Studio', `Opening ${intent.intent} studio...`);

        setTimeout(() => {
          navigateTo(intent.intent as any, project);
        }, 500);

        setIsLoading(false);
        return;
      }

      let projectId = activeProjectId;
      if (!projectId) {
        const project = await createProject('New Chat', 'chat', text, selectedProvider);
        projectId = project.id;
        setActiveProjectId(projectId);
      }

      await createMessage(projectId, 'user', text);

      const deductResult = await MessageCreditsService.deductMessageCredit(
        user.uid,
        selectedProvider,
        'chat'
      );

      if (!deductResult.success) {
        throw new Error(deductResult.error || 'Failed to deduct message credit');
      }

      const aiMessages: AIMessage[] = messages.slice(-10).map(msg => ({
        role: msg.role === 'system' ? 'system' : msg.role,
        content: msg.content
      }));
      aiMessages.push({ role: 'user', content: text });

      const preferences = {
        personality: userData?.aiPersonality || 'balanced',
        creativityLevel: userData?.aiCreativityLevel || 5,
        responseLength: userData?.aiResponseLength || 'medium'
      };

      const response = await generateAIResponse(
        projectId,
        aiMessages,
        selectedProvider,
        preferences
      );

      await createMessage(projectId, 'assistant', response);

      if (deductResult.messages_remaining !== undefined) {
        const remaining = deductResult.messages_remaining;
        if (remaining <= 5 && remaining > 0) {
          showToast('warning', 'Low Credits', `You have ${remaining} messages remaining`);
        }
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      showToast('error', 'Error', error.message || 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderLandingView = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-2xl">
        <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Welcome to KroniQ AI
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Start a conversation or describe what you want to create
        </p>
        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/50 transition-colors cursor-pointer">
            <h3 className="font-semibold text-white mb-2">Chat</h3>
            <p className="text-sm text-gray-400">General conversation and assistance</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors cursor-pointer">
            <h3 className="font-semibold text-white mb-2">Code</h3>
            <p className="text-sm text-gray-400">Build apps and write code</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-pink-500/50 transition-colors cursor-pointer">
            <h3 className="font-semibold text-white mb-2">Design</h3>
            <p className="text-sm text-gray-400">Create graphics and designs</p>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-green-500/50 transition-colors cursor-pointer">
            <h3 className="font-semibold text-white mb-2">Video</h3>
            <p className="text-sm text-gray-400">Edit and create videos</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessages = () => (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[70%] p-4 rounded-2xl ${
              message.role === 'user'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                : 'bg-white/5 border border-white/10 text-gray-100'
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start">
          <div className="max-w-[70%] p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <ChatSidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(project) => setActiveProjectId(project.id)}
        onNewChat={() => setActiveProjectId(null)}
      />

      <div className="flex-1 flex flex-col">
        <FloatingNavbar />

        {!activeProjectId && messages.length === 0 ? renderLandingView() : renderMessages()}

        <div className="p-4 border-t border-white/10 bg-gray-900/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full p-4 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
