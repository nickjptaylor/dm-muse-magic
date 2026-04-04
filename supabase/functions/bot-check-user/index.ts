import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-bot-api-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate with BOT_API_KEY
    const botKey = req.headers.get("x-bot-api-key");
    const expectedKey = Deno.env.get("BOT_API_KEY");
    if (!expectedKey) throw new Error("BOT_API_KEY is not configured");
    if (!botKey || botKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const body = await req.json();
    const { email, discord_id } = body;

    if (!email && !discord_id) {
      return new Response(
        JSON.stringify({ error: "Provide 'email' or 'discord_id'" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Look up user email
    let userEmail = email;

    if (discord_id && !email) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("discord_id", discord_id)
        .maybeSingle();

      if (profileError) throw new Error(`Profile lookup failed: ${profileError.message}`);
      if (!profile) {
        return new Response(
          JSON.stringify({ found: false, error: "No user linked to this Discord ID" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );
      }

      const { data: userData, error: userError } =
        await supabase.auth.admin.getUserById(profile.user_id);
      if (userError || !userData?.user?.email) {
        throw new Error("Could not resolve user email");
      }
      userEmail = userData.user.email;
    }

    // Check Stripe subscription
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: userEmail, limit: 1 });

    if (customers.data.length === 0) {
      return new Response(
        JSON.stringify({
          found: true,
          email: userEmail,
          subscribed: false,
          tier: "Apprentice",
          limits: {
            campaigns: 1,
            sessions_per_month: 1,
            session_length_minutes: 240,
            portraits_per_session: 0,
            detailed_summaries: false,
            dm_tips: false,
            multi_party_tracking: false,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return new Response(
        JSON.stringify({
          found: true,
          email: userEmail,
          subscribed: false,
          tier: "Apprentice",
          limits: {
            campaigns: 1,
            sessions_per_month: 1,
            session_length_minutes: 240,
            portraits_per_session: 0,
            detailed_summaries: false,
            dm_tips: false,
            multi_party_tracking: false,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const subscription = subscriptions.data[0];
    const productId = subscription.items.data[0].price.product as string;

    // Map product IDs to tiers and limits
    const tierMap: Record<string, { tier: string; limits: Record<string, unknown> }> = {
      prod_UFzp7ylPjjYICA: {
        tier: "Tavern Regular",
        limits: {
          campaigns: 2,
          sessions_per_month: 4,
          session_length_minutes: 240,
          portraits_per_session: 1,
          detailed_summaries: false,
          dm_tips: false,
          multi_party_tracking: false,
        },
      },
      prod_UGBhmLly8JXtcH: {
        tier: "Adventurer",
        limits: {
          campaigns: 5,
          sessions_per_month: 8,
          session_length_minutes: 240,
          portraits_per_session: 2,
          detailed_summaries: true,
          dm_tips: true,
          multi_party_tracking: false,
        },
      },
      prod_UFtjWnJa0EOTqX: {
        tier: "Guild Master",
        limits: {
          campaigns: -1,
          sessions_per_month: -1,
          session_length_minutes: -1,
          portraits_per_session: -1,
          detailed_summaries: true,
          dm_tips: true,
          multi_party_tracking: true,
        },
      },
    };

    const tierInfo = tierMap[productId] ?? {
      tier: "Unknown",
      limits: {},
    };

    const item = subscription.items.data[0] as any;
    const endTimestamp = Number(item.current_period_end);
    const subscriptionEnd =
      !isNaN(endTimestamp) && endTimestamp > 0
        ? new Date(endTimestamp * 1000).toISOString()
        : null;

    return new Response(
      JSON.stringify({
        found: true,
        email: userEmail,
        subscribed: true,
        product_id: productId,
        tier: tierInfo.tier,
        limits: tierInfo.limits,
        subscription_end: subscriptionEnd,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
