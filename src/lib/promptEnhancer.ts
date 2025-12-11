/**
 * Prompt Enhancement Service
 * Uses fast AI models for quick prompt improvements
 */

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';

export interface EnhancePromptOptions {
  useReasoningModel?: boolean;
}

/**
 * Enhance a user's prompt to be more detailed and effective
 */
export async function enhancePrompt(
  originalPrompt: string,
  options: EnhancePromptOptions = {}
): Promise<string> {
  if (!originalPrompt.trim()) {
    throw new Error('Prompt cannot be empty');
  }

  // Use fast models that are confirmed working
  // x-ai/grok-4.1-fast is the successor to the Sherlock models
  const model = options.useReasoningModel
    ? 'x-ai/grok-4.1-fast'
    : 'google/gemini-2.0-flash-001';

  const systemPrompt = `You are an expert prompt engineer. Your task is to enhance user prompts to be more detailed, clear, and effective for AI models.

Rules:
1. Keep the core intent of the original prompt
2. Add relevant details and context
3. Make it more specific and actionable
4. Use clear, professional language
5. Return ONLY the enhanced prompt, nothing else
6. Keep it concise but comprehensive
7. Don't change the fundamental request

Examples:
- "make a website" → "Create a modern, responsive website with a clean design, featuring a homepage with hero section, about page, services showcase, and contact form. Use a professional color scheme with smooth animations."
- "image of a cat" → "Generate a photorealistic image of a fluffy Persian cat with striking blue eyes, sitting elegantly on a velvet cushion, with soft natural lighting and a blurred background."
- "help me code" → "Provide clean, well-documented code with proper error handling, following best practices and modern design patterns. Include comments explaining key sections."`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'KroniQ AI Studio',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Enhance this prompt:\n\n${originalPrompt}` }
        ],
        ...(options.useReasoningModel && {
          reasoning: { enabled: true }
        })
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const enhancedPrompt = data.choices[0]?.message?.content?.trim();

    if (!enhancedPrompt) {
      throw new Error('No enhanced prompt received');
    }

    return enhancedPrompt;
  } catch (error: any) {
    console.error('Prompt enhancement error:', error);
    throw new Error(error.message || 'Failed to enhance prompt');
  }
}

/**
 * Check if prompt enhancement is available
 */
export function isPromptEnhancementAvailable(): boolean {
  return !!OPENROUTER_API_KEY;
}
