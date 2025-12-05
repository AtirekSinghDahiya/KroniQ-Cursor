/**
 * MiniMax Hailuo Text-to-Video Service
 * Official MiniMax Hailuo API implementation
 */

export interface HailuoVideoParams {
  prompt: string;
  model?: 'MiniMax-Hailuo-2.3' | 'MiniMax-Hailuo-02' | 'T2V-01-Director' | 'T2V-01';
  duration?: 6 | 10;
  resolution?: '720P' | '768P' | '1080P';
  promptOptimizer?: boolean;
  fastPretreatment?: boolean;
}

interface HailuoTaskResponse {
  task_id: string;
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

interface HailuoStatusResponse {
  task_id: string;
  status: 'processing' | 'success' | 'failed';
  file_id?: string;
  video_url?: string;
  base_resp: {
    status_code: number;
    status_msg: string;
  };
}

const HAILUO_API_BASE = 'https://api.minimaxi.chat/v1';

/**
 * Generate video using MiniMax Hailuo API
 */
export async function generateWithHailuo(
  params: HailuoVideoParams,
  onProgress?: (status: string) => void
): Promise<string> {
  try {
    const HAILUO_KEY = import.meta.env.VITE_HAILUO_API_KEY;

    if (!HAILUO_KEY || HAILUO_KEY.includes('your-')) {
      throw new Error('MiniMax Hailuo API key not configured');
    }

    onProgress?.('Initializing Hailuo video generation...');

    const requestBody = {
      model: params.model || 'MiniMax-Hailuo-2.3',
      prompt: params.prompt,
      prompt_optimizer: params.promptOptimizer !== false,
      fast_pretreatment: params.fastPretreatment || false,
      duration: params.duration || 6,
      resolution: params.resolution || '768P',
    };

    console.log('🎬 Hailuo API request:', requestBody);

    // Start generation
    const response = await fetch(`${HAILUO_API_BASE}/video_generation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HAILUO_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Hailuo API Error:', response.status, errorText);
      throw new Error(`Hailuo API Error (${response.status}): ${errorText}`);
    }

    const data: HailuoTaskResponse = await response.json();
    console.log('📊 Hailuo response:', data);

    if (data.base_resp?.status_code !== 0 || !data.task_id) {
      throw new Error(data.base_resp?.status_msg || 'No task ID in response');
    }

    const taskId = data.task_id;
    onProgress?.('Video generation in progress...');

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 120; // 20 minutes max (10 seconds per check)

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

      const statusResponse = await fetch(
        `${HAILUO_API_BASE}/query/video_generation?task_id=${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${HAILUO_KEY}`,
          },
        }
      );

      if (!statusResponse.ok) {
        console.error('❌ Status check failed:', statusResponse.status);
        attempts++;
        continue;
      }

      const statusData: HailuoStatusResponse = await statusResponse.json();
      console.log(`📈 Status check ${attempts + 1}:`, statusData);

      if (statusData.base_resp?.status_code !== 0) {
        throw new Error(statusData.base_resp?.status_msg || 'Status check failed');
      }

      if (statusData.status === 'success' && statusData.file_id) {
        // Get the video URL
        const videoUrl = `${HAILUO_API_BASE}/files/retrieve?file_id=${statusData.file_id}`;
        onProgress?.('Video generated successfully!');
        console.log('✅ Video ready:', videoUrl);
        return videoUrl;
      } else if (statusData.status === 'failed') {
        throw new Error('Video generation failed');
      }

      const progressPercent = Math.min(90, (attempts / maxAttempts) * 100);
      onProgress?.(`Generating video... (${Math.round(progressPercent)}%)`);

      attempts++;
    }

    throw new Error('Video generation timed out after 20 minutes');

  } catch (error: any) {
    console.error('❌ Hailuo generation error:', error);
    throw new Error(error.message || 'Failed to generate video with Hailuo');
  }
}

/**
 * Check if Hailuo is available
 */
export function isHailuoAvailable(): boolean {
  const key = import.meta.env.VITE_HAILUO_API_KEY;
  return !!key && !key.includes('your-');
}
