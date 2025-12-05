const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const SAFETY_MODEL = 'openai/gpt-oss-safeguard-20b';

export interface ModerationResult {
  isSafe: boolean;
  categories?: string[];
  confidence?: number;
  rawResponse?: any;
}

export async function moderateContent(content: string): Promise<ModerationResult> {
  if (!content || content.trim().length === 0) {
    return { isSafe: true };
  }

  try {
    console.log('🛡️ [MODERATION] Checking content safety...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'KroniQ AI Platform',
      },
      body: JSON.stringify({
        model: SAFETY_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a content safety classifier. Analyze the following text and respond with ONLY "SAFE" or "UNSAFE" followed by a brief reason if unsafe.'
          },
          {
            role: 'user',
            content: content
          }
        ],
        max_tokens: 100,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.warn('⚠️ [MODERATION] API error, defaulting to safe');
      return { isSafe: true };
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || 'SAFE';
    const isSafe = result.toUpperCase().includes('SAFE') && !result.toUpperCase().includes('UNSAFE');

    console.log('🛡️ [MODERATION] Result:', isSafe ? '✅ SAFE' : '❌ UNSAFE');

    return {
      isSafe,
      rawResponse: result,
    };
  } catch (error) {
    console.error('❌ [MODERATION] Error:', error);
    return { isSafe: true };
  }
}

export async function moderateMultiple(contents: string[]): Promise<ModerationResult[]> {
  const results = await Promise.all(contents.map(content => moderateContent(content)));
  return results;
}

export function shouldBlockContent(result: ModerationResult): boolean {
  return !result.isSafe;
}
