/**
 * Suno Music Generation Service
 * Uses original Suno API for AI music generation
 * Documentation: https://api.sunoapi.org/docs
 */

interface SunoGenerationRequest {
  prompt: string;
  style: string;
  title: string;
  customMode?: boolean;
  instrumental?: boolean;
  model?: string;
  callBackUrl?: string;
  negativeTags?: string;
}

interface SunoGenerationResponse {
  code: number;
  message: string;
  data: {
    taskId: string;
  };
}

interface SunoStatusResponse {
  code: number;
  message: string;
  data: {
    status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
    response?: {
      sunoData: Array<{
        audioUrl: string;
        title: string;
        tags: string;
        duration: number;
      }>;
    };
  };
}

const SUNO_API_BASE = 'https://api.sunoapi.org/api/v1';

/**
 * Generate music using Suno AI
 */
export async function generateSunoMusic(
  request: SunoGenerationRequest,
  apiKey: string
): Promise<string> {
  const requestBody: any = {
    prompt: request.prompt,
    style: request.style,
    title: request.title,
    customMode: request.customMode ?? true,
    instrumental: request.instrumental ?? false,
    model: request.model ?? 'V3_5',
    callBackUrl: request.callBackUrl || 'https://example.com/callback',
  };

  if (request.negativeTags) {
    requestBody.negativeTags = request.negativeTags;
  }

  const response = await fetch(`${SUNO_API_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    console.error('Suno API error:', response.status, errorText);

    // Try to parse error message
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.message) {
        throw new Error(`Suno API Error: ${errorData.message}`);
      }
    } catch (e) {
      // Not JSON, use raw text
    }

    throw new Error(`Suno API Error (${response.status}): ${errorText || 'Unknown error'}`);
  }

  const data: SunoGenerationResponse = await response.json();

  if (data.code !== 200) {
    console.error('Suno generation failed:', data);
    const errorMsg = data.message || 'Failed to generate music';
    throw new Error(`Suno Error: ${errorMsg}`);
  }

  return data.data.taskId;
}

/**
 * Check the status of a music generation task
 */
export async function checkSunoStatus(
  taskId: string,
  apiKey: string
): Promise<SunoStatusResponse['data']> {
  const response = await fetch(
    `${SUNO_API_BASE}/generate/record-info?taskId=${taskId}`,
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    console.error('Suno status check error:', response.status, errorText);
    throw new Error(`Status Check Error (${response.status}): ${errorText}`);
  }

  const data: SunoStatusResponse = await response.json();

  if (data.code !== 200) {
    console.error('Suno status check failed:', data);
    throw new Error(data.message || 'Failed to check status');
  }

  return data.data;
}

/**
 * Generate music and wait for completion
 */
export async function generateAndWaitForMusic(
  request: SunoGenerationRequest,
  apiKey: string,
  onProgress?: (status: string) => void
): Promise<Array<{ audioUrl: string; title: string }>> {
  // Start generation
  const taskId = await generateSunoMusic(request, apiKey);
  onProgress?.('Music generation started...');

  // Poll for completion
  const maxAttempts = 60; // 10 minutes max (10 seconds per attempt)
  let attempts = 0;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

    const status = await checkSunoStatus(taskId, apiKey);

    if (status.status === 'SUCCESS' && status.response) {
      onProgress?.('Music generation complete!');
      return status.response.sunoData.map(track => ({
        audioUrl: track.audioUrl,
        title: track.title,
      }));
    } else if (status.status === 'FAILED') {
      throw new Error('Music generation failed');
    } else {
      onProgress?.(`Generating music... (${status.status})`);
    }

    attempts++;
  }

  throw new Error('Music generation timed out');
}
