import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "npm:@supabase/supabase-js/cors";

const LINK_CODE_URL = "https://api.tavernrecap.com/api/link/generate";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const discordUserId = body?.discord_user_id;
    if (!discordUserId) {
      return new Response(JSON.stringify({ error: "Missing discord_user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const botApiKey = Deno.env.get("BOT_API_KEY");
    if (!botApiKey) {
      console.error("BOT_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstreamResponse = await fetch(LINK_CODE_URL, {
      method: "POST",
      headers: {
        "x-bot-api-key": botApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        discord_user_id: discordUserId,
      }),
    });

    if (!upstreamResponse.ok) {
      const upstreamText = await upstreamResponse.text();
      console.error("Link generate failed:", upstreamResponse.status, upstreamText);

      const errorMessage = upstreamResponse.status === 404
        ? "The TavernRecap link code endpoint is not available yet."
        : "Failed to generate link code.";

      return new Response(
        JSON.stringify({
          error: errorMessage,
          upstream_status: upstreamResponse.status,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await upstreamResponse.json();
    if (!data?.code) {
      console.error("Link generate succeeded without code:", data);
      return new Response(JSON.stringify({ error: "No link code was returned by the backend." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Generate link code error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
