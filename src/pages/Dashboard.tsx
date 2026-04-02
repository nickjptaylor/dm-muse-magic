import { useNavigate } from "react-router-dom";
import { useAuth, TIERS } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import tavernLogo from "@/assets/tavernrecap_logo.png";
import {
  Crown,
  Swords,
  Shield,
  Settings,
  LogOut,
  Loader2,
  MessageSquare,
  Volume2,
  Hash,
  CreditCard,
  Check,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const tiersList = [
  {
    key: "tavernRegular" as const,
    name: "Tavern Regular",
    price: "$5",
    icon: Shield,
    features: ["2 campaigns", "4 sessions/mo", "Session notes & transcript"],
  },
  {
    key: "adventurer" as const,
    name: "Adventurer",
    price: "$9",
    icon: Swords,
    features: ["5 campaigns", "8 sessions/mo", "Detailed summaries & DM tips"],
  },
  {
    key: "guildMaster" as const,
    name: "Guild Master",
    price: "$19",
    icon: Crown,
    features: ["Unlimited campaigns", "Unlimited sessions", "Everything included"],
  },
];

const TIER_ORDER: Record<string, number> = {
  [TIERS.tavernRegular.product_id]: 0,
  [TIERS.adventurer.product_id]: 1,
  [TIERS.guildMaster.product_id]: 2,
};

const Dashboard = () => {
  const { user, subscription, signOut, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [switchingTier, setSwitchingTier] = useState<string | null>(null);

  if (!user) {
    navigate("/auth");
    return null;
  }

  const currentTierName = subscription.subscribed
    ? subscription.productId === TIERS.guildMaster.product_id
      ? "Guild Master"
      : subscription.productId === TIERS.adventurer.product_id
        ? "Adventurer"
        : "Tavern Regular"
    : "Apprentice (Free)";

  const TierIcon = subscription.subscribed
    ? subscription.productId === TIERS.guildMaster.product_id
      ? Crown
      : subscription.productId === TIERS.adventurer.product_id
        ? Swords
        : Shield
    : Shield;

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Failed to open subscription management.");
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleSwitchTier = async (tierKey: keyof typeof TIERS) => {
    const tier = TIERS[tierKey];
    setSwitchingTier(tierKey);
    try {
      const { data, error } = await supabase.functions.invoke("update-subscription", {
        body: { newPriceId: tier.price_id },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Switched to ${tier.name}!`);
        await checkSubscription();
      } else {
        throw new Error(data?.error || "Unknown error");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to switch plan.";
      toast.error(msg);
    } finally {
      setSwitchingTier(null);
    }
  };

  const handleCheckout = async (tierKey: keyof typeof TIERS) => {
    const tier = TIERS[tierKey];
    setSwitchingTier(tierKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: tier.price_id },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Failed to start checkout.");
    } finally {
      setSwitchingTier(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkSubscription();
    setRefreshing(false);
    toast.success("Subscription status refreshed");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const currentTierOrder = subscription.subscribed && subscription.productId
    ? (TIER_ORDER[subscription.productId] ?? -1)
    : -1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-gold-subtle">
        <div className="container max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <img src={tavernLogo} alt="TavernRecap" className="h-7 w-auto object-contain" />
            <span className="font-display text-xl text-foreground tracking-wide">TavernRecap</span>
          </a>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-display text-gold-gradient mb-2">Welcome Back, Adventurer</h1>
          <p className="text-muted-foreground">Manage your subscription and Discord bot settings</p>
        </div>

        {/* Subscription Card */}
        <div className="rounded-lg border border-gold-subtle bg-card p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
                <TierIcon className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h2 className="font-display text-xl text-foreground">Subscription</h2>
                <p className="text-sm text-muted-foreground">
                  Current plan: <span className="text-gold font-display">{currentTierName}</span>
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-muted-foreground"
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>

          {subscription.subscriptionEnd && (
            <p className="text-sm text-muted-foreground mb-4">
              Renews on{" "}
              {new Date(subscription.subscriptionEnd).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}

          {subscription.subscribed && (
            <div className="mb-4">
              <Button
                variant="heroOutline"
                onClick={handleManageSubscription}
                disabled={loadingPortal}
                className="flex items-center gap-2"
              >
                {loadingPortal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                Payment & Billing
              </Button>
            </div>
          )}

          {/* Tier switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            {tiersList.map((t) => {
              const tier = TIERS[t.key];
              const isCurrent =
                subscription.subscribed && subscription.productId === tier.product_id;
              const tierOrder = TIER_ORDER[tier.product_id];
              const isUpgrade = tierOrder > currentTierOrder;
              const isDowngrade = tierOrder < currentTierOrder;

              return (
                <div
                  key={t.key}
                  className={`rounded-lg border p-4 flex flex-col ${
                    isCurrent
                      ? "border-gold/50 bg-gold/5 ring-1 ring-gold/30"
                      : "border-gold-subtle bg-card"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <t.icon className="w-4 h-4 text-gold" />
                    <span className="font-display text-sm text-foreground">{t.name}</span>
                  </div>
                  <span className="text-2xl font-display text-gold-gradient mb-3">
                    {t.price}
                    <span className="text-sm text-muted-foreground font-sans">/mo</span>
                  </span>
                  <ul className="space-y-1 mb-4 flex-grow">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="w-3 h-3 text-gold mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <span className="text-xs text-center text-gold font-display py-2">
                      Current Plan
                    </span>
                  ) : subscription.subscribed ? (
                    <Button
                      variant={isUpgrade ? "hero" : "heroOutline"}
                      size="sm"
                      className="w-full flex items-center gap-1.5"
                      onClick={() => handleSwitchTier(t.key)}
                      disabled={switchingTier === t.key}
                    >
                      {switchingTier === t.key ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : isUpgrade ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : isDowngrade ? (
                        <ArrowDown className="w-3 h-3" />
                      ) : null}
                      {isUpgrade ? "Upgrade" : "Downgrade"}
                    </Button>
                  ) : (
                    <Button
                      variant="hero"
                      size="sm"
                      className="w-full"
                      onClick={() => handleCheckout(t.key)}
                      disabled={switchingTier === t.key}
                    >
                      {switchingTier === t.key ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Subscribe"
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Discord Bot Card */}
        <div className="rounded-lg border border-gold-subtle bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
              <Settings className="w-6 h-6 text-gold" />
            </div>
            <div>
              <h2 className="font-display text-xl text-foreground">Discord Bot Setup</h2>
              <p className="text-sm text-muted-foreground">
                Configure how TavernRecap connects to your server
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-md bg-secondary/50">
              <MessageSquare className="w-4 h-4 text-gold flex-shrink-0" />
              <div>
                <p className="text-sm text-foreground">Discord Server</p>
                <p className="text-xs text-muted-foreground">Not connected yet</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-secondary/50">
              <Volume2 className="w-4 h-4 text-gold flex-shrink-0" />
              <div>
                <p className="text-sm text-foreground">Voice Channel</p>
                <p className="text-xs text-muted-foreground">Not configured</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-md bg-secondary/50">
              <Hash className="w-4 h-4 text-gold flex-shrink-0" />
              <div>
                <p className="text-sm text-foreground">Recap Channel</p>
                <p className="text-xs text-muted-foreground">Not configured</p>
              </div>
            </div>
          </div>

          <div className="mt-6 px-4 py-3 rounded-md bg-gold/5 border border-gold/10">
            <p className="text-sm text-muted-foreground">
              <span className="text-gold font-display">Coming Soon:</span> Full Discord bot
              integration with one-click setup. Stay tuned!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
