import { useNavigate } from "react-router-dom";
import { useAuth, TIERS } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import tavernLogo from "@/assets/tavernrecap_logo.png";
import { Crown, Swords, Shield, Settings, LogOut, Loader2, MessageSquare, Volume2, Hash, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const Dashboard = () => {
  const { user, subscription, signOut, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  if (!user) {
    navigate("/auth");
    return null;
  }

  const currentTierName = subscription.subscribed
    ? subscription.productId === TIERS.guildMaster.product_id
      ? "Guild Master"
      : "Adventurer"
    : "Apprentice (Free)";

  const TierIcon = subscription.subscribed
    ? subscription.productId === TIERS.guildMaster.product_id
      ? Crown
      : Swords
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-gold-subtle">
        <div className="container max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2">
            <TavernLogo className="w-7 h-7 text-gold" />
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
              Renews on {new Date(subscription.subscriptionEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            {subscription.subscribed ? (
              <Button
                variant="heroOutline"
                onClick={handleManageSubscription}
                disabled={loadingPortal}
                className="flex items-center gap-2"
              >
                {loadingPortal ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                Manage Subscription
              </Button>
            ) : (
              <Button variant="hero" onClick={() => navigate("/onboarding")} className="flex items-center gap-2">
                <Crown className="w-4 h-4" /> Upgrade Plan
              </Button>
            )}
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
              <p className="text-sm text-muted-foreground">Configure how TavernRecap connects to your server</p>
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
              <span className="text-gold font-display">Coming Soon:</span> Full Discord bot integration with one-click setup. Stay tuned!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
