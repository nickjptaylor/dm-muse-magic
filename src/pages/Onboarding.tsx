import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, TIERS } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import TavernLogo from "@/components/TavernLogo";
import { Check, Loader2, ChevronRight, ChevronLeft, Crown, Swords, Shield, MessageSquare, Hash, Volume2 } from "lucide-react";
import { toast } from "sonner";

const plans = [
  {
    name: "Apprentice",
    price: "Free",
    period: "",
    description: "Get started with your first campaign",
    icon: Shield,
    features: [
      "2 campaigns",
      "3 sessions per month",
      "4 hour session limit",
      "Session notes & transcript",
      "1 character portrait",
    ],
    tierKey: null as string | null,
  },
  {
    name: "Adventurer",
    price: "$6",
    period: "/mo",
    description: "For groups who play every week",
    icon: Swords,
    features: [
      "2 campaigns",
      "12 sessions/month",
      "Unlimited session length",
      "Detailed summaries & key moments",
      "3 character portraits/session",
      "DM tips & insights",
    ],
    tierKey: "adventurer",
    featured: true,
  },
  {
    name: "Guild Master",
    price: "$19",
    period: "/mo",
    description: "For DMs running multiple parties",
    icon: Crown,
    features: [
      "Unlimited everything",
      "All Adventurer features",
      "Unlimited character portraits",
      "Multiple party tracking",
      "Early access to new features",
    ],
    tierKey: "guildMaster",
  },
];

const STEPS = ["Choose Your Plan", "Set Up Discord Bot", "You're Ready!"];

const Onboarding = () => {
  const { user, subscription, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [discordSetup, setDiscordSetup] = useState({
    serverName: "",
    voiceChannel: "",
    textChannel: "",
  });

  // Redirect if not logged in
  if (!user) {
    navigate("/auth?mode=signup");
    return null;
  }

  const handleSelectPlan = async (tierKey: string | null) => {
    if (!tierKey) {
      // Free plan — skip to step 2
      setSelectedPlan("free");
      setStep(1);
      return;
    }

    const tier = TIERS[tierKey as keyof typeof TIERS];
    if (!tier) return;

    setLoadingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: tier.price_id },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        toast.info("Complete checkout in the new tab, then come back here to continue.", {
          duration: 10000,
        });
        setSelectedPlan(tierKey);
        // Poll for subscription after checkout
        const poll = setInterval(async () => {
          await checkSubscription();
        }, 5000);
        setTimeout(() => clearInterval(poll), 120000);
        setStep(1);
      }
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoadingCheckout(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-12">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-display transition-all duration-300 ${
              i <= step
                ? "bg-gold text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {i < step ? <Check className="w-4 h-4" /> : i + 1}
          </div>
          <span className={`text-sm hidden sm:inline font-display ${i <= step ? "text-gold" : "text-muted-foreground"}`}>
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <div className={`w-8 h-px ${i < step ? "bg-gold" : "bg-secondary"}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderPlanStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-display text-gold-gradient mb-2">Choose Your Path</h2>
        <p className="text-muted-foreground">Select the plan that fits your adventuring party</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <button
              key={plan.name}
              onClick={() => handleSelectPlan(plan.tierKey)}
              disabled={loadingCheckout}
              className={`relative rounded-lg border p-6 text-left transition-all duration-300 hover:scale-[1.02] ${
                plan.featured
                  ? "border-gold/40 bg-card glow-gold"
                  : "border-gold-subtle bg-card hover:border-gold/30"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-gold text-primary-foreground text-xs font-display tracking-widest uppercase px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="font-display text-lg text-foreground">{plan.name}</h3>
                  <p className="text-muted-foreground text-xs">{plan.description}</p>
                </div>
              </div>
              <div className="mb-5">
                <span className="text-3xl font-display text-gold-gradient">{plan.price}</span>
                {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
              </div>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-3.5 h-3.5 text-gold mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
              {loadingCheckout && (
                <div className="absolute inset-0 bg-background/50 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-gold" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderDiscordStep = () => (
    <div className="max-w-lg mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-display text-gold-gradient mb-2">Set Up Your Discord Bot</h2>
        <p className="text-muted-foreground">
          Tell us about your Discord server so we can get TavernRecap ready for your sessions
        </p>
      </div>

      <div className="rounded-lg border border-gold-subtle bg-card p-6 space-y-5">
        <div className="space-y-2">
          <Label className="text-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gold" />
            Discord Server Name
          </Label>
          <Input
            placeholder="e.g. The Dragon's Den"
            value={discordSetup.serverName}
            onChange={(e) => setDiscordSetup({ ...discordSetup, serverName: e.target.value })}
            className="border-gold-subtle bg-background text-foreground"
          />
          <p className="text-xs text-muted-foreground">The name of your Discord server where you play</p>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-gold" />
            Voice Channel Name
          </Label>
          <Input
            placeholder="e.g. Session Voice"
            value={discordSetup.voiceChannel}
            onChange={(e) => setDiscordSetup({ ...discordSetup, voiceChannel: e.target.value })}
            className="border-gold-subtle bg-background text-foreground"
          />
          <p className="text-xs text-muted-foreground">The voice channel where your party gathers to play</p>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground flex items-center gap-2">
            <Hash className="w-4 h-4 text-gold" />
            Text Channel for Recaps
          </Label>
          <Input
            placeholder="e.g. #session-recaps"
            value={discordSetup.textChannel}
            onChange={(e) => setDiscordSetup({ ...discordSetup, textChannel: e.target.value })}
            className="border-gold-subtle bg-background text-foreground"
          />
          <p className="text-xs text-muted-foreground">Where TavernRecap will post session summaries</p>
        </div>

        <div className="pt-2 px-4 py-3 rounded-md bg-gold/5 border border-gold/10">
          <p className="text-sm text-muted-foreground">
            <span className="text-gold font-display">Coming Soon:</span> Full Discord bot integration with automatic server detection. For now, just tell us your setup and we'll have you ready when the bot launches!
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="heroOutline" onClick={() => setStep(0)} className="flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
        <Button variant="hero" className="flex-1 flex items-center justify-center gap-1" onClick={() => setStep(2)}>
          Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <button onClick={() => setStep(2)} className="block mx-auto text-sm text-muted-foreground hover:text-gold transition-colors font-display">
        Skip for now →
      </button>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="max-w-lg mx-auto text-center space-y-8">
      <div className="w-20 h-20 mx-auto rounded-full bg-gold/10 flex items-center justify-center glow-gold">
        <Crown className="w-10 h-10 text-gold" />
      </div>
      <div>
        <h2 className="text-3xl font-display text-gold-gradient mb-3">Your Chronicle Awaits!</h2>
        <p className="text-muted-foreground text-lg">
          You're all set up. Head to your dashboard to start recording epic adventures.
        </p>
      </div>

      {subscription.subscribed && (
        <div className="rounded-lg border border-gold/30 bg-card p-4 inline-block">
          <p className="text-sm text-muted-foreground">
            Active plan: <span className="text-gold font-display">
              {subscription.productId === TIERS.guildMaster.product_id ? "Guild Master" : "Adventurer"}
            </span>
          </p>
        </div>
      )}

      <Button variant="hero" size="lg" className="px-12" onClick={() => navigate("/dashboard")}>
        Enter the Tavern <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-16">
      <a href="/" className="inline-flex items-center gap-2 mb-8">
        <TavernLogo className="w-8 h-8 text-gold" />
        <span className="font-display text-2xl text-foreground tracking-wide">TavernRecap</span>
      </a>

      {renderStepIndicator()}

      {step === 0 && renderPlanStep()}
      {step === 1 && renderDiscordStep()}
      {step === 2 && renderCompleteStep()}
    </div>
  );
};

export default Onboarding;
