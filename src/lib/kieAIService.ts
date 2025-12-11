const KIE_API_KEY = import.meta.env.VITE_KIE_API_KEY;
const KIE_BASE_URL = 'https://api.kie.ai';

export async function generateKieImage(prompt: string, model: string = 'flux-pro'): Promise<string> {
  console.log('🎨 Generating image with Kie AI:', { prompt, model });

  if (!KIE_API_KEY) {
    throw new Error('Kie AI API Key is missing. Please add VITE_KIE_API_KEY to your .env file.');
  }

  try {
    if (model === '4o-image' || model === 'gpt-image-1') {
      return await generateGPT4oImage(prompt);
    }

    if (model.startsWith('google/')) {
      return await generateGoogleImage(prompt, model);
    }

    if (model.startsWith('seedream/')) {
      return await generateSeedreamImage(prompt, model);
    }

    if (model.startsWith('grok-imagine/')) {
      return await generateGrokImagineImage(prompt, model);
    }

    return await generateFluxImage(prompt, model);
  } catch (error) {
    console.error('❌ Kie AI image generation error:', error);
    throw error;
  }
}

async function generateFluxImage(prompt: string, model: string): Promise<string> {
  const modelMap: { [key: string]: string } = {
    'flux-kontext': 'flux-kontext-pro',
    'flux-kontext-pro': 'flux-kontext-pro',
    'flux-kontext-max': 'flux-kontext-max',
    'flux-pro': 'flux-kontext-pro',
    'flux-dev': 'flux-kontext-pro',
    'flux-max': 'flux-kontext-max',
    'sdxl': 'flux-kontext-pro'
  };

  const actualModel = modelMap[model] || 'flux-kontext-pro';

  const response = await fetch(`${KIE_BASE_URL}/api/v1/flux/kontext/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIE_API_KEY}`
    },
    body: JSON.stringify({
      prompt: prompt,
      model: actualModel,
      aspectRatio: '1:1',
      outputFormat: 'jpeg',
      enableTranslation: true,
      promptUpsampling: false,
      safetyTolerance: 2
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ msg: 'Unknown error' }));
    console.error('❌ Flux image generation failed:', response.status, errorData);
    throw new Error(errorData.msg || `Image generation failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Flux image task created:', data);

  if (data.code === 200 && data.data?.taskId) {
    return await pollFluxImageStatus(data.data.taskId);
  }

  throw new Error('No task ID in response');
}

async function pollFluxImageStatus(taskId: string, maxAttempts: number = 60): Promise<string> {
  console.log('⏳ Polling Flux image status:', taskId);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // KIE AI uses /record-info endpoint with taskId as query param
      const response = await fetch(`${KIE_BASE_URL}/api/v1/flux/kontext/record-info?taskId=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`
        }
      });

      if (!response.ok) {
        console.log(`⚠️ Polling attempt ${attempt + 1}: response not ok (${response.status})`);
        continue;
      }

      const data = await response.json();
      console.log(`📊 Flux polling attempt ${attempt + 1}:`, JSON.stringify(data));

      // Flux API uses:
      // - successFlag: 0=generating, 1=success
      // - response.resultImageUrl: the generated image URL
      const successFlag = data.data?.successFlag;
      const hasImageUrl = data.data?.response?.resultImageUrl;

      console.log(`🔍 Flux status check: successFlag=${successFlag}, hasImageUrl=${!!hasImageUrl}`);

      // Check if complete - successFlag === 1 means success
      const isComplete = successFlag === 1 || successFlag === '1' || hasImageUrl;

      // Check if failed
      const isFailed = data.data?.errorCode || data.data?.errorMessage;

      if (isComplete) {
        // Flux returns URL in data.response.resultImageUrl
        const imageUrl = data.data?.response?.resultImageUrl ||
          data.data?.info?.resultImageUrl ||
          data.data?.resultImageUrl ||
          data.data?.result?.url ||
          data.data?.imageUrls?.[0] ||
          data.data?.imageUrl ||
          data.data?.url ||
          data.data?.output;
        if (imageUrl) {
          console.log('✅ Flux image generation completed:', imageUrl);
          return imageUrl;
        } else {
          console.log('⚠️ successFlag=1 but no image URL found in response:', JSON.stringify(data));
        }
      } else if (isFailed) {
        throw new Error(data.data?.errorMessage || data.data?.errorCode || 'Image generation failed');
      } else {
        console.log(`⏳ Flux status: successFlag=${successFlag}, waiting...`);
      }
    } catch (error: any) {
      console.error(`❌ Polling error attempt ${attempt + 1}:`, error.message);
      if (attempt === maxAttempts - 1) throw error;
    }
  }

  throw new Error('Image generation timeout after ' + maxAttempts + ' attempts');
}

async function generateGPT4oImage(prompt: string): Promise<string> {
  const response = await fetch(`${KIE_BASE_URL}/api/v1/gpt4o-image/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIE_API_KEY}`
    },
    body: JSON.stringify({
      prompt: prompt,
      size: '1:1',
      nVariants: 1,
      isEnhance: false,
      enableFallback: true,
      fallbackModel: 'FLUX_MAX'
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ msg: 'Unknown error' }));
    throw new Error(errorData.msg || `GPT-4o image generation failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.code === 200 && data.data?.taskId) {
    return await pollGPT4oImageStatus(data.data.taskId);
  }

  throw new Error('No task ID in response');
}

async function pollGPT4oImageStatus(taskId: string, maxAttempts: number = 60): Promise<string> {
  console.log('⏳ Polling GPT-4o image status:', taskId);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const response = await fetch(`${KIE_BASE_URL}/api/v1/gpt4o-image/record-info?taskId=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`
        }
      });

      if (!response.ok) {
        console.log(`⚠️ GPT-4o polling attempt ${attempt + 1}: response not ok`);
        continue;
      }

      const data = await response.json();
      console.log(`📊 GPT-4o polling attempt ${attempt + 1}:`, JSON.stringify(data));

      // GPT-4o uses status strings: GENERATING, SUCCESS, CREATE_TASK_FAILED, GENERATE_FAILED
      const status = data.data?.status ?? data.status ?? data.data?.result ?? data.result;
      const statusStr = String(status).toUpperCase(); // Use uppercase for comparison

      // Check if complete - handle GPT-4o's uppercase status
      const isComplete = status === 1 || status === '1' ||
        statusStr === 'SUCCESS' || statusStr === 'COMPLETED' || statusStr === 'DONE' ||
        data.data?.info?.result_urls?.[0] || data.data?.resultImageUrl;

      const isFailed = status === 2 || status === 3 ||
        statusStr === 'CREATE_TASK_FAILED' || statusStr === 'GENERATE_FAILED' ||
        statusStr.includes('FAIL') || statusStr.includes('ERROR');

      console.log(`🔍 GPT-4o status check: status="${status}", statusStr="${statusStr}", isComplete=${isComplete}, isFailed=${isFailed}`);

      if (isComplete) {
        // GPT-4o returns URL in data.info.result_urls array
        const imageUrl = data.data?.info?.result_urls?.[0] ||
          data.data?.info?.resultUrls?.[0] ||
          data.data?.resultImageUrl ||
          data.data?.result?.url ||
          data.data?.imageUrls?.[0] ||
          data.data?.imageUrl ||
          data.data?.url ||
          data.data?.output ||
          data.resultImageUrl ||
          data.imageUrl ||
          data.url;
        if (imageUrl) {
          console.log('✅ GPT-4o image completed:', imageUrl);
          return imageUrl;
        } else {
          console.log('⚠️ Status is complete but no image URL found:', JSON.stringify(data));
        }
      } else if (isFailed) {
        throw new Error(data.data?.error || data.error || data.message || 'GPT-4o image generation failed');
      } else {
        console.log(`⏳ GPT-4o status: ${status} (${statusStr}), waiting...`);
      }
    } catch (error: any) {
      console.error(`❌ GPT-4o polling error:`, error.message);
      if (attempt === maxAttempts - 1) throw error;
    }
  }

  throw new Error('GPT-4o image generation timeout');
}

async function generateGoogleImage(prompt: string, model: string): Promise<string> {
  console.log(`🎨 Generating ${model} image using jobs/createTask...`);

  // Map model IDs to their API model names
  const modelMap: { [key: string]: string } = {
    'google/nano-banana': 'google/nano-banana',
    'google/imagen4-ultra': 'google/imagen4-ultra'
  };

  const apiModel = modelMap[model] || model;

  const response = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KIE_API_KEY}` },
    body: JSON.stringify({
      model: apiModel,
      input: {
        prompt: prompt,
        aspect_ratio: '1:1',
        output_format: 'png'
      }
    })
  });

  if (!response.ok) throw new Error(`${model} generation failed: ${response.status}`);
  const data = await response.json();

  if (data.code === 200 && data.data?.taskId) {
    return await pollJobsImageStatus(data.data.taskId);
  }
  throw new Error('No task ID in response');
}

async function generateSeedreamImage(prompt: string, model: string): Promise<string> {
  console.log(`🎨 Generating Seedream image using jobs/createTask...`);
  const response = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KIE_API_KEY}` },
    body: JSON.stringify({
      model: 'seedream/4.5-text-to-image',
      input: {
        prompt: prompt,
        aspect_ratio: '1:1',
        quality: 'basic'
      }
    })
  });

  if (!response.ok) throw new Error(`Seedream generation failed: ${response.status}`);
  const data = await response.json();

  if (data.code === 200 && data.data?.taskId) {
    return await pollJobsImageStatus(data.data.taskId);
  }
  throw new Error('No task ID in response');
}

async function generateGrokImagineImage(prompt: string, model: string): Promise<string> {
  console.log(`🎨 Generating Grok Imagine image using jobs/createTask...`);
  const response = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KIE_API_KEY}` },
    body: JSON.stringify({
      model: 'grok-imagine/text-to-image',
      input: {
        prompt: prompt,
        aspect_ratio: '3:2'
      }
    })
  });

  if (!response.ok) throw new Error(`Grok Imagine generation failed: ${response.status}`);
  const data = await response.json();

  if (data.code === 200 && data.data?.taskId) {
    return await pollJobsImageStatus(data.data.taskId);
  }
  throw new Error('No task ID in response');
}

// Poll for jobs/createTask based image generation (Nano Banana, Imagen, Seedream, Grok Imagine)
async function pollJobsImageStatus(taskId: string, maxAttempts: number = 60): Promise<string> {
  console.log(`⏳ Polling jobs task status:`, taskId);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    try {
      const response = await fetch(`${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=${taskId}`, {
        headers: { 'Authorization': `Bearer ${KIE_API_KEY}` }
      });
      if (!response.ok) continue;

      const data = await response.json();
      console.log(`📊 Jobs polling attempt ${attempt + 1}:`, JSON.stringify(data));

      const state = data.data?.state ?? data.data?.status ?? data.state ?? data.status;
      const stateStr = String(state).toLowerCase();

      // Check for success states or presence of result
      const isComplete = stateStr === 'success' || stateStr === 'completed' || stateStr === 'done' ||
        data.data?.resultJson || data.data?.resultUrls;
      const isFailed = stateStr === 'fail' || stateStr === 'failed' || stateStr.includes('error');

      if (isComplete) {
        // Try to get URL from resultJson
        const resultJson = data.data?.resultJson;
        if (resultJson) {
          try {
            const result = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
            const url = result.resultUrls?.[0] || result.imageUrls?.[0] || result.imageUrl || result.url || result.output;
            if (url) {
              console.log('✅ Jobs image generation completed:', url);
              return url;
            }
          } catch (e) {
            console.error('Failed to parse resultJson:', e);
          }
        }

        // Try direct URL access
        const directUrl = data.data?.resultUrls?.[0] || data.data?.url || data.data?.imageUrl;
        if (directUrl) {
          console.log('✅ Jobs image generation completed (direct):', directUrl);
          return directUrl;
        }

        console.log('⚠️ Jobs status complete but no URL found:', JSON.stringify(data));
      } else if (isFailed) {
        throw new Error(data.data?.failMsg || data.data?.error || 'Image generation failed');
      } else {
        console.log(`⏳ Jobs status: ${state} (${stateStr}), waiting...`);
      }
    } catch (e: any) {
      console.error(`❌ Jobs polling error:`, e.message);
      if (attempt === maxAttempts - 1) throw e;
    }
  }
  throw new Error('Jobs image generation timeout');
}

// Keep legacy poll function for any remaining endpoints
async function pollGenericImageStatus(taskId: string, endpoint: string, maxAttempts: number = 60): Promise<string> {
  console.log(`⏳ Polling ${endpoint} image status:`, taskId);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    try {
      const response = await fetch(`${KIE_BASE_URL}/api/v1/${endpoint}/record-info?taskId=${taskId}`, {
        headers: { 'Authorization': `Bearer ${KIE_API_KEY}` }
      });
      if (!response.ok) continue;

      const data = await response.json();
      const status = data.data?.status ?? data.status;
      const isComplete = status === 1 || String(status).toLowerCase() === 'success' || String(status).toLowerCase() === 'completed';
      const isFailed = status === 2 || status === 3 || String(status).toLowerCase().includes('fail');

      if ((data.code === 200 || data.success) && isComplete) {
        const url = data.data?.resultImageUrl || data.data?.imageUrl || data.data?.url || data.data?.output;
        if (url) return url;
      } else if (isFailed) {
        throw new Error(`${endpoint} generation failed`);
      }
    } catch (e: any) {
      if (attempt === maxAttempts - 1) throw e;
    }
  }
  throw new Error(`${endpoint} generation timeout`);
}

export async function generateKieVideo(prompt: string, model: string = 'veo3_fast'): Promise<string> {
  console.log('🎬 Generating video with Kie AI:', { prompt, model });

  if (!KIE_API_KEY) {
    throw new Error('Kie AI API Key is missing. Please add VITE_KIE_API_KEY to your .env file.');
  }

  try {
    if (model === 'runway-gen3' || model === 'runway') {
      return await generateRunwayVideo(prompt);
    }

    if (model.includes('sora')) return await generateSoraVideo(prompt, model);
    if (model.includes('wan')) return await generateWanVideo(prompt, model);
    if (model.includes('kling')) return await generateKlingVideo(prompt, model);
    if (model.includes('grok')) return await generateGrokVideo(prompt, model);

    return await generateVeo3Video(prompt);
  } catch (error) {
    console.error('❌ Kie AI video generation error:', error);
    throw error;
  }
}

async function generateVeo3Video(prompt: string): Promise<string> {
  const response = await fetch(`${KIE_BASE_URL}/api/v1/veo/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIE_API_KEY}`
    },
    body: JSON.stringify({
      prompt: prompt,
      model: 'veo3_fast',
      generationType: 'TEXT_2_VIDEO',
      aspectRatio: '16:9',
      enableTranslation: true
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ msg: 'Unknown error' }));
    console.error('❌ Veo 3 video generation failed:', response.status, errorData);
    throw new Error(errorData.msg || `Video generation failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('✅ Veo 3 video task created:', data);

  if (data.code === 200 && data.data?.taskId) {
    return await pollVeo3VideoStatus(data.data.taskId);
  }

  throw new Error('No task ID in response');
}

async function pollVeo3VideoStatus(taskId: string, maxAttempts: number = 120): Promise<string> {
  console.log('⏳ Polling Veo 3 video status:', taskId);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      // KIE AI uses /record-info endpoint with taskId as query param
      const response = await fetch(`${KIE_BASE_URL}/api/v1/veo/record-info?taskId=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`
        }
      });

      if (!response.ok) {
        console.log(`⚠️ Video polling attempt ${attempt + 1}: response not ok (${response.status})`);
        continue;
      }

      const data = await response.json();
      console.log(`📊 Veo3 video polling attempt ${attempt + 1}:`, JSON.stringify(data));

      // Veo3 API may use successFlag like Flux, or status field
      // Check for both patterns
      const successFlag = data.data?.successFlag;
      const status = data.data?.status ?? data.status ?? data.data?.state ?? data.state;
      const statusStr = String(status).toUpperCase();
      const hasVideoUrl = data.data?.response?.resultUrls?.[0] || data.data?.info?.resultUrls?.[0];

      console.log(`🔍 Veo3 status check: successFlag=${successFlag}, status=${status}, hasVideoUrl=${!!hasVideoUrl}`);

      // Success detection - check successFlag first, then status patterns
      const isComplete = successFlag === 1 || successFlag === '1' ||
        status === 1 || status === '1' ||
        statusStr === 'SUCCESS' || statusStr === 'COMPLETED' || statusStr === 'DONE' ||
        hasVideoUrl;

      const isFailed = successFlag === 2 || successFlag === 3 ||
        status === 2 || status === 3 ||
        statusStr.includes('FAIL') || statusStr.includes('ERROR') ||
        data.data?.errorCode || data.data?.errorMessage;

      if (isComplete) {
        // Try multiple possible URL locations - check response.resultUrls first (like Flux)
        const videoUrl = data.data?.response?.resultUrls?.[0] ||
          data.data?.info?.resultUrls?.[0] ||
          data.data?.resultUrls?.[0] ||
          data.data?.resultVideoUrl ||
          data.data?.videoUrl ||
          data.data?.video_url ||
          data.data?.url ||
          data.data?.output ||
          data.resultUrls?.[0] ||
          data.videoUrl ||
          data.url;
        if (videoUrl) {
          console.log('✅ Veo3 video generation completed:', videoUrl);
          return videoUrl;
        } else {
          console.log('⚠️ Status is complete but no video URL found:', JSON.stringify(data));
        }
      } else if (isFailed) {
        throw new Error(data.data?.errorMessage || data.data?.error || data.error || data.data?.message || data.message || 'Video generation failed');
      } else {
        console.log(`⏳ Veo3 video status: successFlag=${successFlag}, status=${status}, waiting...`);
      }
    } catch (error: any) {
      console.error(`❌ Video polling error attempt ${attempt + 1}:`, error.message);
      if (attempt === maxAttempts - 1) throw error;
    }
  }

  throw new Error('Video generation timeout after ' + maxAttempts + ' attempts');
}

async function generateRunwayVideo(prompt: string): Promise<string> {
  const response = await fetch(`${KIE_BASE_URL}/api/v1/runway/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIE_API_KEY}`
    },
    body: JSON.stringify({
      prompt: prompt,
      duration: 5,
      quality: '720p',
      aspectRatio: '16:9',
      waterMark: ''
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ msg: 'Unknown error' }));
    throw new Error(errorData.msg || `Runway video generation failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.code === 200 && data.data?.taskId) {
    return await pollRunwayVideoStatus(data.data.taskId);
  }

  throw new Error('No task ID in response');
}

async function pollRunwayVideoStatus(taskId: string, maxAttempts: number = 120): Promise<string> {
  console.log('⏳ Polling Runway video status:', taskId);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      // KIE AI uses /record-detail endpoint with taskId as query param (NOT record-info)
      const response = await fetch(`${KIE_BASE_URL}/api/v1/runway/record-detail?taskId=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`
        }
      });

      if (!response.ok) {
        console.log(`⚠️ Runway polling attempt ${attempt + 1}: response not ok (${response.status})`);
        continue;
      }

      const data = await response.json();
      console.log(`📊 Runway polling attempt ${attempt + 1}:`, JSON.stringify(data).substring(0, 500));

      // API docs: status can be 'wait', 'queueing', 'generating', 'success', 'fail'
      const status = data.data?.status ?? data.status;
      const statusStr = String(status).toLowerCase();
      const isComplete = statusStr === 'success' || statusStr === 'completed';
      const isFailed = statusStr === 'fail' || statusStr === 'failed' || statusStr === 'error';

      if (data.code === 200 && isComplete) {
        // API docs: video URL in data.videoUrl, cover image in data.imageUrl
        const videoUrl = data.data?.videoUrl ||
          data.data?.video_url ||
          data.data?.info?.resultUrls?.[0] ||
          data.data?.resultUrls?.[0];
        if (videoUrl) {
          console.log('✅ Runway video completed:', videoUrl);
          return videoUrl;
        } else {
          console.log('⚠️ Status is complete but no video URL found:', JSON.stringify(data));
        }
      } else if (isFailed) {
        throw new Error(data.msg || data.data?.error || 'Runway video generation failed');
      } else {
        console.log(`⏳ Runway status: ${status}, waiting...`);
      }
    } catch (error: any) {
      console.error(`❌ Runway polling error:`, error.message);
      if (attempt === maxAttempts - 1) throw error;
    }
  }

  throw new Error('Runway video generation timeout');
}

async function generateSoraVideo(prompt: string, model: string): Promise<string> {
  console.log(`🎬 Generating Sora 2 video using jobs/createTask...`);
  const response = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KIE_API_KEY}` },
    body: JSON.stringify({
      model: 'sora-2-text-to-video',
      input: {
        prompt: prompt,
        aspect_ratio: 'landscape',
        n_frames: '10',
        remove_watermark: true
      }
    })
  });

  if (!response.ok) throw new Error(`Sora 2 video generation failed: ${response.status}`);
  const data = await response.json();

  if ((data.code === 200 || data.success) && data.data?.taskId) {
    return await pollJobsVideoStatus(data.data.taskId);
  }
  throw new Error('No task ID in response');
}

async function generateWanVideo(prompt: string, model: string): Promise<string> {
  console.log(`🎬 Generating Wan 2.5 video using jobs/createTask...`);
  const response = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KIE_API_KEY}` },
    body: JSON.stringify({
      model: 'wan/2-5-text-to-video',
      input: {
        prompt: prompt,
        duration: '5',
        aspect_ratio: '16:9',
        resolution: '1080p',
        enable_prompt_expansion: true
      }
    })
  });

  if (!response.ok) throw new Error(`Wan 2.5 video generation failed: ${response.status}`);
  const data = await response.json();

  if ((data.code === 200 || data.success) && data.data?.taskId) {
    return await pollJobsVideoStatus(data.data.taskId);
  }
  throw new Error('No task ID in response');
}

async function generateKlingVideo(prompt: string, model: string): Promise<string> {
  console.log(`🎬 Generating Kling 2.6 video using jobs/createTask...`);
  const response = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KIE_API_KEY}` },
    body: JSON.stringify({
      model: 'kling-2.6/text-to-video',
      input: {
        prompt: prompt,
        sound: false,
        aspect_ratio: '16:9',
        duration: '5'
      }
    })
  });

  if (!response.ok) throw new Error(`Kling 2.6 video generation failed: ${response.status}`);
  const data = await response.json();

  if ((data.code === 200 || data.success) && data.data?.taskId) {
    return await pollJobsVideoStatus(data.data.taskId);
  }
  throw new Error('No task ID in response');
}

async function generateGrokVideo(prompt: string, model: string): Promise<string> {
  console.log(`🎬 Generating Grok video using jobs/createTask...`);
  const response = await fetch(`${KIE_BASE_URL}/api/v1/jobs/createTask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${KIE_API_KEY}` },
    body: JSON.stringify({
      model: 'grok-imagine/text-to-video',
      input: {
        prompt: prompt,
        aspect_ratio: '3:2',
        mode: 'normal'
      }
    })
  });

  if (!response.ok) throw new Error(`Grok video generation failed: ${response.status}`);
  const data = await response.json();

  if ((data.code === 200 || data.success) && data.data?.taskId) {
    return await pollJobsVideoStatus(data.data.taskId);
  }
  throw new Error('No task ID in response');
}

// Poll for jobs/createTask based video generation (Sora 2, Wan 2.5, Kling 2.6, Grok Video)
async function pollJobsVideoStatus(taskId: string, maxAttempts: number = 120): Promise<string> {
  console.log(`⏳ Polling jobs video task status:`, taskId);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    try {
      const response = await fetch(`${KIE_BASE_URL}/api/v1/jobs/recordInfo?taskId=${taskId}`, {
        headers: { 'Authorization': `Bearer ${KIE_API_KEY}` }
      });
      if (!response.ok) continue;

      const data = await response.json();
      console.log(`📊 Jobs video polling attempt ${attempt + 1}:`, JSON.stringify(data));

      // Check for successFlag (like Flux) or state/status field
      const successFlag = data.data?.successFlag;
      const state = data.data?.state ?? data.data?.status ?? data.state ?? data.status;
      const stateStr = String(state).toUpperCase();
      const hasVideoUrl = data.data?.response?.resultUrls?.[0] || data.data?.resultJson;

      console.log(`🔍 Jobs video status check: successFlag=${successFlag}, state=${state}, hasVideoUrl=${!!hasVideoUrl}`);

      // Check for success - use successFlag first, then state patterns
      const isComplete = successFlag === 1 || successFlag === '1' ||
        stateStr === 'SUCCESS' || stateStr === 'COMPLETED' || stateStr === 'DONE' ||
        hasVideoUrl;
      const isFailed = successFlag === 2 || successFlag === 3 ||
        stateStr.includes('FAIL') || stateStr.includes('ERROR') ||
        data.data?.errorCode || data.data?.errorMessage;

      if (isComplete) {
        // Try response.resultUrls first (like Flux pattern)
        let videoUrl = data.data?.response?.resultUrls?.[0] ||
          data.data?.response?.resultWaterMarkUrls?.[0] ||
          data.data?.response?.videoUrl;

        // Try to get URL from resultJson if no direct URL
        if (!videoUrl) {
          const resultJson = data.data?.resultJson;
          if (resultJson) {
            try {
              const result = typeof resultJson === 'string' ? JSON.parse(resultJson) : resultJson;
              videoUrl = result.resultUrls?.[0] || result.resultWaterMarkUrls?.[0] || result.videoUrl || result.video_url || result.url || result.output;
            } catch (e) {
              console.error('Failed to parse resultJson:', e);
            }
          }
        }

        // Try direct URL access as fallback
        if (!videoUrl) {
          videoUrl = data.data?.resultUrls?.[0] || data.data?.videoUrl || data.data?.url;
        }

        if (videoUrl) {
          console.log('✅ Jobs video generation completed:', videoUrl);
          return videoUrl;
        }

        console.log('⚠️ Jobs video status complete but no URL found:', JSON.stringify(data));
      } else if (isFailed) {
        throw new Error(data.data?.errorMessage || data.data?.failMsg || data.data?.error || 'Video generation failed');
      } else {
        console.log(`⏳ Jobs video status: successFlag=${successFlag}, state=${state}, waiting...`);
      }
    } catch (e: any) {
      console.error(`❌ Jobs video polling error:`, e.message);
      if (attempt === maxAttempts - 1) throw e;
    }
  }
  throw new Error('Jobs video generation timeout');
}

export async function generateKieMusic(
  prompt: string,
  customMode: boolean = false,
  style?: string,
  title?: string,
  instrumental: boolean = false
): Promise<string> {
  console.log('🎵 Generating music with Kie AI (Suno):', { prompt, customMode, style, title });

  if (!KIE_API_KEY) {
    throw new Error('Kie AI API Key is missing. Please add VITE_KIE_API_KEY to your .env file.');
  }

  try {
    const body: any = {
      prompt: prompt,
      customMode: customMode,
      instrumental: instrumental,
      model: 'V5',
      // callBackUrl is required by the API even for polling
      callBackUrl: 'https://kroniqai.com/api/webhook/suno',
      wait_audio: false // Set to false, we'll poll for status
    };

    if (customMode) {
      if (style) body.style = style;
      if (title) body.title = title;
    }

    const response = await fetch(`${KIE_BASE_URL}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIE_API_KEY}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ msg: 'Unknown error' }));
      console.error('❌ Suno music generation failed:', response.status, errorData);
      throw new Error(errorData.msg || `Music generation failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Suno music task created:', data);

    // Try different response structures
    const taskId = data.data?.taskId || data.taskId || data.id || data.task_id || data.data?.id;
    if ((data.code === 200 || data.success) && taskId) {
      return await pollSunoMusicStatus(taskId);
    }

    // If no task ID found, check if the response contains a direct URL
    if (data.data?.audioUrl || data.audioUrl || data.url) {
      const audioUrl = data.data?.audioUrl || data.audioUrl || data.url;
      console.log('✅ Direct audio URL received:', audioUrl);
      return audioUrl;
    }

    console.error('❌ Unexpected response structure:', data);
    throw new Error('No task ID or audio URL in response');
  } catch (error) {
    console.error('❌ Kie AI music generation error:', error);
    throw error;
  }
}

async function pollSunoMusicStatus(taskId: string, maxAttempts: number = 120): Promise<string> {
  console.log('⏳ Polling Suno music status:', taskId);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      // KIE AI uses /record-info logic - check Suno specific endpoint if needed
      // Assuming generic record-info works or /api/v1/suno/record-info
      const response = await fetch(`${KIE_BASE_URL}/api/v1/generate/record-info?taskId=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`
        }
      });

      if (!response.ok) {
        console.log(`⚠️ Suno polling attempt ${attempt + 1}: response not ok`);
        continue;
      }

      const data = await response.json();
      console.log(`📊 Suno polling attempt ${attempt + 1}:`, JSON.stringify(data).substring(0, 500));

      // Check for successFlag (like Flux pattern) or status field
      const successFlag = data.data?.successFlag;
      const status = data.data?.status ?? data.status;
      const statusStr = String(status).toUpperCase();
      const hasAudioUrl = data.data?.response?.audioUrls?.[0] || data.data?.audioUrls?.[0];

      console.log(`🔍 Suno status check: successFlag=${successFlag}, status=${status}, hasAudioUrl=${!!hasAudioUrl}`);

      // Check for completion - use successFlag first, then status patterns
      const isComplete = successFlag === 1 || successFlag === '1' ||
        status === 1 ||
        statusStr === 'COMPLETE' || statusStr === 'SUCCESS' || statusStr === 'COMPLETED' ||
        hasAudioUrl;
      const isFailed = successFlag === 2 || successFlag === 3 ||
        status === 2 || status === 3 ||
        statusStr === 'FAILED' || statusStr === 'ERROR' ||
        data.data?.errorCode || data.data?.errorMessage;

      if (isComplete) {
        // Suno returns audio in response.sunoData[0].audioUrl
        const sunoData = data.data?.response?.sunoData;
        const audioUrl = sunoData?.[0]?.audioUrl ||
          sunoData?.[0]?.sourceAudioUrl ||
          data.data?.response?.audioUrls?.[0] ||
          data.data?.response?.audioUrl ||
          data.data?.audioUrls?.[0] ||
          data.data?.audioUrl ||
          data.data?.audio_url ||
          data.audioUrl ||
          data.audio_url ||
          data.url;
        if (audioUrl) {
          console.log('✅ Suno music generation completed:', audioUrl);
          return audioUrl;
        } else {
          console.log('⚠️ Status is complete but no audio URL found:', JSON.stringify(data));
        }
      } else if (isFailed) {
        throw new Error(data.data?.errorMessage || data.data?.error || data.error || 'Music generation failed');
      } else {
        console.log(`⏳ Suno status: successFlag=${successFlag}, status=${status}, waiting...`);
      }
    } catch (error: any) {
      console.error(`❌ Suno polling error:`, error.message);
      if (attempt === maxAttempts - 1) throw error;
    }
  }

  throw new Error('Music generation timeout');
}

export const KIE_MODELS = {
  image: [
    { id: 'flux-pro', name: 'Flux Pro', description: 'High-quality image generation via Kie AI' },
    { id: 'flux-dev', name: 'Flux Dev', description: 'Fast image generation via Kie AI' },
    { id: 'flux-max', name: 'Flux Max', description: 'Maximum quality via Kie AI' },
    { id: '4o-image', name: 'GPT-4o Image', description: 'OpenAI GPT-4o image generation' },
    { id: 'google/nano-banana', name: 'Nano Banana', description: 'Efficient image generation' },
    { id: 'google/imagen4-ultra', name: 'Imagen 4 Ultra', description: 'Ultra-realistic images' },
    { id: 'seedream/4.5-text-to-image', name: 'Seedream 4.5', description: 'Artistic generation' },
    { id: 'grok-imagine/text-to-image', name: 'Grok Imagine', description: 'Grok image generation' },
    { id: 'sdxl', name: 'Stable Diffusion XL', description: 'Popular open-source model' }
  ],
  video: [
    { id: 'veo3_fast', name: 'Veo 3.1 Fast', description: 'Google Veo 3.1 fast generation' },
    { id: 'veo3', name: 'Veo 3.1 Quality', description: 'High quality video' },
    { id: 'sora-2-text-to-video', name: 'Sora 2', description: 'Cinematic video generation' },
    { id: 'wan/2-5-text-to-video', name: 'Wan 2.5', description: 'Creative video generation' },
    { id: 'kling-2.6/text-to-video', name: 'Kling 2.6', description: 'Realistic video generation' },
    { id: 'grok-imagine/text-to-video', name: 'Grok Video', description: 'Grok video generation' },
    { id: 'runway-gen3', name: 'Runway Gen-3', description: 'Professional video generation' }
  ],
  music: [
    { id: 'suno-v5', name: 'Suno V5', description: 'Latest Suno music model' }
  ]
};
