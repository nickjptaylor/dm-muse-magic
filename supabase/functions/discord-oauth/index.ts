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

    const body = await req.json();
    const { code, redirect_uri, action } = body ?? {};

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const MANAGE_GUILD = 0x20n;
    const ADMINISTRATOR = 0x8n;
    const filterAndMapGuilds = (data: unknown) =>
      Array.isArray(data)
        ? (data as Record<string, unknown>[])
            .filter((g) => {
              if (g.owner === true) return true;
              try {
                const perms = BigInt((g.permissions as string) ?? "0");
                return (perms & ADMINISTRATOR) !== 0n || (perms & MANAGE_GUILD) !== 0n;
              } catch {
                return false;
              }
            })
            .map((g) => ({ id: g.id, name: g.name, icon: g.icon }))
        : [];

    // Refresh guilds using the stored Discord access token, no full OAuth.
    if (action === "refresh_guilds") {
      const { data: profile, error: profileErr } = await adminClient
        .from("profiles")
        .select("discord_access_token, discord_refresh_token, discord_id")
        .eq("user_id", user.id)
        .maybeSingle();

      let storedToken = profile?.discord_access_token as string | undefined;
      const refreshToken = profile?.discord_refresh_token as string | undefined;
      if (profileErr || (!storedToken && !refreshToken)) {
        return new Response(
          JSON.stringify({
            error: "No Discord session. Please reconnect Discord.",
            requires_reconnect: true,
            guilds: [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const clientId = Deno.env.get("DISCORD_CLIENT_ID")!;
      const clientSecret = Deno.env.get("DISCORD_CLIENT_SECRET")!;

      const tryRefresh = async (): Promise<boolean> => {
        if (!refreshToken) return false;
        const r = await fetch(`${DISCORD_API}/oauth2/token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
            refresh_token: refreshToken,
          }),
        });
        if (!r.ok) return false;
        const t = await r.json();
        storedToken = t.access_token;
        const expiresAt = t.expires_in
          ? new Date(Date.now() + Number(t.expires_in) * 1000).toISOString()
          : null;
        await adminClient
          .from("profiles")
          .update({
            discord_access_token: t.access_token,
            discord_refresh_token: t.refresh_token ?? refreshToken,
            discord_token_expires_at: expiresAt,
          })
          .eq("user_id", user.id);
        return true;
      };

      let guildsRes = storedToken
        ? await fetch(`${DISCORD_API}/users/@me/guilds`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          })
        : new Response(null, { status: 401 });

      if (guildsRes.status === 401) {
        const refreshed = await tryRefresh();
        if (!refreshed) {
          return new Response(
            JSON.stringify({
              error: "Discord session expired. Please reconnect Discord.",
              requires_reconnect: true,
              guilds: [],
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        guildsRes = await fetch(`${DISCORD_API}/users/@me/guilds`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
      }

      if (guildsRes.status === 401) {
        return new Response(
          JSON.stringify({
            error: "Discord session expired. Please reconnect Discord.",
            requires_reconnect: true,
            guilds: [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!guildsRes.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch Discord servers." }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const guildsData = await guildsRes.json();
      const guilds = filterAndMapGuilds(guildsData);

      await adminClient
        .from("profiles")
        .update({ discord_guilds: guilds })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ guilds, discord_id: profile?.discord_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
    const discordRefreshToken = tokenData.refresh_token ?? null;
    const tokenExpiresAt = tokenData.expires_in
      ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
      : null;

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
    const guilds = filterAndMapGuilds(guildsData);

    await adminClient
      .from("profiles")
      .update({
        discord_id: meData.id,
        discord_access_token: accessToken,
        discord_refresh_token: discordRefreshToken,
        discord_token_expires_at: tokenExpiresAt,
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
