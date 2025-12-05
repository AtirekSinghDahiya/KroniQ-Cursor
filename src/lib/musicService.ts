/**
 * Music Generation Service
 * Uses Kie AI (Suno) for high-quality music generation
 */

import { generateKieMusic, KIE_MODELS } from './kieAIService';

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
 * Generate music using Kie AI (Suno)
 */
export async function generateMusic(options: MusicGenerationOptions): Promise<GeneratedMusic> {
  const {
    prompt,
    duration = 30,
    model = 'suno-v3.5'
  } = options;

  console.log('🎵 Generating music with Kie AI (Suno):', { prompt, duration });

  try {
    const musicUrl = await generateKieMusic(prompt, false);

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
 * Get available music models from Kie AI
 */
export function getAvailableMusicModels() {
  return KIE_MODELS.music;
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
