/**
 * Google Veo 3 Video Generation Service
 * Uses AIMLAPI for actual Google Veo 3 API integration
 */

import { generateAndWaitForAimlapiVideo } from './aimlapiVideoService';

export interface Veo3Params {
  prompt: string;
  duration?: 4 | 6 | 8;
  aspectRatio?: 'landscape' | 'portrait' | 'square';
  resolution?: '720p' | '1080p';
}

/**
 * Generate video using Google Veo 3 via AIMLAPI
 */
export async function generateWithVeo3(
  params: Veo3Params,
  onProgress?: (status: string) => void
): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_AIMLAPI_KEY;

    if (!apiKey || apiKey.includes('your-')) {
      throw new Error('AIMLAPI key not configured. Add VITE_AIMLAPI_KEY to .env file.');
    }

    onProgress?.('Initializing Veo 3 video generation...');

    // Map aspect ratio to AIMLAPI format
    let aspectRatioMapping: '16:9' | '9:16' | '1:1' = '16:9';
    if (params.aspectRatio === 'portrait') {
      aspectRatioMapping = '9:16';
    } else if (params.aspectRatio === 'square') {
      aspectRatioMapping = '1:1';
    }

    // Map duration (AIMLAPI only supports 4 or 8)
    const duration = params.duration && params.duration >= 8 ? 8 : 4;

    const videoUrl = await generateAndWaitForAimlapiVideo(
      {
        prompt: params.prompt,
        aspectRatio: aspectRatioMapping,
        duration: duration as 4 | 8,
      },
      apiKey,
      (status, percent) => {
        onProgress?.(`${status} (${percent}%)`);
      }
    );

    return videoUrl;

  } catch (error: any) {
    console.error('Veo 3 generation error:', error);
    throw new Error(error.message || 'Failed to generate video with Veo 3');
  }
}

/**
 * Check if Veo 3 is available
 */
export function isVeo3Available(): boolean {
  const apiKey = import.meta.env.VITE_AIMLAPI_KEY;
  return !!(apiKey && !apiKey.includes('your-'));
}
