/**
 * AIMLAPI Veo-3 Text-to-Video Service
 * Integrates with AIMLAPI for Google Veo-3 video generation
 */

interface AimlapiVideoRequest {
  prompt: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  duration?: 4 | 8;
  seed?: number;
}

interface AimlapiGenerationResponse {
  generation_id?: string;
  id?: string;
  status?: string;
  video_url?: string;
  output?: string;
  error?: string;
  message?: string;
}

const AIMLAPI_BASE = 'https://api.aimlapi.com/v2/generate/video/google';

/**
 * Generate video with AIMLAPI Veo-3
 */
export async function generateAimlapiVideo(
  request: AimlapiVideoRequest,
  apiKey: string
): Promise<string> {
  const requestBody = {
    model: 'google/veo-3.0-fast',
    prompt: request.prompt,
    aspect_ratio: request.aspectRatio || '16:9',
    duration: request.duration || 4,
    seed: request.seed || Math.floor(Math.random() * 1000000),
  };

  console.log('📤 AIMLAPI Veo-3 request:', requestBody);

  const response = await fetch(`${AIMLAPI_BASE}/generation`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  console.log('📥 AIMLAPI raw response:', responseText);

  if (!response.ok) {
    console.error('❌ AIMLAPI error:', response.status, responseText);

    // Check for verification error
    if (response.status === 403 && responseText.includes('verification')) {
      throw new Error('AIMLAPI account requires verification. Please visit https://aimlapi.com/app/billing/verification to complete verification before using Veo-3.');
    }

    throw new Error(`API Error (${response.status}): ${responseText}`);
  }

  let data: AimlapiGenerationResponse;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error('❌ Failed to parse response:', responseText);
    throw new Error('Invalid API response format');
  }

  console.log('📊 AIMLAPI parsed response:', data);

  if (data.error || data.message?.includes('error')) {
    throw new Error(data.error || data.message || 'Video generation failed');
  }

  const generationId = data.generation_id || data.id;
  if (!generationId) {
    console.error('❌ No generation ID in response:', data);
    throw new Error('No generation ID received from API');
  }

  return generationId;
}

/**
 * Check the status of an AIMLAPI video generation
 */
export async function checkAimlapiVideoStatus(
  generationId: string,
  apiKey: string
): Promise<AimlapiGenerationResponse> {
  console.log('🔍 Checking status for:', generationId);

  const response = await fetch(`${AIMLAPI_BASE}/generation/${generationId}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    console.error('❌ AIMLAPI status check error:', response.status, errorText);
    throw new Error(`Status Check Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log('📊 Status response:', data);
  return data;
}

/**
 * Generate video with AIMLAPI and poll for completion
 */
export async function generateAndWaitForAimlapiVideo(
  request: AimlapiVideoRequest,
  apiKey: string,
  onProgress?: (status: string, percent: number) => void
): Promise<string> {
  console.log('🎬 Starting AIMLAPI video generation...');

  const generationId = await generateAimlapiVideo(request, apiKey);
  console.log('✅ Generation started with ID:', generationId);

  onProgress?.('Video generation started...', 10);

  const maxAttempts = 120;
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;

    try {
      const status = await checkAimlapiVideoStatus(generationId, apiKey);
      const progressPercent = 10 + (attempts / maxAttempts) * 80;

      console.log(`📈 Attempt ${attempts}/${maxAttempts} - Status:`, status);

      const videoUrl = status.video_url || status.output;
      const currentStatus = status.status?.toLowerCase();

      if (videoUrl) {
        console.log('✅ Video ready!', videoUrl);
        onProgress?.('Video generation complete!', 100);
        return videoUrl;
      }

      if (currentStatus === 'failed' || status.error) {
        throw new Error(status.error || status.message || 'Video generation failed');
      }

      if (currentStatus === 'completed' && !videoUrl) {
        throw new Error('Video completed but no URL provided');
      }

      const statusText = currentStatus || 'processing';
      onProgress?.(`Generating video... (${statusText})`, progressPercent);

    } catch (error: any) {
      console.error('❌ Status check failed:', error);
      throw error;
    }
  }

  throw new Error('Video generation timed out after 10 minutes');
}

/**
 * Check if AIMLAPI is available
 */
export function isAimlapiAvailable(): boolean {
  return Boolean(import.meta.env.VITE_AIMLAPI_KEY);
}
