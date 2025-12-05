/**
 * Studio Messages Service
 * Handles message storage and retrieval for all studios
 * Provides chat-like interface for generated content
 */

import { supabase } from './supabase';
import { addMessage, getMessages } from './chatService';

export interface StudioMessagePayload {
  type: 'image' | 'video' | 'music' | 'voice' | 'ppt';
  url?: string;
  model?: string;
  duration?: number;
  dimensions?: string;
  [key: string]: any;
}

/**
 * Save user prompt and assistant response for studio generation
 */
export async function saveStudioGeneration(
  projectId: string,
  userPrompt: string,
  assistantContent: string,
  payload: StudioMessagePayload
): Promise<void> {
  try {
    // Save user message
    await addMessage(projectId, 'user', userPrompt);

    // Save assistant message with generated content
    await addMessage(projectId, 'assistant', assistantContent, undefined, undefined, payload);

    console.log('✅ Studio generation saved to messages');
  } catch (error) {
    console.error('Error saving studio generation:', error);
    throw error;
  }
}

/**
 * Load all messages for a studio project
 */
export async function loadStudioMessages(projectId: string) {
  try {
    const messages = await getMessages(projectId);
    console.log(`✅ Loaded ${messages.length} messages for project ${projectId}`);
    return messages;
  } catch (error) {
    console.error('Error loading studio messages:', error);
    return [];
  }
}

/**
 * Format assistant message for image generation
 */
export function formatImageMessage(imageUrl: string, model: string, dimensions?: string): string {
  return `Here's your generated image!

![Generated Image](${imageUrl})

**Model:** ${model}
${dimensions ? `**Dimensions:** ${dimensions}` : ''}`;
}

/**
 * Format assistant message for music generation
 */
export function formatMusicMessage(audioUrl: string, title: string, model: string, duration?: number): string {
  return `Here's your generated music!

🎵 **${title}**

[Listen Now](${audioUrl})

**Model:** ${model}
${duration ? `**Duration:** ${Math.round(duration)}s` : ''}`;
}

/**
 * Format assistant message for video generation
 */
export function formatVideoMessage(videoUrl: string, model: string, duration?: number): string {
  return `Here's your generated video!

🎬 **Video Ready**

[Watch Video](${videoUrl})

**Model:** ${model}
${duration ? `**Duration:** ${duration}s` : ''}`;
}

/**
 * Format assistant message for voice/TTS generation
 */
export function formatVoiceMessage(audioUrl: string, voice: string, duration?: number): string {
  return `Here's your generated voiceover!

🎙️ **Voiceover Ready**

[Listen Now](${audioUrl})

**Voice:** ${voice}
${duration ? `**Duration:** ${Math.round(duration)}s` : ''}`;
}

/**
 * Format assistant message for PPT generation
 */
export function formatPPTMessage(title: string, slideCount: number, theme: string): string {
  return `Here's your generated presentation!

📊 **${title}**

**Slides:** ${slideCount}
**Theme:** ${theme}`;
}
