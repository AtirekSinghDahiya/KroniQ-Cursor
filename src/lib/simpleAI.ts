/**
 * SIMPLE AI SERVICE - Using OpenRouter
 * All AI calls route through OpenRouter unified API
 */

import { getOpenRouterResponse, callOpenRouter } from './openRouterService';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIResponse {
  content: string;
  provider: string;
  model: string;
}

// Visual debug logger
function log(type: 'info' | 'success' | 'error' | 'warning', message: string) {
  console.log(`[${type}]`, message);
  window.dispatchEvent(new CustomEvent('debugLog', { detail: { type, message } }));
}

/**
 * Call OpenRouter API
 */
export async function callOpenRouterAPI(messages: Message[], modelId: string = 'grok-4-fast'): Promise<AIResponse> {
  log('info', '🤖 AI SERVICE CALLED - Using OpenRouter');
  log('info', `Model: ${modelId}`);
  log('info', `Messages: ${messages.length}`);

  try {
    const response = await callOpenRouter(messages, modelId);
    log('success', `✅ Response received from ${response.provider}`);
    return response;
  } catch (error: any) {
    log('error', `❌ Error: ${error.message}`);
    throw error;
  }
}

/**
 * Main AI function - Simple wrapper around OpenRouter
 */
export const getAIResponse = async (
  userMessage: string,
  conversationHistory: Message[] = [],
  systemPrompt?: string,
  selectedModel: string = 'grok-4-fast'
): Promise<string> => {
  try {
    log('info', '🚀 Getting AI response');
    log('info', `📝 Model: ${selectedModel}`);
    log('info', `📝 Message length: ${userMessage.length}`);
    log('info', `📝 History length: ${conversationHistory.length}`);

    const response = await getOpenRouterResponse(
      userMessage,
      conversationHistory,
      systemPrompt,
      selectedModel
    );

    log('success', `✅ Response received, length: ${response.length}`);
    return response;
  } catch (error: any) {
    log('error', `❌ Error: ${error.message}`);
    throw error;
  }
};

/**
 * Call AI with messages array
 */
export const callAI = async (
  messages: Message[],
  modelId: string = 'grok-4-fast'
): Promise<AIResponse> => {
  try {
    const response = await callOpenRouter(messages, modelId);
    return response;
  } catch (error: any) {
    log('error', `❌ callAI Error: ${error.message}`);
    throw error;
  }
};
