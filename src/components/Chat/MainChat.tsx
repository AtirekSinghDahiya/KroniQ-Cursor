/**
 * MainChat Component - Using Supabase
 * Messages appear instantly like ChatGPT
 */

import React, { useState, useEffect, useRef } from 'react';
import { ThumbsUp, ThumbsDown, RotateCw, Copy, MoreHorizontal, Share2, Square, Download } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getOpenRouterResponse, getOpenRouterResponseWithUsage } from '../../lib/openRouterService';
import { classifyIntent, shouldShowConfirmation, shouldAutoRoute } from '../../lib/intentClassifier';
import { ChatSidebar } from './ChatSidebar';
import { LandingView } from './LandingView';
import { MobileLandingView} from './MobileLandingView';
import { StudioLandingView } from './StudioLandingView';
import { IntentDialog } from './IntentDialog';
import { MessageSearchBar } from './MessageSearchBar';
import { GroupedModelSelector } from './GroupedModelSelector';
import { ProfileButton } from '../Common/ProfileButton';
import { CompactModelSelector } from './CompactModelSelector';
import { ChatInput } from './ChatInput';
import { SimpleVideoGenerator } from './SimpleVideoGenerator';
import { VoiceStudio } from './Studios/VoiceStudio';
import { MusicStudio } from './Studios/MusicStudio';
import { TTSStudio } from './Studios/TTSStudio';
import { PPTStudio } from './Studios/PPTStudio';
import { ImageStudio } from './Studios/ImageStudio';
// Studio components disabled
// import { PPTStudio } from '../Studio/PPTStudio';
// import { ImageStudioView } from '../Studio/ImageStudioView';
// import { VideoStudioView } from '../Studio/VideoStudioView';
// import { SimpleMusicStudio } from '../Studio/SimpleMusicStudio';
// import { CodeStudio } from '../Studio/CodeStudio';
import { MarkdownRenderer } from './MarkdownRenderer';
import { MediaPreview } from './MediaPreview';
import { TypingEffect, TypingIndicator } from './TypingEffect';
import { getModelCost, isModelFree } from '../../lib/modelTokenPricing';
import { checkPremiumAccess } from '../../lib/premiumAccessService';
import {
  createProject,
  addMessage,
  getProjects,
  subscribeToProjects,
  subscribeToMessages,
  generateAIProjectName,
  deleteProject,
  renameProject,
  Project,
  Message,
} from '../../lib/chatService';
import { getUserPreferences, generateSystemPrompt, UserPreferences } from '../../lib/userPreferences';
import { checkFeatureAccess, incrementUsage } from '../../lib/subscriptionService';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useStudioMode } from '../../contexts/StudioModeContext';

export const MainChat: React.FC = () => {
  const { showToast } = useToast();
  const { navigateTo } = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { setMode, setProjectId: setStudioProjectId, setIsFullscreenGenerator } = useStudioMode();

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showIntentDialog, setShowIntentDialog] = useState(false);
  const [pendingIntent, setPendingIntent] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState('grok-4-fast');
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [showVideoGenerator, setShowVideoGenerator] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [showTTSStudio, setShowTTSStudio] = useState(false);
  const [voiceoverText, setVoiceoverText] = useState('');
  const [showVoiceGenerator, setShowVoiceGenerator] = useState(false);
  const [showVoiceStudio, setShowVoiceStudio] = useState(false);
  const [showMusicStudio, setShowMusicStudio] = useState(false);
  const [selectedVoiceService, setSelectedVoiceService] = useState<'elevenlabs' | 'gemini'>('elevenlabs');
  const [showPPTGenerator, setShowPPTGenerator] = useState(false);
  const [pptTopic, setPPTTopic] = useState('');
  // Code studio disabled
  // const [showCodeStudio, setShowCodeStudio] = useState(false);
  // const [codePrompt, setCodePrompt] = useState('');
  const [musicPrompt, setMusicPrompt] = useState('');
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingText, setThinkingText] = useState('Thinking...');
  const abortControllerRef = useRef<AbortController | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update studio mode context when generators are shown
  useEffect(() => {
    const isAnyGeneratorOpen = showImageGenerator || showVideoGenerator || showTTSStudio || showVoiceStudio || showMusicStudio;
    setIsFullscreenGenerator(isAnyGeneratorOpen);

    if (showImageGenerator) {
      setMode('image');
      setStudioProjectId(activeProjectId);
    } else if (showVideoGenerator) {
      setMode('video');
      setStudioProjectId(activeProjectId);
    } else if (showVoiceStudio) {
      setMode('voice');
      setStudioProjectId(activeProjectId);
    } else if (showMusicStudio) {
      setMode('music');
      setStudioProjectId(activeProjectId);
    } else if (showTTSStudio) {
      setMode('voice');
      setStudioProjectId(activeProjectId);
    } else {
      setMode('chat');
      setStudioProjectId(activeProjectId);
    }
  }, [showImageGenerator, showVideoGenerator, showTTSStudio, showVoiceStudio, showMusicStudio, activeProjectId, setMode, setStudioProjectId, setIsFullscreenGenerator]);

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await getUserPreferences();
        console.log('✅ User preferences loaded:', prefs);
        setUserPreferences(prefs);
      } catch (error) {
        console.error('❌ Failed to load preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  // Load projects on mount
  useEffect(() => {
    const unsubscribe = subscribeToProjects((loadedProjects) => {
      console.log('📦 Projects loaded:', loadedProjects.length);
      setProjects(loadedProjects);
    });

    return unsubscribe;
  }, []);

  // Load messages when project changes
  useEffect(() => {
    if (!activeProjectId) {
      setMessages([]);
      return;
    }

    console.log('🔄 Setting up real-time for project:', activeProjectId);

    const unsubscribe = subscribeToMessages(activeProjectId, (loadedMessages) => {
      console.log('💬 Real-time update - Messages:', loadedMessages.length);
      setMessages(loadedMessages);
    });

    return () => {
      console.log('🔌 Unsubscribing from:', activeProjectId);
      unsubscribe();
    };
  }, [activeProjectId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // AI classification using keywords
  const classifyIntentWithAI = async (message: string): Promise<any> => {
    try {
      const keywordIntent = classifyIntent(message);

      if (!keywordIntent) {
        throw new Error('Keyword classification failed');
      }

      // Always use keyword intent - skip AI classification to avoid extra API calls
      console.log('✅ Using keyword intent:', keywordIntent);
      return keywordIntent;
    } catch (error) {
      console.error('❌ Intent classification completely failed:', error);
      // Return safe default
      return {
        intent: 'chat',
        confidence: 1.0,
        suggestedStudio: 'Chat Studio',
        reasoning: 'Defaulted to chat due to classification error'
      };
    }
  };

  // Generate dynamic project name from user message
  const generateProjectName = (message: string): string => {
    // Take first 40 chars and make it title-case
    let name = message.substring(0, 40).trim();

    // Remove trailing punctuation
    name = name.replace(/[.!?,;:]$/, '');

    // Add ellipsis if truncated
    if (message.length > 40) {
      name += '...';
    }

    // Capitalize first letter
    name = name.charAt(0).toUpperCase() + name.slice(1);

    return name || 'New Chat';
  };

  // Stop generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setIsThinking(false);
    showToast('info', 'Response Stopped', 'AI response generation has been stopped');
  };

  // Send message
  const handleSendMessage = async (messageText?: string, attachments?: File[], options?: string[]) => {
    console.log('🚀 handleSendMessage CALLED!');
    console.log('📝 messageText:', messageText);
    console.log('📝 inputValue:', inputValue);
    console.log('📎 attachments:', attachments?.length || 0);
    console.log('⚙️ options:', options);

    const textToSend = messageText || inputValue.trim();
    console.log('📝 textToSend:', textToSend);
    console.log('⏳ isLoading:', isLoading);

    if ((!textToSend && (!attachments || attachments.length === 0)) || isLoading) {
      console.warn('⚠️ BLOCKED: No text or attachments, or already loading');
      return;
    }

    // Handle chat options (Deep Research, Think Longer, Creative Mode)
    if (options && options.length > 0) {
      console.log('⚙️ Processing chat options:', options);
      if (options.includes('deep-research')) {
        console.log('🔬 Deep Research mode activated');
        setIsThinking(true);
        setThinkingText('Deep researching...');
      } else if (options.includes('think-longer')) {
        console.log('🧠 Think Longer mode activated');
        setIsThinking(true);
        setThinkingText('Thinking longer...');
      } else if (options.includes('creative-mode')) {
        console.log('🎨 Creative Mode activated');
        setIsThinking(true);
        setThinkingText('Being creative...');
      }
    }

    // CRITICAL: Check token balance FIRST - Block if 0 tokens
    const { data: profile } = await supabase
      .from('profiles')
      .select('tokens_balance, free_tokens_balance, paid_tokens_balance')
      .eq('id', user?.uid)
      .maybeSingle();

    const totalTokens = (profile?.tokens_balance || 0);
    console.log('💰 Current token balance:', totalTokens);

    if (totalTokens <= 0) {
      showToast('error', 'No Tokens Remaining', 'You have 0 tokens. Please purchase tokens or upgrade your plan to continue chatting.');
      return;
    }

    const messageAccess = await checkFeatureAccess('chat_messages_daily');
    if (!messageAccess.allowed) {
      showToast('error', 'Daily Limit Reached', `You've reached your daily message limit of ${messageAccess.limit} messages. Upgrade your plan to send more messages.`);
      return;
    }

    // Auto-detect voiceover generation requests
    const voiceKeywords = /\b(generate|create|make|produce|convert)\b.*\b(voice|voiceover|speech|audio|narration|speak|say)\b/i;
    const voiceRequestPattern = /\b(voice|voiceover|speech|audio|narration) (of|for|saying|speaking)\b/i;
    const sayPattern = /\b(say|speak|narrate)\b.*["\'](.+)["\']/i;

    if (voiceKeywords.test(textToSend) || voiceRequestPattern.test(textToSend) || sayPattern.test(textToSend)) {
      console.log('🎤 Voiceover generation detected!');
      setInputValue('');

      let cleanText = textToSend;

      const sayMatch = textToSend.match(/\b(say|speak|narrate)\b.*["\'](.+)["\']/i);
      if (sayMatch && sayMatch[2]) {
        cleanText = sayMatch[2];
      } else {
        cleanText = textToSend
          .replace(/^(generate|create|make|produce|convert)\s+(a|an)?\s+(voice|voiceover|speech|audio|narration)\s+(of|for|saying|speaking)?\s*/i, '')
          .replace(/\b(that says?|speaking|saying)\b\s*/i, '')
          .trim();
      }

      setVoiceoverText(cleanText || textToSend);
      setShowTTSStudio(true);

      return;
    }

    // Auto-detect video generation requests - INLINE in chat
    const videoKeywords = /\b(generate|create|make|show|render|produce)\b.*\b(video|clip|animation|footage|movie)\b/i;
    const videoRequestPattern = /\b(video|clip|animation) (of|about|showing|with|depicting)\b/i;

    if (videoKeywords.test(textToSend) || videoRequestPattern.test(textToSend)) {
      console.log('🎬 Video generation detected - generating inline!');
      setInputValue('');

      const cleanPrompt = textToSend
        .replace(/^(generate|create|make|show|render|produce)\s+(a|an)?\s+(video|clip|animation|footage|movie)\s+(of|about|showing|with|depicting)?\s*/i, '')
        .trim();

      const finalPrompt = cleanPrompt || textToSend;
      setIsLoading(true);

      try {
        // Create or use project
        let projectId = activeProjectId;
        if (!projectId) {
          const project = await createProject('Video Generation', 'chat', finalPrompt);
          projectId = project.id;
          setActiveProjectId(projectId);
        }

        // Add user message
        await addMessage(projectId, 'user', textToSend, []);

        // Add generating message
        const generatingMsg = await addMessage(projectId, 'assistant', '🎬 Generating video... This may take 2-3 minutes.', []);

        // Generate video - using Google Veo 3.1
        const { generateWithVeo3 } = await import('../../lib/googleVeo3Service');
        const videoUrl = await generateWithVeo3({ prompt: finalPrompt, duration: 8, aspectRatio: 'landscape' });

        if (videoUrl) {
          console.log('✅ Video generated:', videoUrl);

          // Update message with video player
          await supabase
            .from('messages')
            .update({
              content: `Here's your generated video:`,
              file_attachments: [{
                id: Date.now().toString(),
                type: 'video/mp4',
                url: videoUrl,
                name: 'generated-video.mp4',
                size: 0
              }]
            })
            .eq('id', generatingMsg.id);

          showToast('success', 'Video Generated', 'Your video is ready!');
        } else {
          throw new Error('Video generation failed');
        }
      } catch (error: any) {
        console.error('❌ Video generation error:', error);
        showToast('error', 'Generation Failed', error.message || 'Failed to generate video');
      } finally {
        setIsLoading(false);
      }

      return;
    }

    // Auto-detect music generation requests - INLINE in chat
    const musicKeywords = /\b(generate|create|make|compose|produce|write)\b.*\b(music|song|track|tune|beat|melody|soundtrack|audio|composition)\b/i;
    const musicRequestPattern = /\b(music|song|track|tune) (about|for|with|depicting)\b/i;

    if (musicKeywords.test(textToSend) || musicRequestPattern.test(textToSend)) {
      console.log('🎵 Music generation detected - generating inline!');
      setInputValue('');

      // Extract the prompt (remove command words)
      const cleanPrompt = textToSend
        .replace(/^(generate|create|make|compose|produce|write)\s+(an?\s+)?(music|song|track|tune|beat|melody|soundtrack|audio|composition)\s+(about|for|with|depicting)?\s*/i, '')
        .trim();

      const finalPrompt = cleanPrompt || textToSend;
      setIsLoading(true);

      try {
        // Create or use project
        let projectId = activeProjectId;
        if (!projectId) {
          const project = await createProject('Music Generation', 'chat', finalPrompt);
          projectId = project.id;
          setActiveProjectId(projectId);
        }

        // Add user message
        await addMessage(projectId, 'user', textToSend, []);

        // Add generating message
        const generatingMsg = await addMessage(projectId, 'assistant', '🎵 Generating music... This may take 1-2 minutes.', []);

        // Generate music
        const { sunoService } = await import('../../lib/sunoService');
        const result = await sunoService.generateMusic({
          prompt: finalPrompt,
          makeInstrumental: false
        });

        if (result && result.songs && result.songs.length > 0) {
          const song = result.songs[0];
          console.log('✅ Music generated:', song);

          // Update message with audio player
          await supabase
            .from('messages')
            .update({
              content: `Here's your generated music: "${song.title}"`,
              file_attachments: [{
                id: song.id,
                type: 'audio/mpeg',
                url: song.audioUrl,
                name: `${song.title}.mp3`,
                size: 0
              }]
            })
            .eq('id', generatingMsg.id);

          showToast('success', 'Music Generated', 'Your music is ready!');
        } else {
          throw new Error('Music generation failed');
        }
      } catch (error: any) {
        console.error('❌ Music generation error:', error);
        showToast('error', 'Generation Failed', error.message || 'Failed to generate music');
      } finally {
        setIsLoading(false);
      }

      return;
    }

    // Auto-detect PPT/presentation generation requests
    const pptKeywords = /\b(generate|create|make|build|design|produce|prepare)\b.*\b(ppt|powerpoint|presentation|slides?|slideshow|deck)\b/i;
    const pptRequestPattern = /\b(presentation|slides?|ppt|powerpoint|slideshow|deck) (on|about|for|regarding|covering)\b/i;
    const pptDirectPattern = /\b(make|need|want|create|build)\s+(a|an)?\s*(presentation|slides?|ppt|powerpoint|slideshow)/i;

    if (pptKeywords.test(textToSend) || pptRequestPattern.test(textToSend) || pptDirectPattern.test(textToSend)) {
      console.log('📊 PPT generation detected! Opening PPT modal...');
      setPPTTopic(textToSend);
      setShowPPTGenerator(true);
      setInputValue('');
      return;
    }

    // Handle file attachments - upload them
    let uploadedFiles: any[] = [];
    if (attachments && attachments.length > 0) {
      console.log('📎 Files attached:', attachments.length);
      showToast('info', 'Uploading Files...', `Uploading ${attachments.length} file(s)...`);

      try {
        const { FileUploadService } = await import('../../lib/fileUploadService');
        uploadedFiles = await FileUploadService.uploadMultipleFiles(attachments, user!.uid);

        if (uploadedFiles.length > 0) {
          showToast('success', 'Files Uploaded', `${uploadedFiles.length} file(s) uploaded successfully`);
        }
      } catch (error) {
        console.error('Error uploading files:', error);
        showToast('error', 'Upload Failed', 'Failed to upload files. Please try again.');
        setIsLoading(false);
        return;
      }
    }

    // Auto-detect image generation requests - INLINE, NOT POPUP
    const imageKeywords = /\b(generate|create|make|draw|design|show|paint|illustrate|render)\b.*\b(image|picture|photo|illustration|artwork|art|painting|drawing|graphic)\b/i;
    const imageRequestPattern = /\b(image|picture|photo|illustration) (of|about|showing|with|depicting)\b/i;

    if (imageKeywords.test(textToSend) || imageRequestPattern.test(textToSend)) {
      console.log('🎨 Image generation detected - will generate inline!');
      setInputValue('');

      // Extract the prompt (remove command words)
      const cleanPrompt = textToSend
        .replace(/^(generate|create|make|draw|design|show|paint|illustrate|render)\s+(an?\s+)?(image|picture|photo|illustration|artwork|art|painting|drawing|graphic)\s+(of|about|showing|with|depicting)?\s*/i, '')
        .trim();

      const finalPrompt = cleanPrompt || textToSend;

      // Create user message
      const userMsg = await addMessage(activeProjectId!, 'user', `Generate an image: ${finalPrompt}`);

      // Create generating message with loading indicator
      const generatingMsg = await addMessage(activeProjectId!, 'assistant', '🎨 Generating your image...');

      // Import and use image service
      try {
        console.log('🎨 Starting image generation with prompt:', finalPrompt);
        const { generateImageFree } = await import('../../lib/imageService');

        // Show progress
        await supabase
          .from('messages')
          .update({ content: '🎨 Creating image with AI...' })
          .eq('id', generatingMsg.id);

        const result = await generateImageFree(finalPrompt);
        console.log('🎨 Image generation result:', result);

        if (result && result.url) {
          console.log('✅ Image generated successfully! URL:', result.url);

          // Show finalizing message
          await supabase
            .from('messages')
            .update({ content: '✨ Finalizing your image...' })
            .eq('id', generatingMsg.id);

          // Small delay to show the loading state
          await new Promise(resolve => setTimeout(resolve, 500));

          // Update message with generated image
          await supabase
            .from('messages')
            .update({
              content: `Here's your generated image:`,
              file_attachments: [{
                id: Date.now().toString(),
                type: 'image/png',
                url: result.url,
                name: 'generated-image.png',
                size: 0
              }]
            })
            .eq('id', generatingMsg.id);

          showToast('success', 'Image Generated', 'Your image is ready!');
        } else {
          throw new Error(result.error || 'Image generation failed');
        }
      } catch (error: any) {
        console.error('❌ Image generation error:', error);
        await supabase
          .from('messages')
          .update({ content: `Failed to generate image: ${error.message}. Please try again.` })
          .eq('id', generatingMsg.id);
        showToast('error', 'Generation Failed', error.message || 'Failed to generate image');
      }

      return;
    }

    setInputValue('');
    setIsLoading(true);

    try {
      console.log('📤 Sending:', textToSend);

      // Classify intent - use safe default if it fails
      let intent;
      try {
        intent = await classifyIntentWithAI(textToSend);
        if (!intent) {
          throw new Error('No intent returned');
        }
        console.log('🎯 Intent classified:', intent.intent, intent.confidence);

        // If a specific AI model was detected, auto-select it
        if (intent.suggestedModel && intent.suggestedModel !== selectedModel) {
          console.log(`🤖 Auto-selecting AI model: ${intent.suggestedModel}`);
          setSelectedModel(intent.suggestedModel);
          // Don't show toast - just select the model silently
        }
      } catch (error) {
        console.warn('⚠️ Intent classification failed, defaulting to chat:', error);
        intent = {
          intent: 'chat',
          confidence: 1.0,
          suggestedStudio: 'Chat Studio',
          reasoning: 'Intent classification failed, defaulting to chat'
        };
      }

      // Handle studio intents
      if ((intent.intent === 'code' || intent.intent === 'design' || intent.intent === 'video' || intent.intent === 'voice' || intent.intent === 'music' || intent.intent === 'image') && !activeProjectId) {
        if (shouldShowConfirmation(intent)) {
          setPendingIntent({ intent, message: textToSend });
          setShowIntentDialog(true);
          setIsLoading(false);
          return;
        } else if (shouldAutoRoute(intent)) {
          await handleIntentConfirm({ intent, message: textToSend });
          setIsLoading(false);
          return;
        }
      }

      // Create or use chat project
      let projectId = activeProjectId;
      if (!projectId) {
        // Generate AI-powered project name
        console.log('🤖 Generating AI project name...');
        const projectName = await generateAIProjectName(textToSend);
        console.log('✅ AI-generated project name:', projectName);

        const project = await createProject(projectName, 'chat', textToSend.substring(0, 100));
        projectId = project.id;
        setActiveProjectId(projectId);
        console.log('✅ Project created:', projectId, 'Name:', projectName);
      }

      // Add user message with attachments
      if (uploadedFiles.length > 0) {
        const fileAttachments = uploadedFiles.map(f => ({
          id: f.id,
          name: f.name,
          type: f.type,
          size: f.size,
          url: f.url
        }));

        const { data: newMessage, error: insertError } = await supabase.from('messages').insert({
          project_id: projectId,
          role: 'user',
          content: textToSend,
          file_attachments: fileAttachments
        }).select().single();

        if (!insertError && newMessage) {
          setMessages(prev => [...prev, newMessage as any]);
        }
      } else {
        const userMessage = await addMessage(projectId, 'user', textToSend, []);
        if (userMessage) {
          setMessages(prev => [...prev, userMessage as any]);
        }
      }

      // Get AI response
      await getAIResponse(projectId, textToSend);

    } catch (error: any) {
      console.error('❌ Error:', error);
      showToast('error', 'Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get AI response with tier-based access control and 2x price multiplier
  const getAIResponse = async (projectId: string, userMessage: string) => {
    if (!user) {
      showToast('error', 'Authentication Required', 'Please sign in to use AI features');
      return;
    }

    try {
      console.log('🚀 getAIResponse called with:', { projectId, userMessage: userMessage.substring(0, 50) });
      console.log('🤖 Using model:', selectedModel);

      // Step 1: Validate model access based on user tier
      const modelInfo = getModelCost(selectedModel);
      const isFree = isModelFree(selectedModel);

      if (!isFree) {
        const access = await checkPremiumAccess(user.uid);
        console.log('🔑 [MAIN CHAT] Checking premium model access:', {
          model: selectedModel,
          tier: modelInfo.tier,
          isPremium: access.isPremium,
          tierSource: access.tierSource,
          paidTokens: access.paidTokens
        });

        if (!access.isPremium) {
          console.error(`🚫 Access denied: User ${user.uid} tried to use premium model ${selectedModel}`);
          showToast('error', 'Premium Model Locked', `${modelInfo.name} is a premium model. Purchase tokens to unlock access to premium models.`);

          const fallbackMessage = `⚠️ **Access Denied**\n\nThe model "${modelInfo.name}" (${modelInfo.provider}) requires a paid tier.\n\n**Why is this locked?**\n- This is a ${modelInfo.tier} tier model\n- Cost: ${modelInfo.tokensPerMessage.toLocaleString()} tokens per message\n- Free tier users can only access free models\n\n**To unlock this model:**\n1. Go to Settings → Billing\n2. Purchase a token pack\n3. All premium models will unlock immediately\n\n**Free alternatives you can use:**\n- Grok 4 Fast (Recommended)\n- DeepSeek V3.1 Free\n- Claude 3 Haiku\n- Gemini Flash Lite Free\n\nPlease select a free model from the dropdown to continue.`;

          await addMessage(projectId, 'assistant', fallbackMessage);
          return;
        }

        console.log(`✅ Access granted: User ${user.uid} has premium access for ${selectedModel}`);
      } else {
        console.log(`✅ Free model ${selectedModel} - access granted to all users`);
      }

      // Step 2: Build conversation history with image support
      const conversationHistory = messages.slice(-10).map(msg => {
        const baseMsg = {
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content as any,
        };

        // Check if message has image attachments (for vision models)
        if (msg.file_attachments) {
          try {
            const attachments = typeof msg.file_attachments === 'string'
              ? JSON.parse(msg.file_attachments)
              : msg.file_attachments;

            const imageAttachments = Array.isArray(attachments)
              ? attachments.filter((a: any) => a.type === 'image' || a.type?.startsWith('image/'))
              : [];

            if (imageAttachments.length > 0) {
              // Format for vision models
              const contentArray: any[] = [
                { type: 'text', text: msg.content }
              ];

              imageAttachments.forEach((img: any) => {
                contentArray.push({
                  type: 'image_url',
                  image_url: { url: img.url }
                });
              });

              baseMsg.content = contentArray;
            }
          } catch (e) {
            console.warn('Failed to parse file attachments:', e);
          }
        }

        return baseMsg;
      });

      console.log('📝 Messages count:', conversationHistory.length);

      // Step 3: Generate custom system prompt
      const systemPrompt = userPreferences
        ? generateSystemPrompt(userPreferences)
        : undefined;

      console.log('🎯 Using custom preferences:', !!systemPrompt);

      // Step 4: Call OpenRouter service with usage tracking
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const aiResponse = await getOpenRouterResponseWithUsage(userMessage, conversationHistory, systemPrompt, selectedModel);
      const aiContent = aiResponse.content;

      // Clear abort controller after successful completion
      abortControllerRef.current = null;

      // Hide thinking animation
      setIsThinking(false);

      console.log('✅ AI Response received! Length:', aiContent.length);
      console.log('✅ First 100 chars:', aiContent.substring(0, 100));

      // Step 5: Deduct tokens with 2x multiplier based on OpenRouter cost
      console.log('💰 Processing token deduction...');
      console.log('💰 aiResponse.usage:', aiResponse.usage);

      // Get the actual cost from OpenRouter (or use fallback)
      const estimatedFallbackCost = Math.max(0.0005, (aiContent.length / 1000) * 0.0005);
      const openRouterCost = aiResponse.usage?.total_cost || estimatedFallbackCost;

      console.log(`💰 OpenRouter cost: $${openRouterCost.toFixed(6)}`);

      // Apply 2x multiplier to OpenRouter cost
      const finalCostUSD = openRouterCost * 2;

      // Convert USD to tokens (1 token = $0.000001, so $1 = 1,000,000 tokens)
      const tokensToDeduct = Math.ceil(finalCostUSD * 1000000);

      console.log(`💰 Final cost (2x): $${finalCostUSD.toFixed(6)}`);
      console.log(`💎 Tokens to deduct: ${tokensToDeduct.toLocaleString()}`);

      // Deduct tokens from user's balance
      let deductionSuccess = false;
      try {
        console.log('🔄 Calling deduct_tokens_v2 with:', { user_id: user.uid, tokens: tokensToDeduct, model: selectedModel });

        const { data: deductResult, error: deductError } = await supabase.rpc('deduct_tokens_v2', {
          p_user_id: user.uid,
          p_tokens: tokensToDeduct,
          p_model: selectedModel,
          p_provider: modelInfo.provider,
          p_cost_usd: finalCostUSD,
          p_request_type: 'chat'
        });

        console.log('📊 Deduction result:', { deductResult, deductError });

        if (deductError) {
          console.error('❌ Token deduction error:', deductError);
        } else if (deductResult && deductResult.success) {
          console.log(`✅ Deducted ${tokensToDeduct.toLocaleString()} tokens. New balance: ${deductResult.balance?.toLocaleString()} (User: ${deductResult.user_type})`);
          deductionSuccess = true;
        } else {
          console.warn('⚠️ Token deduction returned success=false:', deductResult);
        }
      } catch (deductErr: any) {
        console.error('❌ Exception during token deduction:', deductErr);
        console.error('❌ Error details:', JSON.stringify(deductErr, null, 2));
      }

      // Log usage to database for tracking and analytics
      try {
        await supabase.from('ai_usage_logs').insert({
          user_id: user.uid,
          model: selectedModel,
          provider: aiResponse.provider || 'OpenRouter',
          request_type: 'chat',
          prompt: userMessage.substring(0, 500),
          response_length: aiContent.length,
          tokens_used: tokensToDeduct,
          openrouter_cost_usd: openRouterCost,
          final_cost_usd: finalCostUSD,
          success: deductionSuccess,
          metadata: {
            usage: aiResponse.usage,
            project_id: projectId
          }
        });
        console.log('✅ Usage logged to database');
      } catch (logErr) {
        console.error('⚠️ Failed to log usage:', logErr);
      }

      // Step 6: Save AI response with typing effect
      console.log('💾 Saving AI response to database...');
      const savedMessage = await addMessage(projectId, 'assistant', aiContent);

      // Set typing animation for this message
      if (savedMessage && savedMessage.id) {
        setTypingMessageId(savedMessage.id);
      }

      console.log('✅ AI response saved successfully');

      await incrementUsage('chat_messages_daily', 1);
      console.log('✅ Message usage incremented');

    } catch (error: any) {
      console.error('❌❌❌ AI ERROR ❌❌❌');
      console.error('Error type:', error.constructor?.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      const errorMessage = error.message || 'Unknown error occurred';

      let troubleshooting = `**Troubleshooting:**\n1. Check your internet connection\n2. Try selecting a different AI model from the dropdown\n3. Check browser console (F12) for detailed error logs\n4. Try refreshing the page`;

      if (errorMessage.includes('User not found') || errorMessage.includes('Authentication')) {
        troubleshooting = `**This appears to be an API key issue.**\n\n**To fix:**\n1. Go to https://openrouter.ai/ and sign up/login\n2. Get your API key from https://openrouter.ai/keys\n3. Update the key in src/lib/openRouterService.ts (line 17)\n4. The current key may be invalid or expired\n\n**For developers:**\nCheck the browser console (F12) for detailed error information.`;
      }

      const fallback = `⚠️ **AI Error**\n\n${errorMessage}\n\n${troubleshooting}\n\n**Your message:** "${userMessage}"`;

      console.log('💾 Saving error message to chat...');
      await addMessage(projectId, 'assistant', fallback);
      console.log('✅ Error message saved to chat');

      showToast('error', 'AI Error', errorMessage);
    }
  };

  // Handle intent confirmation
  const handleIntentConfirm = async (data: { intent: any; message: string }) => {
    setShowIntentDialog(false);
    setPendingIntent(null);

    const { intent, message } = data;

    try {
      const project = await createProject(
        `${intent.intent} Project`,
        intent.intent,
        message.substring(0, 100)
      );

      // Navigate to studio
      setTimeout(() => {
        const studioMap = {
          code: 'code',
          design: 'design',
          video: 'video',
          voice: 'voice',
          music: 'voice',
          image: 'chat',
        };
        const destination = studioMap[intent.intent as keyof typeof studioMap];
        if (destination) {
          navigateTo(destination as any, project as any);
        } else {
          console.error(`No route found for intent: ${intent.intent}`);
          navigateTo('chat');
        }
      }, 300);

    } catch (error: any) {
      console.error('❌ Error:', error);
      showToast('error', 'Error', error.message);
    }
  };

  // New chat - clear active project to show landing page
  const handleNewChat = () => {
    setActiveProjectId(null);
    setMessages([]);
    showToast('success', 'New Chat', 'Ready to start a new conversation');
  };

  // Select project
  const handleSelectProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      setActiveProjectId(projectId);
      return;
    }

    // Route to appropriate studio based on project type
    switch (project.type) {
      case 'image':
        setShowImageGenerator(true);
        setImagePrompt('');
        break;
      case 'music':
        setShowMusicStudio(true);
        setMusicPrompt('');
        break;
      case 'voice':
      case 'tts':
        setShowVoiceStudio(true);
        setVoiceoverText('');
        break;
      case 'video':
        setShowVideoGenerator(true);
        setVideoPrompt('');
        break;
      case 'ppt':
        setShowPPTGenerator(true);
        setPPTTopic('');
        break;
      default:
        // For chat projects, just set active project
        setActiveProjectId(projectId);
        break;
    }
  };

  // Key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Rename project
  const handleRenameProject = async (projectId: string, newName: string) => {
    try {
      await renameProject(projectId, newName);
      showToast('success', 'Success', 'Project renamed successfully');
    } catch (error: any) {
      console.error('❌ Error renaming project:', error);
      showToast('error', 'Error', 'Failed to rename project');
    }
  };

  // Delete project
  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);

      // If the deleted project was active, clear it
      if (activeProjectId === projectId) {
        setActiveProjectId(null);
        setMessages([]);
      }

      showToast('success', 'Success', 'Project deleted successfully');
    } catch (error: any) {
      console.error('Delete error:', error);
      showToast('error', 'Error', error.message || 'Failed to delete project');
    }
  };

  const showLanding = !activeProjectId;

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      <ChatSidebar
        projects={projects}
        activeProjectId={activeProjectId}
        onNewChat={handleNewChat}
        onSelectProject={handleSelectProject}
        onDeleteProject={handleDeleteProject}
        onRenameProject={handleRenameProject}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar with Model Selector and Profile */}
        {!showLanding && (
          <div className="px-4 py-3 border-b bg-[#1a1a1a] border-white/10 flex items-center justify-between">
            <div className="max-w-4xl mx-auto flex-1">
              <CompactModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                category="chat"
              />
            </div>
            <div className="ml-4">
              <ProfileButton />
            </div>
          </div>
        )}

        {/* Profile Button on Landing View */}
        {showLanding && (
          <div className="absolute top-4 right-4 z-10">
            <ProfileButton />
          </div>
        )}

        <div className="flex-1 ml-0 md:ml-16 overflow-y-auto">
          {/* Show generators fullscreen when active */}
          {showImageGenerator ? (
            <ImageStudio
              onClose={() => {
                setShowImageGenerator(false);
                setImagePrompt('');
              }}
              initialPrompt={imagePrompt}
            />
          ) : showVideoGenerator ? (
            <SimpleVideoGenerator
              onClose={() => {
                setShowVideoGenerator(false);
                setVideoPrompt('');
              }}
              initialPrompt={videoPrompt}
            />
          ) : showMusicStudio ? (
            <MusicStudio
              onClose={() => {
                setShowMusicStudio(false);
              }}
            />
          ) : showVoiceStudio ? (
            <VoiceStudio
              onClose={() => {
                setShowVoiceStudio(false);
              }}
            />
          ) : showTTSStudio ? (
            <TTSStudio
              onClose={() => {
                setShowTTSStudio(false);
                setVoiceoverText('');
              }}
              initialText={voiceoverText}
            />
          ) : showPPTGenerator ? (
            <PPTStudio
              onClose={() => {
                setShowPPTGenerator(false);
                setPPTTopic('');
              }}
              initialTopic={pptTopic}
            />
          ) : showLanding ? (
            <div className="h-full">
              <StudioLandingView
                onSelectMode={async (mode, modelId, initialPrompt) => {
                  console.log('🎯 Selected mode:', mode, 'Model:', modelId, 'Initial prompt:', initialPrompt);

                  // Set the selected model first
                  if (modelId) {
                    setSelectedModel(modelId);
                  }

                  // For chat mode, handle project creation and optional initial message
                  if (mode === 'chat') {
                    try {
                      console.log('💬 Starting chat with model:', modelId);

                      // Create new chat project
                      const projectName = initialPrompt
                        ? initialPrompt.substring(0, 30) + (initialPrompt.length > 30 ? '...' : '')
                        : `Chat with ${modelId}`;

                      const project = await createProject(projectName, 'chat', initialPrompt || '');
                      console.log('✅ Created project:', project.id);

                      // Set as active project (exits landing page)
                      setActiveProjectId(project.id);

                      // If there's an initial prompt, send it immediately
                      if (initialPrompt) {
                        console.log('📤 Sending initial message:', initialPrompt);
                        setInputValue(initialPrompt);
                        // The message will be sent via the input field
                        // User can see what they typed before it's sent
                      }
                    } catch (error) {
                      console.error('❌ Error creating chat project:', error);
                      showToast('error', 'Error', 'Failed to create chat session');
                    }
                  }
                  // For other modes (image, video, music, code), open the studio
                  else {
                    console.log(`🎨 Selected ${mode} mode with model:`, modelId);

                    // Handle video generation
                    if (mode === 'video' || modelId === 'sora-2' || modelId === 'veo-3') {
                      setVideoPrompt(initialPrompt || '');
                      setShowVideoGenerator(true);
                    }
                    // Handle image generation
                    else if (mode === 'image' || modelId === 'nano-banana' || modelId === 'seedreem' || modelId === 'gpt-4o-image') {
                      setImagePrompt(initialPrompt || '');
                      setShowImageGenerator(true);
                    }
                    // Handle music studio (Suno)
                    else if (mode === 'music' || modelId === 'suno') {
                      console.log('🎵 Opening Music Studio');
                      setShowMusicStudio(true);
                    }
                    // Handle voice studio (TTS services)
                    else if (modelId === 'elevenlabs' || modelId === 'gemini-tts') {
                      console.log('🎤 Opening Voice Studio');
                      setShowVoiceStudio(true);
                    }
                    // Handle PPT generation
                    else if (modelId === 'ppt-generator' || modelId === 'ppt-studio') {
                      setPPTTopic(initialPrompt || '');
                      setShowPPTGenerator(true);
                    }
                    else {
                      showToast('info', 'Coming Soon', `${mode.charAt(0).toUpperCase() + mode.slice(1)} studio will open here`);
                    }
                  }
                }}
              />
            </div>
          ) : (
            <div className="px-2 md:px-4">
            <>
              {/* Messages Area */}
              <div className="py-8 space-y-6 pb-32">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`group flex gap-3 ${
                    message.role === 'user'
                      ? 'justify-end max-w-5xl ml-auto mr-4'
                      : 'justify-start max-w-5xl ml-0 md:ml-4 mr-auto'
                  }`}
                >
                  {/* Avatar - Left for AI, Right for User */}
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                      <img src="/Black_Blue_White_Modern_Simple_Minimal_Gradient_Circle__Neon_Technology__AI_Logo__1_-removebg-preview copy.png" alt="KroniQ" className="w-8 h-8" />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${message.role === 'user' ? 'max-w-[75%] items-end' : 'max-w-[85%] items-start'}`}>
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? theme === 'light'
                          ? 'bg-gray-100 text-gray-900 rounded-br-md'
                          : 'bg-gray-800/50 text-gray-100 rounded-br-md'
                        : theme === 'light'
                        ? 'bg-gray-100 text-gray-900 rounded-bl-md'
                        : 'bg-gray-800/50 text-gray-100 rounded-bl-md'
                    } backdrop-blur-sm shadow-lg`}>
                      {/* Render message content */}
                      {message.content && (
                        message.role === 'assistant' ? (
                          // Assistant messages with markdown support
                          message.content.includes('#') || message.content.includes('**') || message.content.includes('```') || message.content.includes('|') ? (
                            <div className="text-[15px] leading-[1.6]">
                              {typingMessageId === message.id ? (
                                <TypingEffect
                                  text={message.content}
                                  speed={5}
                                  onComplete={() => setTypingMessageId(null)}
                                />
                              ) : (
                                <MarkdownRenderer content={message.content} />
                              )}
                            </div>
                          ) : (
                            <div className="text-[15px] leading-[1.6] whitespace-pre-wrap font-normal">
                              {typingMessageId === message.id ? (
                                <TypingEffect
                                  text={message.content}
                                  speed={5}
                                  onComplete={() => setTypingMessageId(null)}
                                />
                              ) : (
                                message.content
                              )}
                            </div>
                          )
                        ) : (
                          // User messages - simple text display
                          <div className="text-[15px] leading-[1.6] whitespace-pre-wrap font-normal">
                            {message.content}
                          </div>
                        )
                      )}

                      {/* Display Generated Media (images, videos, audio) */}
                      {(message as any).payload?.generatedContent && (() => {
                        const generatedContent = (message as any).payload.generatedContent;
                        if (generatedContent.url) {
                          return (
                            <MediaPreview
                              type={generatedContent.type || 'image'}
                              url={generatedContent.url}
                              prompt={generatedContent.prompt || message.content}
                              metadata={generatedContent.metadata}
                            />
                          );
                        }
                        return null;
                      })()}

                      {/* Display Attachments */}
                      {message.file_attachments && (() => {
                        try {
                          // Handle both stringified and direct array
                          const attachments = typeof message.file_attachments === 'string'
                            ? JSON.parse(message.file_attachments)
                            : message.file_attachments;

                          if (Array.isArray(attachments) && attachments.length > 0) {
                            return (
                              <div className="mt-3 space-y-2">
                                {attachments.map((attachment: any, idx: number) => (
                                  <div key={idx}>
                                    {attachment.type === 'image' || attachment.type?.startsWith('image/') ? (
                                      <div className="relative group">
                                        <img
                                          src={attachment.url}
                                          alt={attachment.name || 'Attached image'}
                                          className="rounded-lg max-w-full h-auto"
                                        />
                                        <button
                                          onClick={async () => {
                                            try {
                                              const response = await fetch(attachment.url);
                                              const blob = await response.blob();
                                              const url = window.URL.createObjectURL(blob);
                                              const a = document.createElement('a');
                                              a.href = url;
                                              a.download = attachment.name || `image-${Date.now()}.png`;
                                              document.body.appendChild(a);
                                              a.click();
                                              window.URL.revokeObjectURL(url);
                                              document.body.removeChild(a);
                                            } catch (error) {
                                              console.error('Download failed:', error);
                                            }
                                          }}
                                          className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                                          title="Download image"
                                        >
                                          <Download className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : attachment.type?.startsWith('audio/') ? (
                                      <div className="mt-2">
                                        <audio controls className="w-full max-w-md">
                                          <source src={attachment.url} type={attachment.type} />
                                          Your browser does not support the audio element.
                                        </audio>
                                        <div className="flex items-center justify-between mt-2">
                                          <p className="text-xs opacity-70">🎵 {attachment.name || 'Audio file'}</p>
                                          <button
                                            onClick={async () => {
                                              try {
                                                const response = await fetch(attachment.url);
                                                const blob = await response.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = attachment.name || `audio-${Date.now()}.mp3`;
                                                document.body.appendChild(a);
                                                a.click();
                                                window.URL.revokeObjectURL(url);
                                                document.body.removeChild(a);
                                              } catch (error) {
                                                console.error('Download failed:', error);
                                              }
                                            }}
                                            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[#00FFF0]/10 hover:bg-[#00FFF0]/20 text-[#00FFF0] border border-[#00FFF0]/30 transition-all"
                                          >
                                            <Download className="w-3 h-3" />
                                            Download
                                          </button>
                                        </div>
                                      </div>
                                    ) : attachment.type?.startsWith('video/') ? (
                                      <div className="mt-2">
                                        <video controls className="w-full max-w-2xl rounded-lg">
                                          <source src={attachment.url} type={attachment.type} />
                                          Your browser does not support the video element.
                                        </video>
                                        <div className="flex items-center justify-between mt-2">
                                          <p className="text-xs opacity-70">🎬 {attachment.name || 'Video file'}</p>
                                          <button
                                            onClick={async () => {
                                              try {
                                                const response = await fetch(attachment.url);
                                                const blob = await response.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = attachment.name || `video-${Date.now()}.mp4`;
                                                document.body.appendChild(a);
                                                a.click();
                                                window.URL.revokeObjectURL(url);
                                                document.body.removeChild(a);
                                              } catch (error) {
                                                console.error('Download failed:', error);
                                              }
                                            }}
                                            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[#00FFF0]/10 hover:bg-[#00FFF0]/20 text-[#00FFF0] border border-[#00FFF0]/30 transition-all"
                                          >
                                            <Download className="w-3 h-3" />
                                            Download
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 bg-black/10 dark:bg-white/10 rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                                      >
                                        <span>📎 {attachment.name || 'File'}</span>
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            );
                          }
                        } catch (e) {
                          console.error('Error parsing attachments:', e);
                        }
                        return null;
                      })()}
                    </div>

                    {/* Action Buttons - Only for AI messages */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(message.content);
                            showToast('Copied to clipboard!', 'success');
                          }}
                          className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                          title="Copy"
                        >
                          <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => {
                            showToast('Thanks for your feedback!', 'success');
                            console.log('Good response feedback');
                          }}
                          className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                          title="Good response"
                        >
                          <ThumbsUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => {
                            showToast('Thanks for your feedback!', 'success');
                            console.log('Bad response feedback');
                          }}
                          className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                          title="Bad response"
                        >
                          <ThumbsDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => {
                            const shareText = `Check out this AI response:\n\n${message.content.substring(0, 200)}...`;
                            if (navigator.share) {
                              navigator.share({
                                title: 'KroniQ AI Response',
                                text: shareText,
                              }).catch(() => {});
                            } else {
                              navigator.clipboard.writeText(shareText);
                              showToast('Response copied for sharing!', 'success');
                            }
                          }}
                          className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => {
                            // Find the user message that prompted this response
                            const userMessage = messages[index - 1];
                            if (userMessage && userMessage.role === 'user') {
                              handleSendMessage(userMessage.content);
                            }
                          }}
                          className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                          title="Retry"
                        >
                          <RotateCw className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => {
                            // Placeholder for more actions
                            console.log('More actions');
                          }}
                          className="p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors"
                          title="More actions"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Avatar - Right for User */}
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}

              {(isLoading || isThinking) && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
                    <img src="/Black_Blue_White_Modern_Simple_Minimal_Gradient_Circle__Neon_Technology__AI_Logo__1_-removebg-preview copy.png" alt="KroniQ" className="w-8 h-8 animate-pulse" />
                  </div>
                  <div className={`rounded-2xl rounded-bl-md px-4 py-3 ${
                    theme === 'light' ? 'bg-gray-100' : 'bg-gray-800/50'
                  } backdrop-blur-sm shadow-lg`}>
                    <div className="flex flex-col gap-2">
                      {isThinking ? (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-[#00FFF0] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-[#00FFF0] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-[#00FFF0] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span className="text-sm text-white/80">{thinkingText}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
            </>
            </div>
          )}
        </div>

        {/* Input Area - Full Width */}
        {!showLanding && (
          <div className={`border-t p-6 ${
            theme === 'light'
              ? 'border-gray-200 bg-transparent'
              : 'border-white/10 bg-transparent'
          }`}>
            <div className="max-w-4xl mx-auto">
              {/* Stop Button - Show when generating */}
              {isLoading && (
                <div className="flex justify-center mb-4">
                  <button
                    onClick={handleStopGeneration}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 transition-all"
                  >
                    <Square className="w-4 h-4" fill="currentColor" />
                    <span className="text-sm font-medium">Stop Generating</span>
                  </button>
                </div>
              )}

              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSend={(attachments, options) => handleSendMessage(undefined, attachments, options)}
                onKeyPress={handleKeyPress}
                placeholder="Ask KroniQ anything..."
                disabled={isLoading}
                selectedModel={selectedModel}
              />
            </div>
          </div>
        )}
      </div>

      {showIntentDialog && pendingIntent && pendingIntent.intent && (
        <IntentDialog
          intent={pendingIntent.intent}
          onConfirm={() => handleIntentConfirm(pendingIntent)}
          onCancel={() => {
            setShowIntentDialog(false);
            setPendingIntent(null);
            setIsLoading(false);
          }}
        />
      )}
    </div>
  );
};
