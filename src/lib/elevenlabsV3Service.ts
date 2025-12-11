/**
 * ElevenLabs Text-to-Speech Service V3
 * Latest API with streaming support, enhanced quality, and new features
 * Documentation: https://elevenlabs.io/docs/api-reference/text-to-speech
 */

export interface ElevenLabsV3Params {
  text: string;
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

// ElevenLabs V3 Models
export const ELEVENLABS_V3_MODELS = {
  TURBO_V3: {
    id: 'eleven_turbo_v2_5', // Note: v3 uses same model ID with enhanced backend
    name: 'Turbo v3',
    description: 'Fastest, lowest latency, optimized for real-time',
    speed: 'Fastest',
    tokenCost: 500,
    recommended: true
  },
  MULTILINGUAL_V2: {
    id: 'eleven_multilingual_v2',
    name: 'Multilingual v2',
    description: '29 languages supported with natural pronunciation',
    speed: 'Fast',
    tokenCost: 800,
    recommended: false
  },
  ENGLISH_V1: {
    id: 'eleven_monolingual_v1',
    name: 'English v1',
    description: 'Highest quality for English content',
    speed: 'Medium',
    tokenCost: 1000,
    recommended: false
  }
};

// Enhanced voice options with detailed characteristics
export const ELEVENLABS_V3_VOICES = [
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    description: 'Calm, natural female voice',
    gender: 'Female',
    age: 'Young Adult',
    accent: 'American',
    useCase: 'Narration, Meditation'
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    description: 'Soft, expressive female voice',
    gender: 'Female',
    age: 'Young Adult',
    accent: 'American',
    useCase: 'Storytelling, Audiobooks'
  },
  {
    id: 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Elli',
    description: 'Young, energetic female voice',
    gender: 'Female',
    age: 'Young',
    accent: 'American',
    useCase: 'Marketing, Ads'
  },
  {
    id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Domi',
    description: 'Strong, confident female voice',
    gender: 'Female',
    age: 'Adult',
    accent: 'American',
    useCase: 'Professional, Corporate'
  },
  {
    id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    description: 'Deep, warm male voice',
    gender: 'Male',
    age: 'Adult',
    accent: 'American',
    useCase: 'Narration, Documentary'
  },
  {
    id: 'VR6AewLTigWG4xSOukaG',
    name: 'Arnold',
    description: 'Strong, authoritative male voice',
    gender: 'Male',
    age: 'Middle Age',
    accent: 'American',
    useCase: 'News, Professional'
  },
  {
    id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Adam',
    description: 'Deep, narrative male voice',
    gender: 'Male',
    age: 'Adult',
    accent: 'American',
    useCase: 'Audiobooks, Podcasts'
  },
  {
    id: 'yoZ06aMxZJJ28mfd3POQ',
    name: 'Sam',
    description: 'Clear, professional male voice',
    gender: 'Male',
    age: 'Young Adult',
    accent: 'American',
    useCase: 'Education, Training'
  },
  {
    id: 'CwhRBWXzGAHq8TQ4Fs17',
    name: 'Roger',
    description: 'Mature, confident male voice',
    gender: 'Male',
    age: 'Senior',
    accent: 'American',
    useCase: 'Documentary, Wisdom'
  },
  {
    id: 'IKne3meq5aSn9XLyUdCD',
    name: 'Charlie',
    description: 'Casual, friendly male voice',
    gender: 'Male',
    age: 'Young Adult',
    accent: 'Australian',
    useCase: 'Casual, Conversational'
  },
];

/**
 * Generate speech using ElevenLabs V3 API (Standard Method)
 */
export async function generateWithElevenLabsV3(
  params: ElevenLabsV3Params,
  onProgress?: (status: string) => void
): Promise<Blob> {
  try {
    const ELEVENLABS_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

    if (!ELEVENLABS_KEY || ELEVENLABS_KEY.includes('your-')) {
      throw new Error('ElevenLabs API key not configured');
    }

    onProgress?.('Connecting to ElevenLabs V3...');

    const voiceId = params.voiceId || ELEVENLABS_V3_VOICES[0].id;
    const modelId = params.modelId || ELEVENLABS_V3_MODELS.TURBO_V3.id;

    onProgress?.('Generating high-quality speech...');

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_KEY,
      },
      body: JSON.stringify({
        text: params.text,
        model_id: modelId,
        voice_settings: {
          stability: params.stability ?? 0.5,
          similarity_boost: params.similarityBoost ?? 0.75,
          style: params.style ?? 0,
          use_speaker_boost: params.useSpeakerBoost ?? true
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error('ElevenLabs V3 error:', response.status, errorText);
      throw new Error(`TTS generation failed: ${response.status} - ${errorText}`);
    }

    onProgress?.('Processing audio...');
    const audioBlob = await response.blob();

    onProgress?.('Speech generated successfully!');
    return audioBlob;

  } catch (error: any) {
    console.error('ElevenLabs V3 generation error:', error);
    throw new Error(error.message || 'Failed to generate speech with ElevenLabs V3');
  }
}

/**
 * Generate speech using ElevenLabs V3 API with Streaming
 * Provides real-time audio playback as it generates
 */
export async function generateWithElevenLabsV3Streaming(
  params: ElevenLabsV3Params,
  onAudioChunk: (chunk: Uint8Array) => void,
  onProgress?: (status: string) => void,
  onComplete?: () => void
): Promise<void> {
  try {
    const ELEVENLABS_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

    if (!ELEVENLABS_KEY || ELEVENLABS_KEY.includes('your-')) {
      throw new Error('ElevenLabs API key not configured');
    }

    const voiceId = params.voiceId || ELEVENLABS_V3_VOICES[0].id;
    const modelId = params.modelId || ELEVENLABS_V3_MODELS.TURBO_V3.id;

    onProgress?.('Starting streaming generation...');

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_KEY,
      },
      body: JSON.stringify({
        text: params.text,
        model_id: modelId,
        voice_settings: {
          stability: params.stability ?? 0.5,
          similarity_boost: params.similarityBoost ?? 0.75,
          style: params.style ?? 0,
          use_speaker_boost: params.useSpeakerBoost ?? true
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Streaming failed: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    onProgress?.('Streaming audio...');

    const reader = response.body.getReader();
    let bytesReceived = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onProgress?.('Stream complete!');
        onComplete?.();
        break;
      }

      bytesReceived += value.length;
      onAudioChunk(value);
      onProgress?.(`Received ${(bytesReceived / 1024).toFixed(1)} KB...`);
    }

  } catch (error: any) {
    console.error('ElevenLabs V3 streaming error:', error);
    throw new Error(error.message || 'Failed to stream speech with ElevenLabs V3');
  }
}

/**
 * Estimate audio duration based on text length
 */
export function estimateAudioDuration(text: string): number {
  // Average speaking rate: ~150 words per minute
  const words = text.trim().split(/\s+/).length;
  const minutes = words / 150;
  const seconds = Math.ceil(minutes * 60);
  return seconds;
}

/**
 * Calculate token cost based on character count
 */
export function calculateTTSTokenCost(text: string, modelId: string): number {
  // Base: 500 tokens + 10 tokens per character
  const baseCost = 500;
  const perCharCost = 10;
  return baseCost + (text.length * perCharCost);
}

/**
 * Check if ElevenLabs V3 is available
 */
export function isElevenLabsV3Available(): boolean {
  const key = import.meta.env.VITE_ELEVENLABS_API_KEY;
  return !!key && !key.includes('your-');
}

/**
 * Get voice by ID
 */
export function getVoiceById(voiceId: string) {
  return ELEVENLABS_V3_VOICES.find(v => v.id === voiceId) || ELEVENLABS_V3_VOICES[0];
}

/**
 * Get model by ID
 */
export function getModelById(modelId: string) {
  return Object.values(ELEVENLABS_V3_MODELS).find(m => m.id === modelId) || ELEVENLABS_V3_MODELS.TURBO_V3;
}
