/**
 * Voiceover Service - Handles ElevenLabs text-to-speech generation
 */

import { addDebugLog } from '../components/Debug/DebugPanel';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface VoiceoverRequest {
  text: string;
  voiceId?: string;
}

export const generateVoiceover = async (request: VoiceoverRequest): Promise<Blob> => {
  addDebugLog('info', '🎤 Starting voiceover generation...');
  console.log('🎤 Generating voiceover:', { textLength: request.text.length });

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-voiceover`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: request.text,
        voiceId: request.voiceId || '21m00Tcm4TlvDq8ikWAM'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      addDebugLog('warning', 'Edge function failed, trying direct API...');
      console.log('⚠️ Edge function failed, falling back to direct API');

      const { generateVoiceWithElevenLabs } = await import('./directAPIService');
      return await generateVoiceWithElevenLabs(request);
    }

    const audioBlob = await response.blob();
    addDebugLog('success', `✅ Audio generated: ${audioBlob.size} bytes`);
    return audioBlob;
  } catch (error: any) {
    console.error('Voiceover generation error:', error);
    addDebugLog('warning', 'Edge function error, trying direct API...');

    try {
      const { generateVoiceWithElevenLabs } = await import('./directAPIService');
      return await generateVoiceWithElevenLabs(request);
    } catch (directError: any) {
      addDebugLog('error', `Both methods failed: ${directError.message}`);
      throw new Error(`Failed to generate voiceover: ${directError.message}`);
    }
  }
};
