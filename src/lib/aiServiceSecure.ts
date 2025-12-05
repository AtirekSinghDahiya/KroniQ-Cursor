import { supabase } from './supabaseClient';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIPreferences {
  personality: string;
  creativityLevel: number;
  responseLength: string;
}

export interface ProviderInfo {
  provider: string;
  available: boolean;
  models: string[];
  displayName: string;
}

export const getAvailableProviders = async (): Promise<ProviderInfo[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-provider-status', {
      body: {}
    });

    if (error) throw error;
    return data.providers || [];
  } catch (error) {
    console.error('Failed to fetch provider status:', error);
    return [];
  }
};

export const generateAIResponse = async (
  projectId: string,
  messages: AIMessage[],
  provider: string,
  preferences: AIPreferences
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-reply', {
      body: {
        projectId,
        messages,
        provider,
        preferences
      }
    });

    if (error) throw error;
    if (!data || !data.response) throw new Error('No response from AI');

    return data.response;
  } catch (error: any) {
    console.error('AI generation error:', error);
    throw new Error(error.message || 'Failed to generate AI response');
  }
};

export const classifyIntent = async (
  prompt: string
): Promise<{ intent: string; confidence: number }> => {
  try {
    const { data, error } = await supabase.functions.invoke('classify-intent', {
      body: { prompt }
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Intent classification error:', error);
    return { intent: 'chat', confidence: 0 };
  }
};
