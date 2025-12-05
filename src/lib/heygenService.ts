const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const HEYGEN_API_KEY = import.meta.env.VITE_HEYGEN_API_KEY;

export interface HeyGenVideoRequest {
  script: string;
  avatarId?: string;
  voiceId?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface HeyGenVideoResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
}

export async function generateHeyGenVideo(request: HeyGenVideoRequest): Promise<HeyGenVideoResponse> {
  console.log('🎬 Generating AI avatar video with HeyGen:', request);

  try {
    const apiUrl = `${SUPABASE_URL}/functions/v1/generate-heygen-video`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'generate',
        script: request.script,
        avatarId: request.avatarId,
        voiceId: request.voiceId,
        aspectRatio: request.aspectRatio,
        apiKey: HEYGEN_API_KEY,
      }),
    });

    const responseText = await response.text();
    console.log('📥 HeyGen edge function response:', responseText);

    if (!response.ok) {
      let errorMsg = responseText;
      try {
        const errorData = JSON.parse(responseText);
        errorMsg = errorData.error || errorData.message || responseText;
      } catch (e) {
        // responseText is not JSON, use as-is
      }
      throw new Error(`HeyGen API error: ${errorMsg}`);
    }

    const data = JSON.parse(responseText);

    if (data.error) {
      const errorMsg = typeof data.error === 'string' ? data.error : data.error.message || 'HeyGen API error';
      throw new Error(errorMsg);
    }

    const videoId = data.data?.video_id;
    if (!videoId) {
      throw new Error('No video ID returned from HeyGen API');
    }

    console.log('✅ HeyGen video generation started:', videoId);

    return {
      id: videoId,
      status: 'processing',
    };
  } catch (error: any) {
    console.error('❌ HeyGen generation error:', error);
    throw new Error(error.message || 'Failed to generate video with HeyGen');
  }
}

export async function pollHeyGenStatus(videoId: string): Promise<HeyGenVideoResponse> {
  try {
    const apiUrl = `${SUPABASE_URL}/functions/v1/generate-heygen-video`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'status',
        videoId,
        apiKey: HEYGEN_API_KEY,
      }),
    });

    const responseText = await response.text();
    console.log('📊 HeyGen status response:', responseText);

    if (!response.ok) {
      let errorMsg = responseText;
      try {
        const errorData = JSON.parse(responseText);
        errorMsg = errorData.error || errorData.message || responseText;
      } catch (e) {
        // responseText is not JSON, use as-is
      }
      throw new Error(`Failed to check status: ${errorMsg}`);
    }

    const data = JSON.parse(responseText);

    if (data.error) {
      const errorMsg = typeof data.error === 'string' ? data.error : data.error.message || 'Failed to check video status';
      throw new Error(errorMsg);
    }

    const videoData = data.data;
    let status: 'pending' | 'processing' | 'completed' | 'failed' = 'processing';
    let videoUrl = null;

    if (videoData.status === 'completed') {
      status = 'completed';
      videoUrl = videoData.video_url;
    } else if (videoData.status === 'failed') {
      status = 'failed';
    } else if (videoData.status === 'pending') {
      status = 'pending';
    }

    return {
      id: videoId,
      status,
      video_url: videoUrl,
      thumbnail_url: videoData.thumbnail_url,
      error: videoData.error,
    };
  } catch (error: any) {
    console.error('❌ HeyGen status check error:', error);
    throw new Error(error.message || 'Failed to check video status');
  }
}

export function isHeyGenAvailable(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && HEYGEN_API_KEY);
}
