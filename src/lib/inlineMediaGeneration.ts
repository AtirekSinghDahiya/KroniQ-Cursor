import { generateNanoBananaImage } from './nanoBananaService';
import { generateVeo3VideoNew } from './veo3ServiceNew';
import { generateSunoMusic } from './sunoMusicService';

export interface MediaGenerationProgress {
  status: string;
  progress: number;
}

export interface GeneratedMedia {
  type: 'image' | 'video' | 'audio';
  url: string;
  prompt: string;
  metadata?: any;
}

export async function generateImageInline(
  prompt: string,
  onProgress?: (update: MediaGenerationProgress) => void
): Promise<GeneratedMedia> {
  try {
    if (onProgress) {
      onProgress({ status: 'Starting image generation...', progress: 10 });
    }

    const imageUrls = await generateNanoBananaImage(
      {
        prompt: prompt,
        aspect_ratio: '1:1',
        num_images: 1,
        output_format: 'jpeg'
      },
      (status, progress) => {
        if (onProgress) {
          onProgress({ status, progress });
        }
      }
    );

    if (onProgress) {
      onProgress({ status: 'Image ready!', progress: 100 });
    }

    return {
      type: 'image',
      url: imageUrls[0],
      prompt: prompt,
      metadata: {
        model: 'nano-banana',
        timestamp: new Date(),
        provider: 'fal-ai'
      }
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to generate image');
  }
}

export async function generateVideoInline(
  prompt: string,
  onProgress?: (update: MediaGenerationProgress) => void
): Promise<GeneratedMedia> {
  try {
    if (onProgress) {
      onProgress({ status: 'Starting video generation...', progress: 10 });
    }

    const videoUrl = await generateVeo3VideoNew(
      {
        prompt: prompt,
        duration: '8s',
        aspect_ratio: '16:9'
      },
      (status, progress) => {
        if (onProgress) {
          onProgress({ status, progress });
        }
      }
    );

    if (onProgress) {
      onProgress({ status: 'Video ready!', progress: 100 });
    }

    return {
      type: 'video',
      url: videoUrl,
      prompt: prompt,
      metadata: {
        model: 'veo-3-fast',
        duration: '8s',
        timestamp: new Date(),
        provider: 'fal-ai'
      }
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to generate video');
  }
}

export async function generateMusicInline(
  prompt: string,
  onProgress?: (update: MediaGenerationProgress) => void
): Promise<GeneratedMedia> {
  try {
    if (onProgress) {
      onProgress({ status: 'Starting music generation...', progress: 10 });
    }

    const result = await generateSunoMusic(prompt);

    if (onProgress) {
      onProgress({ status: 'Music ready!', progress: 100 });
    }

    return {
      type: 'audio',
      url: result.audioUrl,
      prompt: prompt,
      metadata: {
        model: 'suno-v3',
        title: result.title,
        timestamp: new Date(),
        provider: 'suno'
      }
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to generate music');
  }
}
