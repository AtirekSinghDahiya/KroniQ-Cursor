import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RUNWAY_API_KEY = Deno.env.get("RUNWAY_API_KEY");
const RUNWAY_API_BASE = "https://api.dev.runwayml.com/v1";
const PIXVERSE_API_KEY = Deno.env.get("PIXVERSE_API_KEY");
const PIXVERSE_API_BASE = "https://app-api.pixverse.ai/openapi/v2";

Deno.serve(async (req: Request) => {
  const rid = crypto.randomUUID().slice(0, 8);
  console.log(`[${rid}] gen4_turbo | ${req.method} ${req.url}`);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const text = await req.text();
    console.log(`[${rid}] Body:`, text);

    const body = JSON.parse(text);
    console.log(`[${rid}] Parsed:`, JSON.stringify(body));

    const provider = body.provider || "pixverse";

    if (body.action === "generate" && provider === "pixverse") {
      if (!PIXVERSE_API_KEY) {
        throw new Error("PIXVERSE_API_KEY not configured");
      }

      const traceId = crypto.randomUUID();
      const payload = {
        prompt: body.prompt || "",
        aspect_ratio: body.aspectRatio || "16:9",
        duration: body.duration || 5,
        model: "v4.5",
        motion_mode: "normal",
        quality: "540p",
        seed: body.seed || Math.floor(Math.random() * 1000000),
        water_mark: false
      };

      console.log(`[${rid}] Calling Pixverse:`, JSON.stringify(payload));

      const res = await fetch(`${PIXVERSE_API_BASE}/video/text/generate`, {
        method: "POST",
        headers: {
          "API-KEY": PIXVERSE_API_KEY,
          "Ai-trace-id": traceId,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const resText = await res.text();
      console.log(`[${rid}] Pixverse response (${res.status}):`, resText);

      if (!res.ok) {
        throw new Error(`Pixverse API error (${res.status}): ${resText}`);
      }

      const data = JSON.parse(resText);
      console.log(`[${rid}] Pixverse parsed data:`, JSON.stringify(data));

      let videoId = null;
      if (data.Resp && data.Resp.video_id) {
        videoId = data.Resp.video_id;
      } else if (data.video_id) {
        videoId = data.video_id;
      } else if (data.id) {
        videoId = data.id;
      }

      if (!videoId && data.ErrCode !== 0) {
        throw new Error(data.ErrMsg || `Pixverse API error: ${data.ErrCode}`);
      }

      if (!videoId) {
        throw new Error(`No video_id in response. Full response: ${resText}`);
      }

      return new Response(
        JSON.stringify({ success: true, taskId: videoId, data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (body.action === "status" && provider === "pixverse") {
      if (!body.taskId) {
        throw new Error("taskId required for status check");
      }

      console.log(`[${rid}] Checking Pixverse status:`, body.taskId);

      const res = await fetch(`${PIXVERSE_API_BASE}/video/result/${body.taskId}`, {
        method: "GET",
        headers: {
          "API-KEY": PIXVERSE_API_KEY,
          "Content-Type": "application/json"
        }
      });

      const resText = await res.text();
      console.log(`[${rid}] Pixverse status response (${res.status}):`, resText);

      if (!res.ok) {
        throw new Error(`Status check failed (${res.status}): ${resText}`);
      }

      const data = JSON.parse(resText);
      console.log(`[${rid}] Pixverse parsed status:`, JSON.stringify(data));

      let videoUrl = null;
      let status = "processing";
      let statusCode = data.status || data.code || (data.Resp && data.Resp.status);

      if (statusCode === 1 || data.Resp?.status === 1) {
        status = "completed";
        videoUrl = data.url || data.video_url || data.Resp?.url || data.Resp?.video_url;
      } else if (statusCode === 5 || data.Resp?.status === 5) {
        status = "processing";
      } else if (statusCode === 7 || statusCode === 8 || data.Resp?.status === 7 || data.Resp?.status === 8) {
        status = "failed";
      }

      return new Response(
        JSON.stringify({
          success: true,
          status,
          videoUrl,
          progress: statusCode === 1 ? 100 : statusCode === 5 ? 50 : 0,
          error: statusCode === 7 ? "Content moderation failure" : statusCode === 8 ? "Generation failed" : null,
          rawData: data
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (body.action === "generate") {
      if (!RUNWAY_API_KEY) {
        throw new Error("RUNWAY_API_KEY not configured");
      }
      const payload = {
        promptText: body.prompt || "",
        model: "gen4_turbo",
        duration: body.duration || 5,
        ratio: body.aspectRatio === "9:16" ? "720:1280" : body.aspectRatio === "1:1" ? "960:960" : "1280:720"
      };

      console.log(`[${rid}] Calling Runway:`, JSON.stringify(payload));

      const res = await fetch(`${RUNWAY_API_BASE}/text_to_video`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RUNWAY_API_KEY}`,
          "Content-Type": "application/json",
          "X-Runway-Version": "2024-11-06"
        },
        body: JSON.stringify(payload)
      });

      const resText = await res.text();
      console.log(`[${rid}] Runway response (${res.status}):`, resText);

      if (!res.ok) {
        throw new Error(`Runway API error (${res.status}): ${resText}`);
      }

      const data = JSON.parse(resText);
      return new Response(
        JSON.stringify({ success: true, taskId: data.id, data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (body.action === "status") {
      if (!body.taskId) {
        throw new Error("taskId required for status check");
      }

      console.log(`[${rid}] Checking status:`, body.taskId);

      const res = await fetch(`${RUNWAY_API_BASE}/tasks/${body.taskId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${RUNWAY_API_KEY}`,
          "Content-Type": "application/json",
          "X-Runway-Version": "2024-11-06"
        }
      });

      const resText = await res.text();
      console.log(`[${rid}] Status response (${res.status}):`, resText);

      if (!res.ok) {
        throw new Error(`Status check failed (${res.status}): ${resText}`);
      }

      const data = JSON.parse(resText);
      let videoUrl = null;
      
      if (data.status === "SUCCEEDED") {
        videoUrl = data.output?.[0] || data.artifacts?.[0]?.url || data.output?.url || data.video?.url || data.outputUrl;
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: data.status,
          videoUrl,
          progress: data.progress || (data.status === "RUNNING" ? 50 : 0),
          error: data.failure || data.failureReason || data.error,
          rawData: data
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      throw new Error(`Invalid action: ${body.action}`);
    }
  } catch (err: any) {
    console.error(`[${rid}] ERROR:`, err.message);
    return new Response(
      JSON.stringify({ success: false, error: err.message, version: "gen4_turbo" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
