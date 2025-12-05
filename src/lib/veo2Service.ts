/**
 * Veo 2 API Service
 * Simple text-to-video generation using veo2api.com
 */

export interface Veo2VideoParams {
  prompt: string;
}

interface Veo2Response {
  video_url?: string;
  error?: string;
  message?: string;
}

const VEO2_API_BASE = 'https://veo2api.com/api';

/**
 * Generate video using Veo 2 API
 */
export async function generateWithVeo2(
  params: Veo2VideoParams,
  onProgress?: (status: string) => void
): Promise<string> {
  try {
    const VEO2_KEY = import.meta.env.VITE_VEO2_API_KEY;

    if (!VEO2_KEY || VEO2_KEY.includes('your-')) {
      throw new Error('Veo 2 API key not configured');
    }

    onProgress?.('Initializing Veo 2 video generation...');

    console.log('🎬 Veo 2 API request:', { prompt: params.prompt });

    // Make the API call
    const response = await fetch(VEO2_API_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VEO2_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: params.prompt,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Veo 2 API Error:', response.status, errorText);
      throw new Error(`Veo 2 API Error (${response.status}): ${errorText}`);
    }

    const data: Veo2Response = await response.json();
    console.log('📊 Veo 2 response:', data);

    if (data.error) {
      throw new Error(data.error);
    }

    if (!data.video_url) {
      throw new Error(data.message || 'No video URL in response');
    }

    onProgress?.('Video generated successfully!');
    console.log('✅ Video ready:', data.video_url);

    return data.video_url;

  } catch (error: any) {
    console.error('❌ Veo 2 generation error:', error);
    throw new Error(error.message || 'Failed to generate video with Veo 2');
  }
}

/**
 * Check if Veo 2 is available
 */
export function isVeo2Available(): boolean {
  const key = import.meta.env.VITE_VEO2_API_KEY;
  return !!key && !key.includes('your-');
}
