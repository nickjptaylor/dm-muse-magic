import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "npm:@supabase/supabase-js/cors";

const API_BASE = "https://api.tavernrecap.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path");
    if (!path || !path.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Missing or invalid 'path'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Forward query params (excluding our own 'path')
    const forwardedParams = new URLSearchParams();
    for (const [k, v] of url.searchParams.entries()) {
      if (k === "path") continue;
      forwardedParams.append(k, v);
    }
    const qs = forwardedParams.toString();
    const target = `${API_BASE}${path}${qs ? `?${qs}` : ""}`;

    const botApiKey = Deno.env.get("BOT_API_KEY")!;
    const init: RequestInit = {
      method: req.method,
      headers: {
        "x-bot-api-key": botApiKey,
        "Content-Type": "application/json",
      },
    };
    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = await req.text();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    let res: Response;
    try {
      res = await fetch(target, { ...init, signal: controller.signal });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const isAbort = (fetchErr as Error)?.name === "AbortError";
      console.error("tavern-api upstream fetch failed:", fetchErr);
      return new Response(
        JSON.stringify({
          error: isAbort ? "Upstream timed out" : "Upstream unreachable",
        }),
        {
          status: 504,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    clearTimeout(timeoutId);
    const text = await res.text();
    return new Response(text || "{}", {
      status: res.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("tavern-api error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});