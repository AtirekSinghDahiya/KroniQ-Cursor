import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  prompt: string;
}

const detectIntent = (prompt: string): { intent: string; confidence: number } => {
  const lowerPrompt = prompt.toLowerCase();

  const codeKeywords = [
    'code', 'programming', 'function', 'api', 'debug', 'algorithm',
    'javascript', 'python', 'react', 'typescript', 'html', 'css',
    'database', 'backend', 'frontend', 'component', 'class', 'variable',
    'build', 'deploy', 'npm', 'git', 'repository', 'framework', 'write code',
    'create function', 'bug', 'error', 'syntax', 'compile'
  ];

  const designKeywords = [
    'design', 'logo', 'thumbnail', 'poster', 'flyer', 'banner',
    'graphic', 'image', 'photo', 'mockup', 'ui', 'ux', 'layout',
    'color', 'typography', 'branding', 'illustration', 'icon',
    'create design', 'make logo', 'design a', 'visual', 'photoshop',
    'figma', 'sketch'
  ];

  const videoKeywords = [
    'video', 'edit', 'editing', 'reel', 'youtube', 'tiktok',
    'clip', 'footage', 'trim', 'cut', 'transition', 'effect',
    'animation', 'timeline', 'export', 'render', 'create video',
    'make video', 'edit video', 'premiere', 'after effects'
  ];

  const voiceKeywords = [
    'voice', 'audio', 'sound', 'speak', 'speech', 'tts',
    'text to speech', 'narration', 'voiceover', 'podcast',
    'record', 'microphone', 'synthesize', 'generate voice'
  ];

  const codeScore = codeKeywords.filter(keyword => lowerPrompt.includes(keyword)).length;
  const designScore = designKeywords.filter(keyword => lowerPrompt.includes(keyword)).length;
  const videoScore = videoKeywords.filter(keyword => lowerPrompt.includes(keyword)).length;
  const voiceScore = voiceKeywords.filter(keyword => lowerPrompt.includes(keyword)).length;

  const maxScore = Math.max(codeScore, designScore, videoScore, voiceScore);

  if (maxScore === 0) {
    return { intent: 'chat', confidence: 1.0 };
  }

  const totalScore = codeScore + designScore + videoScore + voiceScore;
  const confidence = maxScore / Math.max(totalScore, 1);

  if (codeScore === maxScore) {
    return { intent: 'code', confidence };
  }
  if (designScore === maxScore) {
    return { intent: 'design', confidence };
  }
  if (videoScore === maxScore) {
    return { intent: 'video', confidence };
  }
  if (voiceScore === maxScore) {
    return { intent: 'voice', confidence };
  }

  return { intent: 'chat', confidence: 0.5 };
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: RequestBody = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required');
    }

    const result = detectIntent(prompt);

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error classifying intent:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to classify intent",
        intent: 'chat',
        confidence: 0
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
