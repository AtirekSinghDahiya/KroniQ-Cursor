/**
 * Google Lyria RealTime Music Generation Service
 * Uses Google's streaming music generation model
 */

export interface LyriaParams {
  prompt: string;
  duration?: number; // In seconds
  genre?: string;
  mood?: string;
  tempo?: 'slow' | 'medium' | 'fast';
}

/**
 * Generate music using Google Lyria RealTime
 */
export async function generateWithLyria(
  params: LyriaParams,
  onProgress?: (status: string) => void
): Promise<string> {
  try {
    const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    if (!GEMINI_KEY || GEMINI_KEY.includes('your-')) {
      throw new Error('Google Gemini API key not configured');
    }

    onProgress?.('Initializing Lyria RealTime...');

    // Build enhanced prompt with music parameters
    const musicPrompt = [
      params.prompt,
      params.genre ? `Genre: ${params.genre}` : '',
      params.mood ? `Mood: ${params.mood}` : '',
      params.tempo ? `Tempo: ${params.tempo}` : ''
    ].filter(Boolean).join('. ');

    const duration = params.duration || 30;

    // Call Google Lyria API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/lyria-realtime:generateMusic?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: musicPrompt,
          duration: duration,
          numberOfTracks: 1,
          format: 'mp3',
          sampleRate: 44100,
          bitrate: 320,
          safetyFilterLevel: 'BLOCK_MEDIUM_AND_ABOVE'
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lyria API Error:', errorText);
      throw new Error(`Lyria API Error: ${response.status}`);
    }

    const data = await response.json();

    // Handle operation response (long-running operation)
    if (data.name) {
      onProgress?.('Music generation in progress...');

      // Poll for completion
      const operationName = data.name;
      let attempts = 0;
      const maxAttempts = 60; // 2 minutes timeout

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));

        const statusResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${GEMINI_KEY}`
        );

        const statusData = await statusResponse.json();

        if (statusData.done) {
          if (statusData.error) {
            throw new Error(statusData.error.message || 'Music generation failed');
          }

          const audioUrl = statusData.response?.generatedTracks?.[0]?.uri;
          if (!audioUrl) {
            throw new Error('No audio URL in response');
          }

          onProgress?.('Music generated successfully!');
          return audioUrl;
        }

        onProgress?.(`Generating music... (${attempts * 2}s)`);
        attempts++;
      }

      throw new Error('Music generation timed out');
    }

    // Direct response
    const audioUrl = data.generatedTracks?.[0]?.uri;
    if (!audioUrl) {
      throw new Error('No audio URL in response');
    }

    onProgress?.('Music generated successfully!');
    return audioUrl;

  } catch (error: any) {
    console.error('Lyria generation error:', error);
    throw new Error(error.message || 'Failed to generate music with Lyria');
  }
}

/**
 * Check if Lyria is available
 */
export function isLyriaAvailable(): boolean {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  return !!key && !key.includes('your-');
}
