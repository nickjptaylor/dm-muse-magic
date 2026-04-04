import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: any) => {
  console.log(`[CHECK-SUB] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    log("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Search by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    log("Stripe customer search by email", { 
      email: user.email, 
      found: customers.data.length,
      customerIds: customers.data.map(c => c.id),
      customerEmails: customers.data.map(c => c.email)
    });

    if (customers.data.length === 0) {
      // Fallback: list all customers and log for debugging
      const allCustomers = await stripe.customers.list({ limit: 10 });
      log("ALL customers for debugging", allCustomers.data.map(c => ({ id: c.id, email: c.email, name: c.name })));
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        debug_email_searched: user.email,
        debug_customers_found: 0
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    log("Subscriptions found", { 
      customerId, 
      activeCount: subscriptions.data.length,
      subscriptions: subscriptions.data.map(s => ({ id: s.id, status: s.status, product: s.items.data[0]?.price?.product }))
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      const endTimestamp = Number(subscription.current_period_end);
      if (!isNaN(endTimestamp) && endTimestamp > 0) {
        subscriptionEnd = new Date(endTimestamp * 1000).toISOString();
      }
      productId = subscription.items.data[0].price.product;
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      product_id: productId,
      subscription_end: subscriptionEnd,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
