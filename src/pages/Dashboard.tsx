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
  CreditCard,
  Check,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  RefreshCw,
  Users,
  Unlink,
  Copy,
  Clock,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";

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

interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

const Dashboard = () => {
  const { user, subscription, signOut, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [switchingTier, setSwitchingTier] = useState<string | null>(null);

  // Discord state
  const [discordId, setDiscordId] = useState<string | null>(null);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);
  const [botStatuses, setBotStatuses] = useState<Record<string, boolean>>({});
  const [accountLinkStatuses, setAccountLinkStatuses] = useState<Record<string, boolean>>({});
  const [checkingBot, setCheckingBot] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [refreshingGuilds, setRefreshingGuilds] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  // Account link state
  const [linkCode, setLinkCode] = useState<string | null>(null);
  const [linkCodeLoading, setLinkCodeLoading] = useState(false);
  const [linkCodeCopied, setLinkCodeCopied] = useState(false);
  const linkPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedGuild = useMemo(
    () => guilds.find((guild) => guild.id === selectedGuildId) ?? null,
    [guilds, selectedGuildId]
  );
  const selectedGuildBotActive = selectedGuildId ? botStatuses[selectedGuildId] === true : false;
  const selectedGuildAccountLinked = selectedGuildId ? accountLinkStatuses[selectedGuildId] === true : false;

  // Clear code & polling once linked
  useEffect(() => {
    if (selectedGuildAccountLinked && linkPollRef.current) {
      clearInterval(linkPollRef.current);
      linkPollRef.current = null;
      if (linkCode) {
        toast.success("Account linked successfully!");
        setLinkCode(null);
      }
    }
  }, [selectedGuildAccountLinked, linkCode]);

  useEffect(() => {
    return () => {
      if (linkPollRef.current) clearInterval(linkPollRef.current);
    };
  }, []);

  const generateLinkCode = async () => {
    if (!selectedGuildId) return;
    setLinkCodeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-link-code", {
        body: {},
      });
      if (error) throw new Error(error.message || "Failed to generate link code.");
      if (data?.code) {
        setLinkCode(data.code);
        if (linkPollRef.current) clearInterval(linkPollRef.current);
        linkPollRef.current = setInterval(() => {
          if (selectedGuildId) checkBotStatus(selectedGuildId);
        }, 10000);
      } else {
        toast.error(data?.error || "Failed to generate link code.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate link code.";
      toast.error(message);
    } finally {
      setLinkCodeLoading(false);
    }
  };

  const handleCopyLinkCommand = async () => {
    if (!linkCode) return;
    try {
      await navigator.clipboard.writeText(linkCode);
      setLinkCodeCopied(true);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setLinkCodeCopied(false), 3000);
    } catch {
      toast.error("Failed to copy. Please copy manually.");
    }
  };

  const refreshGuilds = async () => {
    setRefreshingGuilds(true);
    try {
      const { data, error } = await supabase.functions.invoke("discord-oauth", {
        body: { action: "refresh_guilds" },
      });
      const reconnectRequested =
        (data as { requires_reconnect?: boolean } | null)?.requires_reconnect === true;
      const errMsg =
        (data as { error?: string } | null)?.error ||
        (error ? error.message : null);
      if (reconnectRequested || (errMsg && /reconnect discord/i.test(errMsg))) {
        toast.message("Reconnecting Discord to refresh your servers...");
        navigate("/onboarding");
        return;
      }
      if (error) throw new Error(error.message || "Failed to refresh servers.");
      if (data?.guilds) {
        setGuilds(data.guilds as Guild[]);
        toast.success("Server list refreshed.");
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to refresh servers.";
      toast.error(msg);
    } finally {
      setRefreshingGuilds(false);
    }
  };

  // Load profile data
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setProfileLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("discord_id, discord_guilds, selected_guild_id")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setDiscordId(data.discord_id);
        setSelectedGuildId(data.selected_guild_id);
        if (data.discord_guilds && Array.isArray(data.discord_guilds)) {
          setGuilds(data.discord_guilds as unknown as Guild[]);
        }
      }
      setProfileLoading(false);
    };
    load();
  }, [user]);

  // Load and subscribe to account link rows
  useEffect(() => {
    if (!user) return;

    const loadLinks = async () => {
      const { data } = await supabase
        .from("discord_account_links")
        .select("guild_id")
        .eq("user_id", user.id);
      if (data) {
        const map: Record<string, boolean> = {};
        for (const row of data) map[row.guild_id as string] = true;
        setAccountLinkStatuses(map);
      }
    };
    loadLinks();

    const channel = supabase
      .channel(`account-links-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "discord_account_links", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as { guild_id?: string } | null;
          const guildId = row?.guild_id;
          if (!guildId) return;
          setAccountLinkStatuses((prev) => ({
            ...prev,
            [guildId]: payload.eventType !== "DELETE",
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const checkBotStatus = useCallback(async (guildId: string) => {
    setCheckingBot(guildId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setBotStatuses((prev) => ({ ...prev, [guildId]: false }));
        return;
      }
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bot-proxy?action=status&guild_id=${guildId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const result = await res.json();
      setBotStatuses((prev) => ({ ...prev, [guildId]: result.active === true }));
    } catch {
      setBotStatuses((prev) => ({ ...prev, [guildId]: false }));
    } finally {
      setCheckingBot(null);
    }
  }, []);

  // Check bot statuses and fetch invite URL on mount
  useEffect(() => {
    if (guilds.length === 0) return;
    guilds.forEach((g) => checkBotStatus(g.id));
    const fetchInvite = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bot-proxy?action=info`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
          }
        );
        const data = await res.json();
        if (data.invite_url) setInviteUrl(data.invite_url);
      } catch {}
    };
    fetchInvite();
  }, [guilds, checkBotStatus]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  if (!user) return null;

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
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h2 className="font-display text-xl text-foreground">Discord Bot</h2>
                <p className="text-sm text-muted-foreground">
                  {discordId ? (
                    <>
                      Discord connected as <span className="text-gold">{discordId}</span>
                    </>
                  ) : (
                    "Not connected"
                  )}
                </p>
                {selectedGuild && (
                  <p className="text-sm text-muted-foreground">
                    {selectedGuildAccountLinked
                      ? `Account linked in ${selectedGuild.name}`
                      : `Account not linked in ${selectedGuild.name}`}
                  </p>
                )}
              </div>
            </div>
            {!discordId && (
              <Button
                variant="hero"
                size="sm"
                onClick={() => navigate("/onboarding")}
              >
                Connect Discord
              </Button>
            )}
          </div>

          {profileLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : discordId && guilds.length > 0 ? (
            <>
            {/* Account linking (top) */}
            {selectedGuild && selectedGuildBotActive && !selectedGuildAccountLinked && (
              <div className="mb-4 rounded-lg border border-gold/40 bg-gold/5 p-4 space-y-3">
                <div>
                  <p className="text-sm font-display text-foreground">Link your account in {selectedGuild.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Generate a one-time code, then in Discord run <code className="font-mono text-foreground">/account link</code> and paste the code when prompted.
                  </p>
                </div>
                {linkCode ? (
                  <>
                    <button
                      onClick={handleCopyLinkCommand}
                      className="w-full group rounded-lg border-2 border-dashed border-gold/30 bg-gold/5 hover:border-gold/50 hover:bg-gold/10 p-4 transition-all cursor-pointer"
                    >
                      <code className="text-2xl md:text-3xl font-mono font-bold text-gold tracking-widest block text-center">
                        {linkCode}
                      </code>
                      <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-muted-foreground group-hover:text-gold transition-colors">
                        {linkCodeCopied ? (
                          <><Check className="w-3.5 h-3.5" /> Copied!</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" /> Click to copy</>
                        )}
                      </div>
                    </button>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Expires in 10 minutes
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" /> Waiting for confirmation...
                      </span>
                    </div>
                  </>
                ) : (
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={generateLinkCode}
                    disabled={linkCodeLoading}
                  >
                    {linkCodeLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Terminal className="w-4 h-4 mr-2" />
                    )}
                    Generate Link Code
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground font-display">Your Servers</p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={refreshGuilds}
                    disabled={refreshingGuilds}
                    className="text-muted-foreground text-xs"
                  >
                    {refreshingGuilds ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 mr-1" />
                    )}
                    Refresh servers
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => guilds.forEach((g) => checkBotStatus(g.id))}
                    className="text-muted-foreground text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" /> Bot status
                  </Button>
                </div>
              </div>
              {guilds.map((guild) => {
                const isActive = botStatuses[guild.id] === true;
                const isChecking = checkingBot === guild.id;
                const isSelected = selectedGuildId === guild.id;
                const iconUrl = guild.icon
                  ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`
                  : null;

                return (
                  <div
                    key={guild.id}
                    className={`rounded-lg border p-3 flex items-center gap-3 transition-all ${
                      isSelected
                        ? "border-gold/50 bg-gold/5"
                        : "border-gold-subtle bg-secondary/30"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                      {iconUrl ? (
                        <img src={iconUrl} alt={guild.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-display truncate">{guild.name}</p>
                      {isSelected && (
                        <p className="text-xs text-gold">Active Server</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {isSelected && isActive ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-green-500 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded">
                            <Check className="w-3 h-3" /> Bot Active
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {selectedGuildAccountLinked ? "Account linked" : "Account not linked"}
                          </span>
                        </div>
                      ) : isSelected && isChecking ? (
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      ) : isSelected && !isActive ? (
                        <Button
                          variant="heroOutline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => {
                            if (inviteUrl) {
                              window.open(inviteUrl, "_blank");
                              setTimeout(() => checkBotStatus(guild.id), 5000);
                            }
                          }}
                        >
                          Add Bot <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          ) : discordId ? (
            <p className="text-sm text-muted-foreground py-4">No servers found. Try reconnecting Discord.</p>
          ) : (
            <div className="px-4 py-6 rounded-md bg-secondary/30 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Connect your Discord account to set up the TavernRecap bot in your server
              </p>
              <Button variant="heroOutline" size="sm" onClick={() => navigate("/onboarding")}>
                Set Up Discord
              </Button>
            </div>
          )}

          {discordId && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                disabled={reconnecting}
                onClick={async () => {
                  setReconnecting(true);
                  try {
                    const res = await fetch(
                      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discord-oauth`,
                      { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
                    );
                    const { client_id } = await res.json();
                    if (!client_id) throw new Error("Missing Discord client id");
                    const redirectUri = encodeURIComponent(`${window.location.origin}/onboarding`);
                    const scope = encodeURIComponent("identify guilds");
                    window.location.href = `https://discord.com/api/oauth2/authorize?client_id=${client_id}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&prompt=consent`;
                  } catch (e) {
                    toast.error("Failed to start Discord reconnect");
                    setReconnecting(false);
                  }
                }}
              >
                <Unlink className="w-3 h-3 mr-1" />
                {reconnecting ? "Redirecting..." : "Reconnect Discord"}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
