import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useAuth, TIERS } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const plans = [
  {
    name: "Apprentice",
    price: "Free",
    period: "",
    description: "Dip your toes into the adventure",
    features: [
      "1 campaign",
      "1 session per month",
      "4 hour session limit",
      "Basic session notes",
    ],
    cta: "Start Free",
    featured: false,
    tierKey: null as string | null,
  },
  {
    name: "Tavern Regular",
    price: "$5",
    period: "/month",
    description: "For casual players getting started",
    features: [
      "2 campaigns",
      "4 sessions per month",
      "4 hour session limit",
      "Session notes & transcript",
      "1 character portrait per session",
    ],
    cta: "Pull Up a Chair",
    featured: false,
    tierKey: "tavernRegular",
  },
  {
    name: "Adventurer",
    price: "$9",
    period: "/month",
    description: "For groups who play every week",
    features: [
      "5 campaigns",
      "8 sessions per month",
      "4 hour session limit",
      "Detailed session summaries",
      "Key moments & funny quotes",
      "2 character portraits per session",
      "DM tips & insights",
    ],
    cta: "Begin Your Quest",
    featured: true,
    tierKey: "adventurer",
  },
  {
    name: "Guild Master",
    price: "$19",
    period: "/month",
    description: "For DMs running multiple parties",
    features: [
      "Unlimited campaigns",
      "Unlimited sessions",
      "Unlimited session length",
      "Everything in Adventurer",
      "Unlimited character portraits",
      "Multiple party tracking",
      "Early access to new features",
    ],
    cta: "Lead the Guild",
    featured: false,
    tierKey: "guildMaster",
  },
];

const Pricing = () => {
  const { user, subscription } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (tierKey: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const tier = TIERS[tierKey as keyof typeof TIERS];
    if (!tier) return;

    setLoadingPlan(tierKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: tier.price_id },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPlan("manage");
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch {
      toast.error("Failed to open subscription management.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const isCurrentPlan = (tierKey: string | null) => {
    if (!tierKey && !subscription.subscribed) return !!user;
    if (!tierKey || !subscription.subscribed) return false;
    const tier = TIERS[tierKey as keyof typeof TIERS];
    return tier?.product_id === subscription.productId;
  };

  return (
    <section id="pricing" className="relative py-24 px-6">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display text-gold-gradient mb-4">
            Choose Your Path
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Every adventurer deserves a chronicle. Pick the plan that suits your party.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const current = isCurrentPlan(plan.tierKey);
            return (
              <div
                key={plan.name}
                className={`relative rounded-lg border p-8 flex flex-col ${
                  plan.featured
                    ? "border-gold/40 bg-card glow-gold"
                    : "border-gold-subtle bg-card"
                } ${current ? "ring-2 ring-gold" : ""}`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gold text-primary-foreground text-xs font-display tracking-widest uppercase px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                {current && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-600 text-white text-xs font-display tracking-widest uppercase px-3 py-1 rounded-full">
                      Your Plan
                    </span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-display text-xl text-foreground mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                </div>
                <div className="mb-8">
                  <span className="text-4xl font-display text-gold-gradient">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                      <span className="text-foreground/80 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                {current && subscription.subscribed ? (
                  <Button
                    variant="heroOutline"
                    size="lg"
                    className="w-full"
                    onClick={handleManageSubscription}
                    disabled={loadingPlan === "manage"}
                  >
                    {loadingPlan === "manage" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Manage Subscription"
                    )}
                  </Button>
                ) : plan.tierKey ? (
                  <Button
                    variant={plan.featured ? "hero" : "heroOutline"}
                    size="lg"
                    className="w-full"
                    onClick={() => handleCheckout(plan.tierKey!)}
                    disabled={loadingPlan === plan.tierKey || current}
                  >
                    {loadingPlan === plan.tierKey ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      plan.cta
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="heroOutline"
                    size="lg"
                    className="w-full"
                    onClick={() => !user && navigate("/auth")}
                    disabled={!!user}
                  >
                    {user ? "Current Plan" : plan.cta}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
