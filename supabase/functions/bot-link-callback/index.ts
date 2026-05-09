import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-bot-api-key",
  "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const botKey = req.headers.get("x-bot-api-key");
    const expectedKey = Deno.env.get("BOT_API_KEY");
    if (!expectedKey) throw new Error("BOT_API_KEY not configured");
    if (!botKey || botKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, guild_id, discord_user_id, action } = body ?? {};

    if (!email || !guild_id) {
      return new Response(
        JSON.stringify({ error: "email and guild_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // Resolve user_id from email via auth admin
    const { data: list, error: listErr } = await admin.auth.admin.listUsers();
    if (listErr) throw new Error(`User lookup failed: ${listErr.message}`);
    const user = list.users.find((u) => (u.email ?? "").toLowerCase() === String(email).toLowerCase());
    if (!user) {
      return new Response(JSON.stringify({ error: "No user found for that email" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "unlink" || req.method === "DELETE") {
      const { error: delErr } = await admin
        .from("discord_account_links")
        .delete()
        .eq("user_id", user.id)
        .eq("guild_id", String(guild_id));
      if (delErr) throw new Error(delErr.message);
      return new Response(JSON.stringify({ success: true, unlinked: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: upsertErr } = await admin
      .from("discord_account_links")
      .upsert(
        {
          user_id: user.id,
          guild_id: String(guild_id),
          discord_user_id: discord_user_id ? String(discord_user_id) : null,
          linked_at: new Date().toISOString(),
        },
        { onConflict: "user_id,guild_id" }
      );
    if (upsertErr) throw new Error(upsertErr.message);

    return new Response(JSON.stringify({ success: true, linked: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("bot-link-callback error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});