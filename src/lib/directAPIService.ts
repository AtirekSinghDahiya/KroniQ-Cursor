/**
 * Direct API Service - Calls Runway ML and ElevenLabs APIs directly
 * Used as fallback when Supabase Edge Functions are not available
 */

import { addDebugLog } from '../components/Debug/DebugPanel';

const RUNWAY_API_KEY = import.meta.env.VITE_RUNWAY_API_KEY;
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

export interface VideoGenerationRequest {
  prompt: string;
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface VideoGenerationResponse {
  taskId: string;
  status: string;
}

export interface VideoStatusResponse {
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  videoUrl?: string;
  progress?: number;
  error?: string;
}

export interface VoiceGenerationRequest {
  text: string;
  voiceId?: string;
}

export const generateVideoWithRunway = async (
  request: VideoGenerationRequest
): Promise<string> => {
  addDebugLog('info', '🎬 Calling Runway ML API directly (gen4_turbo)...');
  console.log('🎬 Direct Runway API call:', request);

  if (!RUNWAY_API_KEY) {
    throw new Error('Runway API key not configured');
  }

  try {
    const ratio = request.aspectRatio === '9:16'
      ? '720:1280'
      : request.aspectRatio === '1:1'
      ? '960:960'
      : '1280:720';

    const payload = {
      promptText: request.prompt,
      model: 'gen4_turbo',
      duration: request.duration || 5,
      ratio: ratio,
      watermark: false
    };

    addDebugLog('info', `Payload: ${JSON.stringify(payload)}`);

    const response = await fetch('https://api.runwayml.com/v1/text_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    addDebugLog('info', `Response (${response.status}): ${responseText.substring(0, 200)}`);

    if (!response.ok) {
      throw new Error(`Runway API error (${response.status}): ${responseText}`);
    }

    const data = JSON.parse(responseText);

    if (!data.id) {
      throw new Error('No task ID returned from Runway API');
    }

    addDebugLog('success', `✅ Task created: ${data.id}`);

    return data.id;
  } catch (error: any) {
    addDebugLog('error', `❌ Error: ${error.message}`);
    console.error('Runway API error:', error);
    throw error;
  }
};

export const checkRunwayVideoStatus = async (
  taskId: string
): Promise<VideoStatusResponse> => {
  if (!RUNWAY_API_KEY) {
    throw new Error('Runway API key not configured');
  }

  try {
    const response = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06'
      }
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Status check failed (${response.status}): ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log('Runway status response:', data);

    let videoUrl = null;
    if (data.status === 'SUCCEEDED') {
      videoUrl = data.output?.[0] || data.artifacts?.[0]?.url || data.output?.url || data.video?.url || data.outputUrl;
    }

    return {
      status: data.status,
      videoUrl: videoUrl || undefined,
      progress: data.progress || (data.status === 'RUNNING' ? 50 : 0),
      error: data.failure || data.failureReason || data.error
    };
  } catch (error: any) {
    console.error('Status check error:', error);
    throw error;
  }
};

export const pollRunwayVideo = async (
  taskId: string,
  onProgress?: (progress: number) => void,
  maxAttempts = 120,
  interval = 3000
): Promise<string> => {
  let attempts = 0;
  let lastProgress = 0;

  addDebugLog('info', '⏳ Polling for video completion...');

  while (attempts < maxAttempts) {
    try {
      const status = await checkRunwayVideoStatus(taskId);

      if (status.status === 'SUCCEEDED' && status.videoUrl) {
        addDebugLog('success', `✅ Video ready! URL: ${status.videoUrl}`);
        return status.videoUrl;
      }

      if (status.status === 'FAILED') {
        addDebugLog('error', `Video generation failed: ${status.error || 'Unknown error'}`);
        throw new Error(status.error || 'Video generation failed');
      }

      if (status.status === 'RUNNING' || status.status === 'PENDING') {
        lastProgress = Math.min(lastProgress + 2, 95);
        if (onProgress) {
          onProgress(lastProgress);
        }
        addDebugLog('info', `🔄 Status: ${status.status} (${lastProgress}%)`);
      }

      await new Promise(resolve => setTimeout(resolve, interval));
      attempts++;
    } catch (error: any) {
      console.error('Polling error:', error);
      if (attempts > 5) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
      attempts++;
    }
  }

  throw new Error('Video generation timed out');
};

export const generateVoiceWithElevenLabs = async (
  request: VoiceGenerationRequest
): Promise<Blob> => {
  addDebugLog('info', '🎤 Calling ElevenLabs API directly...');
  console.log('🎤 Direct ElevenLabs API call:', { textLength: request.text.length });

  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured');
  }

  try {
    const voiceId = request.voiceId || '21m00Tcm4TlvDq8ikWAM';

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text: request.text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      addDebugLog('error', `ElevenLabs error (${response.status}): ${errorText}`);
      throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
    }

    const audioBlob = await response.blob();
    addDebugLog('success', `✅ Audio generated: ${audioBlob.size} bytes`);

    return audioBlob;
  } catch (error: any) {
    addDebugLog('error', `❌ Error: ${error.message}`);
    console.error('ElevenLabs API error:', error);
    throw error;
  }
};
