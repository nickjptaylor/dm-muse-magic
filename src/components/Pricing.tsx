import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Apprentice",
    price: "Free",
    period: "",
    description: "Perfect for trying out the scribe",
    features: [
      "2 sessions per month",
      "Basic session summaries",
      "1 character portrait",
      "Community support",
    ],
    cta: "Start Free",
    featured: false,
  },
  {
    name: "Adventurer",
    price: "$9",
    period: "/month",
    description: "For dedicated campaign groups",
    features: [
      "Unlimited sessions",
      "Detailed session summaries",
      "5 character portraits per month",
      "DM tips & insights",
      "Key moments highlights",
      "Priority support",
    ],
    cta: "Begin Your Quest",
    featured: true,
  },
  {
    name: "Guild Master",
    price: "$24",
    period: "/month",
    description: "For multiple campaigns & parties",
    features: [
      "Everything in Adventurer",
      "Unlimited character portraits",
      "Multiple campaign tracking",
      "Advanced DM analytics",
      "Custom summary templates",
      "Early access to new features",
    ],
    cta: "Lead the Guild",
    featured: false,
  },
];

const Pricing = () => {
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-lg border p-8 flex flex-col ${
                plan.featured
                  ? "border-gold/40 bg-card glow-gold"
                  : "border-gold-subtle bg-card"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gold text-primary-foreground text-xs font-display tracking-widest uppercase px-4 py-1 rounded-full">
                    Most Popular
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
              <Button
                variant={plan.featured ? "hero" : "heroOutline"}
                size="lg"
                className="w-full"
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
