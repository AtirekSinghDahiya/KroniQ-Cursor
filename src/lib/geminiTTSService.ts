/**
 * Gemini Text-to-Speech Service
 * Uses AIMLAPI with high-quality TTS model
 * Documentation: https://docs.aimlapi.com/api-references/speech-models/text-to-speech
 */

export interface GeminiTTSParams {
  text: string;
  voice?: string;
  language?: string;
  speed?: number;
  pitch?: number;
}

// Available voices
export const GEMINI_VOICES = [
  { id: 'alloy', name: 'Alloy - Neutral', language: 'en', gender: 'neutral' },
  { id: 'echo', name: 'Echo - Male', language: 'en', gender: 'male' },
  { id: 'fable', name: 'Fable - British', language: 'en', gender: 'male' },
  { id: 'onyx', name: 'Onyx - Deep', language: 'en', gender: 'male' },
  { id: 'nova', name: 'Nova - Female', language: 'en', gender: 'female' },
  { id: 'shimmer', name: 'Shimmer - Soft Female', language: 'en', gender: 'female' },
];

/**
 * Generate speech using AIMLAPI TTS (HD quality)
 */
export async function generateWithGeminiTTS(
  params: GeminiTTSParams,
  onProgress?: (status: string) => void
): Promise<string> {
  try {
    const AIML_KEY = import.meta.env.VITE_AIMLAPI_KEY;

    if (!AIML_KEY) {
      throw new Error('AIMLAPI key not configured');
    }

    onProgress?.('Initializing text-to-speech...');

    const voice = params.voice || 'nova';

    onProgress?.('Generating speech...');

    const response = await fetch('https://api.aimlapi.com/v1/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AIML_KEY}`,
      },
      body: JSON.stringify({
        model: 'openai/tts-1-hd',
        text: params.text,
        voice: voice,
        response_format: 'mp3',
        speed: params.speed || 1.0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('TTS generation error:', response.status, errorData);
      throw new Error(`TTS generation error: ${response.status} - ${errorData.error?.message || errorData.message || response.statusText}`);
    }

    // Convert audio blob to base64
    const audioBlob = await response.blob();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        onProgress?.('Speech generated successfully!');
        resolve(reader.result as string);
      };
      reader.onerror = () => reject(new Error('Failed to read audio data'));
      reader.readAsDataURL(audioBlob);
    });

  } catch (error: any) {
    console.error('Gemini TTS error:', error);
    throw new Error(error.message || 'Failed to generate speech with Gemini TTS');
  }
}

/**
 * Check if Gemini TTS is available
 */
export function isGeminiTTSAvailable(): boolean {
  const key = import.meta.env.VITE_AIMLAPI_KEY;
  return !!key;
}
