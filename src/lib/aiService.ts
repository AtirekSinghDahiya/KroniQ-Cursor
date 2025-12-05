/**
 * AI Service - Using OpenRouter for all AI calls
 * Clean, simple integration with OpenRouter unified API
 */

import { getOpenRouterResponse } from './openRouterService';

interface AIPreferences {
  personality: string;
  creativityLevel: number;
  responseLength: string;
}

interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const getSystemPrompt = (preferences: AIPreferences): string => {
  const personalityMap: Record<string, string> = {
    creative: 'Be highly imaginative, artistic, and think outside the box. Use creative metaphors and provide innovative solutions.',
    professional: 'Be formal, business-oriented, and precise. Use professional language and focus on best practices.',
    funny: 'Be humorous, light-hearted, and entertaining. Use jokes and witty remarks when appropriate.',
    balanced: 'Be well-rounded, versatile, and adaptable. Balance creativity with practicality.',
    technical: 'Be highly detailed, precise, and technical. Focus on specifications and technical accuracy.',
    casual: 'Be friendly, conversational, and approachable. Use simple language and be relatable.',
  };

  const creativityMap: Record<number, string> = {
    1: 'Be very conservative and stick to proven, standard solutions.',
    2: 'Prefer established patterns with minor variations.',
    3: 'Use mostly conventional approaches with occasional alternatives.',
    4: 'Balance between conventional and creative solutions.',
    5: 'Mix standard approaches with creative alternatives equally.',
    6: 'Lean towards creative solutions while keeping practicality in mind.',
    7: 'Favor innovative approaches with creative problem-solving.',
    8: 'Be highly creative and suggest novel solutions.',
    9: 'Be very experimental and push boundaries.',
    10: 'Be extremely innovative and suggest cutting-edge, experimental solutions.',
  };

  const lengthMap: Record<string, string> = {
    short: 'Keep responses concise and to the point. Use 2-3 sentences or a brief paragraph.',
    medium: 'Provide balanced responses with adequate detail. Use 1-2 paragraphs.',
    long: 'Give comprehensive, detailed responses with thorough explanations. Use multiple paragraphs.',
  };

  const personality = personalityMap[preferences.personality] || personalityMap.balanced;
  const creativity = creativityMap[preferences.creativityLevel] || creativityMap[5];
  const length = lengthMap[preferences.responseLength] || lengthMap.medium;

  return `You are KroniQ AI, a friendly and enthusiastic coding and design assistant!

PERSONALITY: ${personality}

CREATIVITY LEVEL: ${creativity}

RESPONSE LENGTH: ${length}

Always be helpful, accurate, and engaging in your responses. Provide practical solutions while matching the user's preferred style.`;
};

/**
 * Get AI response with user preferences via OpenRouter
 */
export const getAIResponse = async (
  message: string,
  conversationHistory: AIMessage[] = [],
  preferences?: AIPreferences,
  selectedModel: string = 'grok-4-fast'
): Promise<string> => {
  try {
    console.log('🚀 AI Service: Getting response');
    console.log('📝 Model:', selectedModel);
    console.log('💬 Message:', message.substring(0, 50) + '...');

    const systemPrompt = preferences
      ? getSystemPrompt(preferences)
      : 'You are KroniQ AI, a helpful and friendly assistant.';

    const response = await getOpenRouterResponse(
      message,
      conversationHistory,
      systemPrompt,
      selectedModel
    );

    console.log('✅ Response received:', response.substring(0, 50) + '...');
    return response;
  } catch (error: any) {
    console.error('❌ AI Service error:', error);
    throw error;
  }
};

/**
 * Simple AI call without preferences
 */
export const callAI = async (
  messages: AIMessage[],
  modelId: string = 'grok-4-fast'
): Promise<string> => {
  try {
    const systemMessage = messages.find(m => m.role === 'system');
    const otherMessages = messages.filter(m => m.role !== 'system');
    const userMessage = otherMessages[otherMessages.length - 1]?.content || '';
    const conversationHistory = otherMessages.slice(0, -1);

    const response = await getOpenRouterResponse(
      userMessage,
      conversationHistory,
      systemMessage?.content,
      modelId
    );

    return response;
  } catch (error: any) {
    console.error('❌ callAI error:', error);
    throw error;
  }
};
