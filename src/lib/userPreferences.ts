/**
 * User Preferences Service
 * Manages AI interaction preferences
 */

import { supabase } from './supabaseClient';
import { getCurrentUserId } from './chatService';

export interface UserPreferences {
  user_id: string;
  ai_tone: 'professional' | 'casual' | 'friendly' | 'creative';
  ai_length: 'concise' | 'balanced' | 'detailed';
  ai_expertise: 'beginner' | 'intermediate' | 'expert';
  default_language: string;
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_PREFERENCES: Omit<UserPreferences, 'user_id'> = {
  ai_tone: 'friendly',
  ai_length: 'balanced',
  ai_expertise: 'intermediate',
  default_language: 'en',
};

/**
 * Get user preferences
 */
export const getUserPreferences = async (): Promise<UserPreferences> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  // If no preferences exist, create default ones
  if (!data) {
    return await createUserPreferences(userId);
  }

  return data;
};

/**
 * Create default user preferences
 */
export const createUserPreferences = async (userId: string): Promise<UserPreferences> => {
  const { data, error } = await supabase
    .from('user_preferences')
    .insert({
      user_id: userId,
      ...DEFAULT_PREFERENCES,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (
  preferences: Partial<Omit<UserPreferences, 'user_id' | 'created_at' | 'updated_at'>>
): Promise<UserPreferences> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_preferences')
    .update({
      ...preferences,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Generate system prompt based on user preferences
 */
export const generateSystemPrompt = (preferences: UserPreferences): string => {
  const toneInstructions = {
    professional: 'Maintain a professional and formal tone. Use clear, precise language.',
    casual: 'Use a casual and relaxed tone. Be conversational and approachable.',
    friendly: 'Be warm, friendly, and encouraging. Show enthusiasm and empathy.',
    creative: 'Be creative, imaginative, and expressive. Use vivid language and metaphors.',
  };

  const lengthInstructions = {
    concise: 'Keep responses brief and to the point. Aim for 2-3 sentences unless more detail is specifically requested.',
    balanced: 'Provide balanced responses with adequate detail. Aim for 4-6 sentences.',
    detailed: 'Provide comprehensive, detailed responses. Explain concepts thoroughly with examples.',
  };

  const expertiseInstructions = {
    beginner: 'Explain concepts in simple terms. Avoid jargon and provide context. Be patient and encouraging.',
    intermediate: 'Assume basic knowledge. Use some technical terms but explain complex concepts. Be supportive.',
    expert: 'Use technical language freely. Focus on advanced concepts and nuances. Be direct and efficient.',
  };

  return `You are KroniQ AI, a friendly and intelligent assistant with personality! 😊

**Your Communication Style:**
- Be warm, conversational, and approachable - like chatting with a knowledgeable friend
- Use emojis naturally to add personality and emotion (but don't overdo it - 1-3 per response is great)
- Show enthusiasm when helping and celebrate user successes
- Be empathetic and understanding when users face challenges
- Use casual, natural language while staying professional
- Feel free to use phrases like "Great question!", "I'd be happy to help!", "That's awesome!", etc.

**Tone**: ${toneInstructions[preferences.ai_tone]}

**Response Length**: ${lengthInstructions[preferences.ai_length]}

**User Expertise**: ${expertiseInstructions[preferences.ai_expertise]}

Remember: You're not just providing information - you're having a genuine conversation. Be helpful, accurate, and let your personality shine through! ✨`;
};
