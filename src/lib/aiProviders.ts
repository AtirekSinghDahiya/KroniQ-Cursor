/**
 * Multi-Provider AI Service - USING OPENROUTER
 * All models route through OpenRouter unified API
 */

import { callOpenRouter, getOpenRouterResponse } from './openRouterService';

interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIResponse {
  content: string;
  provider: string;
  model: string;
}

/**
 * Main AI call function - Routes all requests through OpenRouter
 */
export const callAI = async (
  messages: AIMessage[],
  modelId: string
): Promise<AIResponse> => {
  try {
    console.log(`🤖 Calling OpenRouter with model: ${modelId}`);

    // Convert messages to OpenRouter format
    const openRouterMessages = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // Call OpenRouter
    const response = await callOpenRouter(openRouterMessages, modelId);

    return response;
  } catch (error: any) {
    console.error(`❌ OpenRouter error:`, error.message);
    throw error;
  }
};

/**
 * Context-aware prompt enhancement using OpenRouter
 */
export const enhancePrompt = async (
  prompt: string,
  context: 'general' | 'code' | 'design' | 'video' | 'voice',
  modelId: string = 'grok-4-fast'
): Promise<string> => {
  const contextInstructions: Record<string, string> = {
    general: 'Make this prompt more clear, detailed, and effective.',
    code: 'Enhance this coding prompt by adding: specific technologies/languages, expected features, code structure preferences, and any constraints. Make it developer-friendly.',
    design: 'Enhance this design prompt by adding: visual style (modern/minimalist/etc), color preferences, target audience, dimensions/format, and specific design elements desired.',
    video: 'Enhance this video prompt by adding: video length, format (MP4/MOV), resolution, style (cinematic/documentary), transitions needed, and any specific effects.',
    voice: 'Enhance this voice prompt by adding: voice characteristics (tone, gender, age), speech pace, emotion/mood, language/accent, and intended use case.',
  };

  const instruction = contextInstructions[context] || contextInstructions.general;

  try {
    const response = await getOpenRouterResponse(
      `${instruction}\n\nOriginal prompt: "${prompt}"\n\nReturn ONLY the enhanced prompt, no explanations or quotes.`,
      [],
      'You are an expert prompt engineer. Your task is to enhance user prompts to make them more effective for AI processing. Return ONLY the enhanced prompt without quotes or explanations.',
      modelId
    );

    const enhanced = response.trim().replace(/^["']|["']$/g, '');
    return enhanced || prompt;
  } catch (error: any) {
    console.error('Enhancement failed:', error);
    return prompt;
  }
};

/**
 * Get AI response with conversation history
 */
export const getAIResponse = async (
  userMessage: string,
  conversationHistory: AIMessage[] = [],
  systemPrompt?: string,
  modelId: string = 'grok-4-fast'
): Promise<string> => {
  try {
    const response = await getOpenRouterResponse(
      userMessage,
      conversationHistory,
      systemPrompt,
      modelId
    );

    return response;
  } catch (error: any) {
    console.error('❌ AI Response Error:', error.message);
    throw error;
  }
};
