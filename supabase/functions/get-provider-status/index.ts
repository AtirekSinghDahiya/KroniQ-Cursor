import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProviderConfig {
  provider: string;
  displayName: string;
  models: string[];
  envKey: string;
}

const providers: ProviderConfig[] = [
  {
    provider: "openai",
    displayName: "OpenAI",
    models: ["gpt-4", "gpt-3.5-turbo"],
    envKey: "OPENAI_API_KEY"
  },
  {
    provider: "claude",
    displayName: "Claude",
    models: ["claude-3-5-sonnet-20241022", "claude-3-opus"],
    envKey: "CLAUDE_API_KEY"
  },
  {
    provider: "gemini",
    displayName: "Gemini",
    models: ["gemini-pro", "gemini-pro-vision"],
    envKey: "GEMINI_API_KEY"
  },
  {
    provider: "grok",
    displayName: "Grok",
    models: ["grok-1"],
    envKey: "GROK_API_KEY"
  },
  {
    provider: "deepseek",
    displayName: "DeepSeek",
    models: ["deepseek-chat"],
    envKey: "DEEPSEEK_API_KEY"
  },
  {
    provider: "kimi",
    displayName: "Kimi",
    models: ["moonshot-v1"],
    envKey: "KIMI_API_KEY"
  }
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const providersStatus = providers.map(config => {
      const apiKey = Deno.env.get(config.envKey);
      const isAvailable = apiKey && apiKey.length > 0 && !apiKey.includes('your-');

      return {
        provider: config.provider,
        displayName: config.displayName,
        available: isAvailable,
        models: config.models
      };
    });

    const data = {
      providers: providersStatus,
      timestamp: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error checking provider status:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to check provider status",
        providers: []
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
