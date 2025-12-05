/**
 * Content Save Service
 * Saves all types of generated content (images, videos, music, etc.) to projects in Supabase
 */

import { createProject, createMessage } from './dataService';
import { auth } from './firebase';

export type ContentType = 'image' | 'video' | 'music' | 'voice' | 'ppt' | 'code';

const getCurrentUserId = (): string => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.uid;
};

/**
 * Save generated image to project
 */
export async function saveImageToProject(
  userId: string,
  prompt: string,
  imageUrl: string,
  metadata?: {
    model?: string;
    dimensions?: string;
    provider?: string;
  }
): Promise<string> {
  try {
    console.log('💾 Saving image to project...');

    const project = await createProject(
      `Image: ${prompt.substring(0, 40)}...`,
      'image',
      prompt,
      metadata?.model || 'flux-schnell'
    );

    await createMessage(project.id, 'user', prompt, { type: 'image_request' });

    const imageMessage = `I've generated your image!\n\n![Generated Image](${imageUrl})\n\n**Model:** ${metadata?.model || 'Unknown'}\n**Provider:** ${metadata?.provider || 'Unknown'}`;
    await createMessage(project.id, 'assistant', imageMessage, {
      type: 'image',
      url: imageUrl,
      model: metadata?.model,
      dimensions: metadata?.dimensions,
      provider: metadata?.provider
    });

    console.log('✅ Image saved to project:', project.id);
    return project.id;
  } catch (error) {
    console.error('❌ Error saving image to project:', error);
    throw error;
  }
}

/**
 * Save generated video to project
 */
export async function saveVideoToProject(
  userId: string,
  prompt: string,
  videoUrl: string,
  metadata?: {
    model?: string;
    duration?: number;
    provider?: string;
  }
): Promise<string> {
  try {
    console.log('💾 Saving video to project...');

    const project = await createProject(
      `Video: ${prompt.substring(0, 40)}...`,
      'video',
      prompt,
      metadata?.model || 'unknown'
    );

    await createMessage(project.id, 'user', prompt, { type: 'video_request' });

    const videoMessage = `I've generated your video!\n\n🎬 **Video Ready**\n\n[View Video](${videoUrl})\n\n**Model:** ${metadata?.model || 'Unknown'}\n**Duration:** ${metadata?.duration || '?'}s\n**Provider:** ${metadata?.provider || 'Unknown'}`;
    await createMessage(project.id, 'assistant', videoMessage, {
      type: 'video',
      url: videoUrl,
      model: metadata?.model,
      duration: metadata?.duration,
      provider: metadata?.provider
    });

    console.log('✅ Video saved to project:', project.id);
    return project.id;
  } catch (error) {
    console.error('❌ Error saving video to project:', error);
    throw error;
  }
}

/**
 * Save generated music to project
 */
export async function saveMusicToProject(
  userId: string,
  prompt: string,
  audioUrl: string,
  metadata?: {
    model?: string;
    duration?: number;
    title?: string;
  }
): Promise<string> {
  try {
    console.log('💾 Saving music to project...');

    const project = await createProject(
      `Music: ${metadata?.title || prompt.substring(0, 40)}...`,
      'music',
      prompt,
      metadata?.model || 'suno'
    );

    await createMessage(project.id, 'user', prompt, { type: 'music_request' });

    const musicMessage = `I've generated your music!\n\n🎵 **${metadata?.title || 'Music Track'}**\n\n[Listen Now](${audioUrl})\n\n**Model:** ${metadata?.model || 'Suno'}`;
    await createMessage(project.id, 'assistant', musicMessage, {
      type: 'music',
      url: audioUrl,
      model: metadata?.model,
      duration: metadata?.duration,
      title: metadata?.title
    });

    console.log('✅ Music saved to project:', project.id);
    return project.id;
  } catch (error) {
    console.error('❌ Error saving music to project:', error);
    throw error;
  }
}

/**
 * Save generated voiceover to project
 */
export async function saveVoiceoverToProject(
  userId: string,
  text: string,
  audioUrl: string,
  metadata?: {
    voice?: string;
    duration?: number;
  }
): Promise<string> {
  try {
    console.log('💾 Saving voiceover to project...');

    const project = await createProject(
      `Voiceover: ${text.substring(0, 40)}...`,
      'voice',
      text,
      'elevenlabs'
    );

    await createMessage(project.id, 'user', `Generate voiceover: ${text}`, { type: 'voiceover_request' });

    const voiceMessage = `I've generated your voiceover!\n\n🎙️ **Voiceover Ready**\n\n[Listen Now](${audioUrl})\n\n**Voice:** ${metadata?.voice || 'Default'}`;
    await createMessage(project.id, 'assistant', voiceMessage, {
      type: 'voiceover',
      url: audioUrl,
      voice: metadata?.voice,
      duration: metadata?.duration
    });

    console.log('✅ Voiceover saved to project:', project.id);
    return project.id;
  } catch (error) {
    console.error('❌ Error saving voiceover to project:', error);
    throw error;
  }
}

/**
 * Save generated PPT to project
 */
export async function savePPTToProject(
  userId: string,
  prompt: string,
  pptData: any,
  metadata?: {
    slideCount?: number;
    theme?: string;
  }
): Promise<string> {
  try {
    console.log('💾 Saving PPT to project...');

    const project = await createProject(
      `Presentation: ${prompt.substring(0, 40)}...`,
      'ppt',
      prompt,
      'presentation'
    );

    await createMessage(project.id, 'user', prompt, { type: 'ppt_request' });

    const pptMessage = `I've generated your presentation!\n\n📊 **Presentation Ready**\n\n**Slides:** ${metadata?.slideCount || 0}\n**Theme:** ${metadata?.theme || 'Default'}`;
    await createMessage(project.id, 'assistant', pptMessage, {
      type: 'ppt',
      data: pptData,
      slideCount: metadata?.slideCount,
      theme: metadata?.theme
    });

    console.log('✅ PPT saved to project:', project.id);
    return project.id;
  } catch (error) {
    console.error('❌ Error saving PPT to project:', error);
    throw error;
  }
}

/**
 * Save generated code to project
 */
export async function saveCodeToProject(
  userId: string,
  prompt: string,
  code: string,
  metadata?: {
    language?: string;
    framework?: string;
  }
): Promise<string> {
  try {
    console.log('💾 Saving code to project...');

    const project = await createProject(
      `Code: ${prompt.substring(0, 40)}...`,
      'code',
      prompt,
      'gpt-4'
    );

    await createMessage(project.id, 'user', prompt, { type: 'code_request' });

    const codeMessage = `I've generated your code!\n\n\`\`\`${metadata?.language || 'javascript'}\n${code}\n\`\`\`\n\n**Language:** ${metadata?.language || 'JavaScript'}\n**Framework:** ${metadata?.framework || 'None'}`;
    await createMessage(project.id, 'assistant', codeMessage, {
      type: 'code',
      code,
      language: metadata?.language,
      framework: metadata?.framework
    });

    console.log('✅ Code saved to project:', project.id);
    return project.id;
  } catch (error) {
    console.error('❌ Error saving code to project:', error);
    throw error;
  }
}
