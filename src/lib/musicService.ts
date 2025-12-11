/**
 * Music Generation Service
 * Uses Kie AI (Suno) for high-quality music generation
 */

import { generateKieMusic, KIE_MODELS } from './kieAIService';

export interface MusicGenerationOptions {
  prompt: string;
  duration?: number;
  model?: string;
  style?: string;
  title?: string;
  instrumental?: boolean;
}

export interface GeneratedMusic {
  url: string;
  prompt: string;
  timestamp: Date;
  model: string;
  duration: number;
  title: string;
  style: string;
}

/**
 * Generate music using Kie AI
 */
export async function generateMusic(options: MusicGenerationOptions): Promise<GeneratedMusic> {
  const {
    prompt,
    duration = 30,
    model = 'V3_5',
    style = 'Pop',
    title = 'Generated Song',
    instrumental = false
  } = options;

  console.log('🎵 Generating music with Kie AI:', { prompt, duration, model });

  try {
    // Generate music using Kie AI (wraps Suno)
    const musicUrl = await generateKieMusic(
      prompt,
      true, // custom mode for better control
      style,
      title,
      instrumental
    );

    console.log('✅ Music generated successfully');

    return {
      url: musicUrl,
      prompt: prompt,
      timestamp: new Date(),
      model: model,
      duration: duration,
      title: title,
      style: style
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
