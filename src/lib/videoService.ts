/**
 * Video Generation Service
 * Uses Kie AI for high-quality video generation
 */

import { generateKieVideo, KIE_MODELS } from './kieAIService';

export interface VideoGenerationOptions {
  prompt: string;
  model?: string;
  duration?: number;
  resolution?: string;
}

export interface GeneratedVideo {
  url: string;
  prompt: string;
  timestamp: Date;
  model: string;
}

/**
 * Generate video using Kie AI
 */
export async function generateVideo(options: VideoGenerationOptions): Promise<GeneratedVideo> {
  const {
    prompt,
    model = 'veo3_fast',
    duration = 5,
    resolution = '1280x720'
  } = options;

  console.log('🎬 Generating video with Kie AI:', { prompt, model });

  try {
    const videoUrl = await generateKieVideo(prompt, model);

    console.log('✅ Video generated successfully');

    return {
      url: videoUrl,
      prompt: prompt,
      timestamp: new Date(),
      model: model
    };

  } catch (error: any) {
    console.error('❌ Video generation error:', error);
    throw new Error(error.message || 'Failed to generate video');
  }
}

/**
 * Check if video generation is available
 */
export function isVideoGenerationAvailable(): boolean {
  return true;
}

/**
 * Get available video models from Kie AI
 */
export function getAvailableVideoModels() {
  return KIE_MODELS.video;
}

/**
 * Generate video with specific model
 */
export async function generateVideoWithModel(
  prompt: string,
  model: string = 'veo3_fast'
): Promise<GeneratedVideo> {
  return generateVideo({ prompt, model });
}
