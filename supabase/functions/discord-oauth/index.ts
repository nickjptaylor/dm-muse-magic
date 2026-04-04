import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "npm:@supabase/supabase-js/cors";

const DISCORD_API = "https://discord.com/api/v10";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // GET: return client_id for the frontend
  if (req.method === "GET") {
    const clientId = Deno.env.get("DISCORD_CLIENT_ID") || "";
    return new Response(JSON.stringify({ client_id: clientId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { code, redirect_uri } = await req.json();
    if (!code || !redirect_uri) {
      return new Response(JSON.stringify({ error: "Missing code or redirect_uri" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientId = Deno.env.get("DISCORD_CLIENT_ID")!;
    const clientSecret = Deno.env.get("DISCORD_CLIENT_SECRET")!;

    // Exchange code for token
    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Discord token exchange failed:", err);
      return new Response(JSON.stringify({ error: "Discord OAuth failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch user identity
    const meRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const meData = await meRes.json();

    // Fetch guilds
    const guildsRes = await fetch(`${DISCORD_API}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const guildsData = await guildsRes.json();

    // Store in profile using service role
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const guilds = Array.isArray(guildsData)
      ? guildsData.map((g: Record<string, unknown>) => ({ id: g.id, name: g.name, icon: g.icon }))
      : [];

    await adminClient
      .from("profiles")
      .update({
        discord_id: meData.id,
        discord_access_token: accessToken,
        discord_guilds: guilds,
      })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        discord_id: meData.id,
        discord_username: `${meData.username}`,
        guilds,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Discord OAuth error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
