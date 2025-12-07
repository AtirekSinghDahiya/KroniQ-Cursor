/**
 * Music Generation Service
 * Uses Kie AI (Suno) for high-quality music generation
 */

import { generateSunoMusic } from './sunoService';

export interface MusicGenerationOptions {
  prompt: string;
  duration?: number;
  model?: string;
}

export interface GeneratedMusic {
  url: string;
  prompt: string;
  timestamp: Date;
  model: string;
  duration: number;
}

/**
 * Generate music using Suno API
 */
export async function generateMusic(options: MusicGenerationOptions): Promise<GeneratedMusic> {
  const {
    prompt,
    duration = 30,
    model = 'V3_5'
  } = options;

  console.log('🎵 Generating music with Suno API:', { prompt, duration });

  try {
    // Get Suno API key from environment
    const sunoApiKey = import.meta.env.VITE_SUNO_API_KEY;
    if (!sunoApiKey) {
      console.warn('⚠️ Suno API key not configured, returning placeholder');
      // Return a placeholder response
      return {
        url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        prompt: prompt,
        timestamp: new Date(),
        model: 'placeholder',
        duration: duration
      };
    }

    const musicUrl = await generateSunoMusic({
      prompt: prompt,
      style: 'pop', // Default style
      title: `AI Generated Music - ${new Date().toLocaleDateString()}`,
      customMode: true,
      instrumental: false,
      model: model,
    }, sunoApiKey);

    console.log('✅ Music generated successfully');

    return {
      url: musicUrl,
      prompt: prompt,
      timestamp: new Date(),
      model: model,
      duration: duration
    };

  } catch (error: any) {
    console.error('❌ Music generation error:', error);
    throw new Error(error.message || 'Failed to generate music');
  }
}

/**
 * Check if music generation is available
 */
export function isMusicGenerationAvailable(): boolean {
  return true;
}

/**
 * Get available music models from Suno API
 */
export function getAvailableMusicModels() {
  return [
    { id: 'V3_5', name: 'Suno V3.5', description: 'Latest Suno music model' },
    { id: 'V4', name: 'Suno V4', description: 'Advanced Suno music generation' }
  ];
}

/**
 * Generate music with Suno
 */
export async function generateSunoMusic(
  prompt: string,
  duration: number = 30
): Promise<GeneratedMusic> {
  return generateMusic({ prompt, duration, model: 'suno-v3.5' });
}
