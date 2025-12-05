const KIE_API_KEY = 'c2fc73165de059fdcd158e418571b3d2';
const KIE_BASE_URL = 'https://api.kie.ai';

export async function generateKieImage(prompt: string, model: string = 'flux-pro'): Promise<string> {
  console.log('🎨 Generating image with Kie AI:', { prompt, model });

  try {
    if (model === '4o-image' || model === 'gpt-image-1') {
      return await generateGPT4oImage(prompt);
    }

    return await generateFluxImage(prompt, model);
  } catch (error) {
    console.error('❌ Kie AI image generation error:', error);
    throw error;
  }
}

async function generateFluxImage(prompt: string, model: string): Promise<string> {
  const modelMap: { [key: string]: string } = {
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
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const response = await fetch(`${KIE_BASE_URL}/api/v1/flux/kontext/fetch/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`
        }
      });

      if (!response.ok) continue;

      const data = await response.json();

      if (data.code === 200 && data.data?.status === 'completed') {
        const imageUrl = data.data.imageUrls?.[0] || data.data.imageUrl;
        if (imageUrl) {
          console.log('✅ Flux image generation completed');
          return imageUrl;
        }
      } else if (data.data?.status === 'failed') {
        throw new Error('Image generation failed');
      }
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;
    }
  }

  throw new Error('Image generation timeout');
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
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const response = await fetch(`${KIE_BASE_URL}/api/v1/gpt4o-image/fetch/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`
        }
      });

      if (!response.ok) continue;

      const data = await response.json();

      if (data.code === 200 && data.data?.status === 'completed') {
        const imageUrl = data.data.imageUrls?.[0] || data.data.imageUrl;
        if (imageUrl) return imageUrl;
      } else if (data.data?.status === 'failed') {
        throw new Error('GPT-4o image generation failed');
      }
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;
    }
  }

  throw new Error('GPT-4o image generation timeout');
}

export async function generateKieVideo(prompt: string, model: string = 'veo3_fast'): Promise<string> {
  console.log('🎬 Generating video with Kie AI:', { prompt, model });

  try {
    if (model === 'runway-gen3' || model === 'runway') {
      return await generateRunwayVideo(prompt);
    }

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
      const response = await fetch(`${KIE_BASE_URL}/api/v1/veo/fetch/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`
        }
      });

      if (!response.ok) continue;

      const data = await response.json();

      if (data.code === 200 && data.data?.status === 'completed') {
        const videoUrl = data.data.videoUrl || data.data.video_url;
        if (videoUrl) {
          console.log('✅ Veo 3 video generation completed');
          return videoUrl;
        }
      } else if (data.data?.status === 'failed') {
        throw new Error(data.data.error || 'Video generation failed');
      }
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;
    }
  }

  throw new Error('Video generation timeout');
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
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      const response = await fetch(`${KIE_BASE_URL}/api/v1/runway/fetch/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`
        }
      });

      if (!response.ok) continue;

      const data = await response.json();

      if (data.code === 200 && data.data?.status === 'completed') {
        const videoUrl = data.data.videoUrl || data.data.video_url;
        if (videoUrl) return videoUrl;
      } else if (data.data?.status === 'failed') {
        throw new Error('Runway video generation failed');
      }
    } catch (error) {
      if (attempt === maxAttempts - 1) throw error;
    }
  }

  throw new Error('Runway video generation timeout');
}

export async function generateKieMusic(
  prompt: string,
  customMode: boolean = false,
  style?: string,
  title?: string,
  instrumental: boolean = false
): Promise<string> {
  console.log('🎵 Generating music with Kie AI (Suno):', { prompt, customMode, style, title });

  try {
    const body: any = {
      prompt: prompt,
      customMode: customMode,
      instrumental: instrumental,
      model: 'V5'
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

    if (data.code === 200 && data.data?.taskId) {
      return await pollSunoMusicStatus(data.data.taskId);
    }

    throw new Error('No task ID in response');
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
      const response = await fetch(`${KIE_BASE_URL}/api/v1/fetch/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${KIE_API_KEY}`
        }
      });

      if (!response.ok) continue;

      const data = await response.json();

      if (data.code === 200 && data.data?.status === 'complete') {
        const audioUrl = data.data.audioUrls?.[0] || data.data.audioUrl || data.data.audio_url;
        if (audioUrl) {
          console.log('✅ Suno music generation completed');
          return audioUrl;
        }
      } else if (data.data?.status === 'failed') {
        throw new Error(data.data.error || 'Music generation failed');
      }
    } catch (error) {
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
    { id: '4o-image', name: 'GPT-4o Image', description: 'OpenAI GPT-4o image generation' }
  ],
  video: [
    { id: 'veo3_fast', name: 'Veo 3.1 Fast', description: 'Google Veo 3.1 fast generation' },
    { id: 'runway-gen3', name: 'Runway Gen-3', description: 'Professional video generation' }
  ],
  music: [
    { id: 'suno-v5', name: 'Suno V5', description: 'Latest Suno music model' }
  ]
};
