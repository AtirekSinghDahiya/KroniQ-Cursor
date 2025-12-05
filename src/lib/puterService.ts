/**
 * Puter.js Free AI Image Generation Service
 * Provides access to free models: Imagen 4, Nano Banana, FLUX, Stable Diffusion
 */

declare global {
  interface Window {
    puter: any;
  }
}

interface PuterImageOptions {
  model?: string;
  provider?: string;
  disable_safety_checker?: boolean;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  negative_prompt?: string;
  image_url?: string;
  input_image?: string;
  input_image_mime_type?: string;
}

const MODEL_MAP: Record<string, { model: string; provider?: string }> = {
  // Google Imagen 4 models
  'imagen-4': { model: 'google/imagen-4.0-preview', provider: 'together-ai' },
  'imagen-4-fast': { model: 'google/imagen-4.0-fast', provider: 'together-ai' },
  'imagen-4-ultra': { model: 'google/imagen-4.0-ultra', provider: 'together-ai' },

  // Nano Banana (Gemini) models
  'nano-banana-pro': { model: 'google/gemini-3-pro-image', provider: 'together-ai' },
  'nano-banana': { model: 'gemini-2.5-flash-image-preview' },

  // FLUX models
  'flux-kontext': { model: 'black-forest-labs/FLUX.1-kontext-pro' },
  'flux-1.1-pro': { model: 'black-forest-labs/FLUX.1.1-pro' },
  'flux-schnell': { model: 'black-forest-labs/FLUX.1-schnell' },
  'flux-2-pro': { model: 'black-forest-labs/FLUX.2-pro' },
  'flux-2-dev': { model: 'black-forest-labs/FLUX.2-dev' },

  // Stable Diffusion models
  'stable-diffusion-3': { model: 'stabilityai/stable-diffusion-3-medium' },
  'sdxl': { model: 'stabilityai/stable-diffusion-xl-base-1.0' }
};

/**
 * Check if Puter.js is loaded
 */
function isPuterLoaded(): boolean {
  return typeof window !== 'undefined' && window.puter && window.puter.ai;
}

/**
 * Load Puter.js script dynamically
 */
async function loadPuterScript(): Promise<void> {
  if (isPuterLoaded()) return;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://js.puter.com/v2/';
    script.async = true;
    script.onload = () => {
      console.log('✅ Puter.js loaded successfully');
      resolve();
    };
    script.onerror = () => {
      reject(new Error('Failed to load Puter.js'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Generate image using Puter.js free models
 */
export async function generateImageWithPuter(
  prompt: string,
  modelId: string,
  options: PuterImageOptions = {}
): Promise<{ url: string; blob?: Blob }> {
  try {
    console.log('🎨 Generating image with Puter.js:', { modelId, prompt: prompt.substring(0, 50) });

    // Load Puter.js if not already loaded
    await loadPuterScript();

    if (!isPuterLoaded()) {
      throw new Error('Puter.js failed to load');
    }

    // Get model configuration
    const modelConfig = MODEL_MAP[modelId];
    if (!modelConfig) {
      throw new Error(`Unknown model: ${modelId}`);
    }

    // Prepare options
    const puterOptions: PuterImageOptions = {
      model: modelConfig.model,
      disable_safety_checker: true,
      ...options
    };

    // Add provider if specified
    if (modelConfig.provider) {
      puterOptions.provider = modelConfig.provider;
    }

    console.log('📤 Puter.js request:', puterOptions);

    // Generate image
    const imageElement: HTMLImageElement = await window.puter.ai.txt2img(prompt, puterOptions);

    if (!imageElement || !imageElement.src) {
      throw new Error('No image generated');
    }

    console.log('✅ Image generated successfully');

    // Convert to blob if needed
    let blob: Blob | undefined;
    if (imageElement.src.startsWith('data:')) {
      const response = await fetch(imageElement.src);
      blob = await response.blob();
    }

    return {
      url: imageElement.src,
      blob
    };

  } catch (error: any) {
    console.error('❌ Puter.js generation error:', error);
    throw new Error(error.message || 'Failed to generate image with Puter.js');
  }
}

/**
 * Generate image with image-to-image editing (for Flux Kontext)
 */
export async function generateImageToImageWithPuter(
  prompt: string,
  imageUrl: string,
  modelId: string = 'flux-kontext'
): Promise<{ url: string; blob?: Blob }> {
  return generateImageWithPuter(prompt, modelId, {
    image_url: imageUrl
  });
}

/**
 * Check if model is a Puter.js model
 */
export function isPuterModel(modelId: string): boolean {
  return modelId in MODEL_MAP;
}

/**
 * Get list of available Puter.js models
 */
export function getAvailablePuterModels(): string[] {
  return Object.keys(MODEL_MAP);
}
