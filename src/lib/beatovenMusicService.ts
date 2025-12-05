/**
 * Beatoven AI Music Generation Service
 * Generates music tracks using Beatoven's AI API
 */

const BEATOVEN_API_KEY = 'HP40z-DZ17pUBo6HpL--kw';
const BEATOVEN_BASE_URL = 'https://api.beatoven.ai';

export interface BeatovenComposeOptions {
  prompt: string;
  format?: 'wav' | 'mp3' | 'aac';
  looping?: boolean;
}

export interface BeatovenComposeResponse {
  status: 'started' | 'composing' | 'running' | 'composed';
  task_id?: string;
  meta?: {
    project_id: string;
    track_id: string;
    prompt: { text: string };
    version: number;
    track_url: string;
    stems_url: {
      bass: string;
      chords: string;
      melody: string;
      percussion: string;
    };
  };
}

/**
 * Start composing a music track
 */
export async function composeMusicTrack(
  options: BeatovenComposeOptions,
  onProgress?: (message: string) => void
): Promise<string> {
  try {
    onProgress?.('Sending composition request to Beatoven AI...');

    const response = await fetch(`${BEATOVEN_BASE_URL}/api/v1/tracks/compose`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BEATOVEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: {
          text: options.prompt
        },
        format: options.format || 'wav',
        looping: options.looping || false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Beatoven API error:', response.status, errorText);
      throw new Error(`Beatoven API error: ${response.status} - ${errorText}`);
    }

    const result: BeatovenComposeResponse = await response.json();
    console.log('Beatoven response:', result);

    if (result.status !== 'started' || !result.task_id) {
      throw new Error('Failed to start composition task');
    }

    onProgress?.('Composition started. Generating music...');

    // Poll for completion
    const taskId = result.task_id;
    const trackUrl = await pollCompositionStatus(taskId, onProgress);

    return trackUrl;
  } catch (error: any) {
    console.error('Beatoven composition error:', error);
    // Check if it's a fetch/network error
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      throw new Error('Network error: Unable to reach Beatoven AI. Please check your connection.');
    }
    throw new Error(error.message || 'Failed to compose music with Beatoven AI');
  }
}

/**
 * Poll for composition status
 */
async function pollCompositionStatus(
  taskId: string,
  onProgress?: (message: string) => void
): Promise<string> {
  const maxAttempts = 60; // 5 minutes max (5 second intervals)
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${BEATOVEN_BASE_URL}/api/v1/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${BEATOVEN_API_KEY}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const result: BeatovenComposeResponse = await response.json();

      if (result.status === 'composed' && result.meta?.track_url) {
        onProgress?.('Music composition complete!');
        return result.meta.track_url;
      }

      if (result.status === 'composing' || result.status === 'running') {
        onProgress?.(`Composing music... (${Math.round((attempts / maxAttempts) * 100)}%)`);
      }

      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    } catch (error) {
      console.error('Error polling status:', error);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  throw new Error('Music composition timed out after 5 minutes');
}

/**
 * Generate music with prompt
 */
export async function generateMusicWithBeatoven(
  prompt: string,
  onProgress?: (message: string) => void
): Promise<string> {
  return composeMusicTrack({
    prompt,
    format: 'mp3',
    looping: false
  }, onProgress);
}
