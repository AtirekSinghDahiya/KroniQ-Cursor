/**
 * Kie AI Veo 3 Video Service
 * Wrapper for Veo 3 video generation using the unified KieAI service
 */

const KIE_API_KEY = import.meta.env.VITE_KIE_API_KEY;
const KIE_BASE_URL = 'https://api.kie.ai';

export function isVeo3Available(): boolean {
    return !!KIE_API_KEY;
}

export interface Veo3Options {
    prompt: string;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    model?: 'veo3_fast' | 'veo3';
    enableFallback?: boolean;
    enableTranslation?: boolean;
}

/**
 * Generate video using Veo 3 via Kie AI
 */
export async function generateVeo3Video(
    options: Veo3Options,
    onProgress?: (status: string) => void
): Promise<string> {
    if (!KIE_API_KEY) {
        throw new Error('Kie AI API Key is missing. Please add VITE_KIE_API_KEY to your .env file.');
    }

    onProgress?.('Creating Veo 3 video task...');

    const response = await fetch(`${KIE_BASE_URL}/api/v1/veo/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KIE_API_KEY}`
        },
        body: JSON.stringify({
            prompt: options.prompt,
            model: options.model || 'veo3_fast',
            generationType: 'TEXT_2_VIDEO',
            aspectRatio: options.aspectRatio || '16:9',
            enableTranslation: options.enableTranslation ?? true
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ msg: 'Unknown error' }));
        throw new Error(errorData.msg || `Veo 3 video generation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Veo 3 video task created:', data);

    if (data.code === 200 && data.data?.taskId) {
        return await pollVeo3VideoStatus(data.data.taskId, onProgress);
    }

    throw new Error('No task ID in response');
}

async function pollVeo3VideoStatus(
    taskId: string,
    onProgress?: (status: string) => void,
    maxAttempts: number = 120
): Promise<string> {
    console.log('⏳ Polling Veo 3 video status:', taskId);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        onProgress?.(`Processing ${attempt + 1}/${maxAttempts}...`);

        try {
            const response = await fetch(`${KIE_BASE_URL}/api/v1/veo/record-info?taskId=${taskId}`, {
                headers: { 'Authorization': `Bearer ${KIE_API_KEY}` }
            });

            if (!response.ok) continue;

            const data = await response.json();
            console.log(`📊 Veo 3 polling attempt ${attempt + 1}:`, JSON.stringify(data));

            const successFlag = data.data?.successFlag;
            const status = data.data?.status ?? data.status ?? data.data?.state;
            const statusStr = String(status).toUpperCase();
            const hasVideoUrl = data.data?.response?.resultUrls?.[0] || data.data?.info?.resultUrls?.[0];

            const isComplete = successFlag === 1 || successFlag === '1' ||
                status === 1 || status === '1' ||
                statusStr === 'SUCCESS' || statusStr === 'COMPLETED' || statusStr === 'DONE' ||
                hasVideoUrl;

            const isFailed = successFlag === 2 || successFlag === 3 ||
                status === 2 || status === 3 ||
                statusStr.includes('FAIL') || statusStr.includes('ERROR') ||
                data.data?.errorCode || data.data?.errorMessage;

            if (isComplete) {
                const videoUrl = data.data?.response?.resultUrls?.[0] ||
                    data.data?.info?.resultUrls?.[0] ||
                    data.data?.resultUrls?.[0] ||
                    data.data?.resultVideoUrl ||
                    data.data?.videoUrl ||
                    data.data?.video_url ||
                    data.data?.url ||
                    data.data?.output;

                if (videoUrl) {
                    console.log('✅ Veo 3 video generation completed:', videoUrl);
                    return videoUrl;
                }
            } else if (isFailed) {
                throw new Error(data.data?.errorMessage || data.data?.error || 'Veo 3 video generation failed');
            }
        } catch (e: any) {
            console.error(`❌ Veo 3 polling error:`, e.message);
            if (attempt === maxAttempts - 1) throw e;
        }
    }

    throw new Error('Veo 3 video generation timeout');
}
