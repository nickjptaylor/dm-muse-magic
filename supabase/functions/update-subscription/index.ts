import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const d = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[UPDATE-SUBSCRIPTION] ${step}${d}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);
    if (userError)
      throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email)
      throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { email: user.email });

    const { newPriceId } = await req.json();
    if (!newPriceId || typeof newPriceId !== "string")
      throw new Error("newPriceId is required");
    logStep("Requested price change", { newPriceId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find customer
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });
    if (customers.data.length === 0)
      throw new Error("No Stripe customer found for this user");
    const customerId = customers.data[0].id;
    logStep("Found customer", { customerId });

    // Find active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    if (subscriptions.data.length === 0)
      throw new Error("No active subscription found");

    const subscription = subscriptions.data[0];
    const subscriptionItemId = subscription.items.data[0].id;
    logStep("Found subscription", {
      subscriptionId: subscription.id,
      itemId: subscriptionItemId,
    });

    // Update the subscription item to the new price (prorate immediately)
    const updated = await stripe.subscriptions.update(subscription.id, {
      items: [{ id: subscriptionItemId, price: newPriceId }],
      proration_behavior: "create_prorations",
    });
    logStep("Subscription updated", {
      newStatus: updated.status,
      newProduct: updated.items.data[0].price.product,
    });

    return new Response(
      JSON.stringify({
        success: true,
        product_id: updated.items.data[0].price.product,
        subscription_end: new Date(
          updated.current_period_end * 1000
        ).toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
