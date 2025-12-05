/**
 * Suno AI Music Generation Service
 * Now uses Kie AI for Suno music generation
 */

import { generateMusic } from './musicService';

export interface SunoParams {
  prompt: string;
  duration?: number;
  makeInstrumental?: boolean;
  style?: string;
  title?: string;
  model?: 'V3_5' | 'V4' | 'V4_5' | 'V4_5PLUS' | 'V5';
}

/**
 * Generate music using Suno via Kie AI
 */
export async function generateWithSuno(
  params: SunoParams,
  onProgress?: (status: string) => void
): Promise<string> {
  try {
    onProgress?.('Initializing Suno music generation...');

    const fullPrompt = params.style
      ? `${params.prompt}, style: ${params.style}`
      : params.prompt;

    console.log('🎵 Generating Suno music via Kie AI:', fullPrompt);

    onProgress?.('Music generation in progress...');

    const result = await generateMusic({
      prompt: fullPrompt,
      duration: params.duration || 30,
      model: 'suno-v3.5'
    });

    onProgress?.('Music generated successfully!');

    return result.url;

  } catch (error: any) {
    console.error('Suno generation error:', error);
    throw new Error(error.message || 'Failed to generate music with Suno');
  }
}

/**
 * Check if Suno is available
 */
export function isSunoAvailable(): boolean {
  return true;
}

/**
 * Simple wrapper for generating music from just a prompt
 */
export async function generateSunoMusic(prompt: string): Promise<{ audioUrl: string; title: string }> {
  const audioUrl = await generateWithSuno({
    prompt,
    makeInstrumental: false,
    model: 'V3_5',
  });

  return {
    audioUrl,
    title: prompt.substring(0, 50),
  };
}
