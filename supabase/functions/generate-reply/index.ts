import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface AIPreferences {
  personality: string;
  creativityLevel: number;
  responseLength: string;
}

interface RequestBody {
  projectId: string;
  messages: AIMessage[];
  provider: string;
  preferences: AIPreferences;
}

interface AIResponse {
  content: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
}

const getSystemPrompt = (preferences: AIPreferences): string => {
  const personalityMap: Record<string, string> = {
    creative: 'Be highly imaginative, artistic, and think outside the box.',
    professional: 'Be formal, business-oriented, and precise.',
    funny: 'Be humorous, light-hearted, and entertaining.',
    balanced: 'Be well-rounded, versatile, and adaptable.',
    technical: 'Be highly detailed, precise, and technical.',
    casual: 'Be friendly, conversational, and approachable.',
  };

  const personality = personalityMap[preferences.personality] || personalityMap.balanced;

  return `You are Kroniq AI, a helpful assistant. ${personality} Provide helpful, accurate information.`;
};

// Helper function to estimate tokens if API doesn't provide usage
function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters or 0.75 words
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words * 1.3);
}

async function callOpenAI(messages: AIMessage[], preferences: AIPreferences): Promise<AIResponse> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const systemPrompt = getSystemPrompt(preferences);
  const temperature = preferences.creativityLevel / 10;
  const maxTokens = preferences.responseLength === 'short' ? 150 :
                    preferences.responseLength === 'medium' ? 500 : 1000;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0].message.content,
    tokensUsed: {
      prompt: data.usage?.prompt_tokens || estimateTokens(messages.map(m => m.content).join(' ')),
      completion: data.usage?.completion_tokens || estimateTokens(data.choices[0].message.content),
      total: data.usage?.total_tokens || 0
    }
  };
}

async function callClaude(messages: AIMessage[], preferences: AIPreferences): Promise<AIResponse> {
  const apiKey = Deno.env.get('CLAUDE_API_KEY');
  if (!apiKey) throw new Error('Claude API key not configured');

  const systemPrompt = getSystemPrompt(preferences);
  const temperature = preferences.creativityLevel / 10;
  const maxTokens = preferences.responseLength === 'short' ? 150 :
                    preferences.responseLength === 'medium' ? 500 : 1000;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      system: systemPrompt,
      messages: messages.filter(m => m.role !== 'system'),
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Claude API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    content: data.content[0].text,
    tokensUsed: {
      prompt: data.usage?.input_tokens || estimateTokens(messages.map(m => m.content).join(' ')),
      completion: data.usage?.output_tokens || estimateTokens(data.content[0].text),
      total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
    }
  };
}

async function callGemini(messages: AIMessage[], preferences: AIPreferences): Promise<AIResponse> {
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) throw new Error('Gemini API key not configured');

  const systemPrompt = getSystemPrompt(preferences);
  const temperature = preferences.creativityLevel / 10;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
          ...messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          })),
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: preferences.responseLength === 'short' ? 150 :
                          preferences.responseLength === 'medium' ? 500 : 1000,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;

  // Gemini provides usageMetadata
  const usage = data.usageMetadata || {};

  return {
    content,
    tokensUsed: {
      prompt: usage.promptTokenCount || estimateTokens(messages.map(m => m.content).join(' ')),
      completion: usage.candidatesTokenCount || estimateTokens(content),
      total: usage.totalTokenCount || 0
    }
  };
}

async function callGrok(messages: AIMessage[], preferences: AIPreferences): Promise<AIResponse> {
  const apiKey = Deno.env.get('GROK_API_KEY');
  if (!apiKey) throw new Error('Grok API key not configured');

  const systemPrompt = getSystemPrompt(preferences);
  const temperature = preferences.creativityLevel / 10;
  const maxTokens = preferences.responseLength === 'short' ? 150 :
                    preferences.responseLength === 'medium' ? 500 : 1000;

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-1',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Grok API error: ${response.status}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0].message.content,
    tokensUsed: {
      prompt: data.usage?.prompt_tokens || estimateTokens(messages.map(m => m.content).join(' ')),
      completion: data.usage?.completion_tokens || estimateTokens(data.choices[0].message.content),
      total: data.usage?.total_tokens || 0
    }
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: RequestBody = await req.json();
    const { messages, provider, preferences } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array is required');
    }

    if (!provider) {
      throw new Error('Provider is required');
    }

    let result: AIResponse;

    switch (provider) {
      case 'openai':
        result = await callOpenAI(messages, preferences);
        break;
      case 'claude':
        result = await callClaude(messages, preferences);
        break;
      case 'gemini':
        result = await callGemini(messages, preferences);
        break;
      case 'grok':
        result = await callGrok(messages, preferences);
        break;
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    return new Response(
      JSON.stringify({
        response: result.content,
        tokensUsed: result.tokensUsed
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
