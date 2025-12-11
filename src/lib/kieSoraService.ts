/**
 * Kie AI Sora 2 Video Service
 * Wrapper for Sora 2 video generation using the unified KieAI service
 */

const KIE_API_KEY = import.meta.env.VITE_KIE_API_KEY;
const KIE_BASE_URL = 'https://api.kie.ai';

export function isSora2Available(): boolean {
    return !!KIE_API_KEY;
}

export interface Sora2Options {
    prompt: string;
    aspect_ratio?: 'landscape' | 'portrait';
    n_frames?: string;
    remove_watermark?: boolean;
}

/**
 * Generate video using Sora 2 via Kie AI
 */
export async function generateSora2Video(
    options: Sora2Options,
    onProgress?: (status: string) => void
): Promise<string[]> {
    if (!KIE_API_KEY) {
        throw new Error('Kie AI API Key is missing. Please add VITE_KIE_API_KEY to your .env file.');
    }

    onProgress?.('Creating Sora 2 video task...');

    const response = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KIE_API_KEY}`
        },
        body: JSON.stringify({
            model: 'sora-2-text-to-video',
            input: {
                prompt: options.prompt,
                aspect_ratio: options.aspect_ratio || 'landscape',
                n_frames: options.n_frames || '10',
                remove_watermark: options.remove_watermark ?? true
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ msg: 'Unknown error' }));
        throw new Error(errorData.msg || `Sora 2 video generation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Sora 2 video task created:', data);

    if ((data.code === 200 || data.success) && data.data?.taskId) {
        const videoUrl = await pollSora2VideoStatus(data.data.taskId, onProgress);
        return [videoUrl];
    }

    throw new Error('No task ID in response');
}

async function pollSora2VideoStatus(
    taskId: string,
    onProgress?: (status: string) => void,
    maxAttempts: number = 120
): Promise<string> {
    console.log('⏳ Polling Sora 2 video status:', taskId);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        onProgress?.(`Processing ${attempt + 1}/${maxAttempts}...`);

        try {
            const response = await fetch(`${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=${taskId}`, {
                headers: { 'Authorization': `Bearer ${KIE_API_KEY}` }
            });

            if (!response.ok) continue;

            const data = await response.json();
            console.log(`📊 Sora 2 polling attempt ${attempt + 1}:`, JSON.stringify(data));

            const successFlag = data.data?.successFlag;
            const state = data.data?.state ?? data.data?.status;
            const stateStr = String(state).toUpperCase();
            const hasVideoUrl = data.data?.response?.resultUrls?.[0] || data.data?.resultJson;

            const isComplete = successFlag === 1 || successFlag === '1' ||
                stateStr === 'SUCCESS' || stateStr === 'COMPLETED' || stateStr === 'DONE' ||
                hasVideoUrl;
            const isFailed = successFlag === 2 || successFlag === 3 ||
                stateStr.includes('FAIL') || stateStr.includes('ERROR');

            if (isComplete) {
                let videoUrl = data.data?.response?.resultUrls?.[0] ||
                    data.data?.response?.resultWaterMarkUrls?.[0];

                if (!videoUrl && data.data?.resultJson) {
                    try {
                        const result = typeof data.data.resultJson === 'string'
                            ? JSON.parse(data.data.resultJson)
                            : data.data.resultJson;
                        videoUrl = result.resultUrls?.[0] || result.resultWaterMarkUrls?.[0] || result.videoUrl;
                    } catch (e) {
                        console.error('Failed to parse resultJson:', e);
                    }
                }

                if (!videoUrl) {
                    videoUrl = data.data?.resultUrls?.[0] || data.data?.videoUrl;
                }

                if (videoUrl) {
                    console.log('✅ Sora 2 video generation completed:', videoUrl);
                    return videoUrl;
                }
            } else if (isFailed) {
                throw new Error(data.data?.errorMessage || data.data?.failMsg || 'Sora 2 video generation failed');
            }
        } catch (e: any) {
            console.error(`❌ Sora 2 polling error:`, e.message);
            if (attempt === maxAttempts - 1) throw e;
        }
    }

    throw new Error('Sora 2 video generation timeout');
}
