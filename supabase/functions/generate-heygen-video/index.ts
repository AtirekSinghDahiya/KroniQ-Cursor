import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const HEYGEN_API_BASE = 'https://api.heygen.com/v2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, X-Heygen-Key",
};

interface GenerateRequest {
  action: 'generate' | 'status';
  script?: string;
  avatarId?: string;
  voiceId?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  videoId?: string;
  apiKey?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body: GenerateRequest = await req.json();

    const apiKey = body.apiKey || Deno.env.get('HEYGEN_API_KEY') || req.headers.get('X-Heygen-Key');

    if (!apiKey) {
      throw new Error('HeyGen API key not provided. Please configure HEYGEN_API_KEY in Supabase secrets or pass it in the request.');
    }

    if (body.action === 'generate') {
      const payload = {
        video_inputs: [
          {
            character: {
              type: 'avatar',
              avatar_id: body.avatarId || 'Angela-inblackskirt-20220820',
              avatar_style: 'normal'
            },
            voice: {
              type: 'text',
              input_text: body.script || '',
              voice_id: body.voiceId || '1bd001e7e50f421d891986aad5158bc8',
            }
          }
        ],
        dimension: {
          width: body.aspectRatio === '9:16' ? 720 : body.aspectRatio === '1:1' ? 1080 : 1920,
          height: body.aspectRatio === '9:16' ? 1280 : body.aspectRatio === '1:1' ? 1080 : 1080
        },
        test: false
      };

      console.log('📤 HeyGen generate payload:', payload);

      const response = await fetch(`${HEYGEN_API_BASE}/video/generate`, {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('📥 HeyGen response:', responseText);

      if (!response.ok) {
        throw new Error(`HeyGen API error (${response.status}): ${responseText}`);
      }

      const data = JSON.parse(responseText);

      if (data.error) {
        throw new Error(data.error.message || 'HeyGen API error');
      }

      return new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });

    } else if (body.action === 'status') {
      if (!body.videoId) {
        throw new Error('Video ID is required for status check');
      }

      const response = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${body.videoId}`, {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey,
        },
      });

      const responseText = await response.text();
      console.log('📊 HeyGen status response:', responseText);

      if (!response.ok) {
        throw new Error(`Failed to check status (${response.status}): ${responseText}`);
      }

      const data = JSON.parse(responseText);

      if (data.error) {
        throw new Error(data.error.message || 'Failed to check video status');
      }

      return new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });

    } else {
      throw new Error('Invalid action');
    }

  } catch (error: any) {
    console.error('❌ HeyGen function error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to process request',
        details: error.toString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});