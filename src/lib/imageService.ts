/**
 * Image Generation Service
 * Uses Kie AI for high-quality image generation
 */

import { generateKieImage, KIE_MODELS } from './kieAIService';

export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidanceScale?: number;
  model?: string;
}

export interface GeneratedImage {
  url: string;
  seed: number;
  prompt: string;
  timestamp: Date;
}

/**
 * Generate image using Kie AI
 */
export async function generateImage(options: ImageGenerationOptions): Promise<GeneratedImage> {
  const {
    prompt,
    model = 'flux-kontext'
  } = options;

  console.log('🎨 Generating image with Kie AI:', { model, prompt: prompt.substring(0, 50) });

  try {
    const imageUrl = await generateKieImage(prompt, model);
    const seed = Date.now();

    console.log('✅ Image generated successfully');

    return {
      url: imageUrl,
      seed: seed,
      prompt: prompt,
      timestamp: new Date(),
    };

  } catch (error: any) {
    console.error('❌ Image generation error:', error);
    throw new Error(error.message || 'Failed to generate image');
  }
}

/**
 * Check if image generation is available
 */
export function isImageGenerationAvailable(): boolean {
  return true;
}

/**
 * Smart image generation using Kie AI
 */
export async function generateImageSmart(
  prompt: string,
  selectedModel?: string
): Promise<GeneratedImage> {
  const model = selectedModel || 'flux-pro';
  console.log(`🎨 Generating image with Kie AI model: ${model}`);

  try {
    return await generateImage({ prompt, model });
  } catch (error: any) {
    console.error(`❌ Image generation failed:`, error);
    throw error;
  }
}

/**
 * Generate image using Kie AI (default method)
 */
export async function generateImageFree(prompt: string, model: string = 'flux-pro'): Promise<GeneratedImage> {
  console.log('🎨 Generating image with Kie AI:', prompt);

  try {
    return await generateImage({ prompt, model });
  } catch (error: any) {
    console.error('❌ Image generation failed:', error);
    throw error;
  }
}

/**
 * Get available image models from Kie AI
 */
export function getAvailableImageModels() {
  return KIE_MODELS.image;
}
