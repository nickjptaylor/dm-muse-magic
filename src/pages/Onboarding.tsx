import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth, TIERS } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import tavernLogo from "@/assets/tavernrecap_logo.png";
import {
  Check,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Crown,
  Swords,
  Shield,
  Star,
  ExternalLink,
  RefreshCw,
  MessageSquare,
  Terminal,
  Users,
  Gamepad2,
} from "lucide-react";
import { toast } from "sonner";

const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;

const STEPS = ["Connect Discord", "Add Bot to Server", "Choose Plan", "You're Ready!"];

interface Guild {
  id: string;
  name: string;
  icon: string | null;
}

const plans = [
  {
    name: "Apprentice",
    price: "Free",
    period: "",
    description: "Dip your toes into the adventure",
    icon: Shield,
    features: [
      "1 campaign",
      "1 session per month",
      "4 hour session limit",
      "Basic session notes",
    ],
    tierKey: null as string | null,
  },
  {
    name: "Tavern Regular",
    price: "$5",
    period: "/mo",
    description: "For casual players getting started",
    icon: Star,
    features: [
      "2 campaigns",
      "4 sessions/month",
      "Session notes & transcript",
      "1 character portrait/session",
    ],
    tierKey: "tavernRegular",
  },
  {
    name: "Adventurer",
    price: "$9",
    period: "/mo",
    description: "For groups who play every week",
    icon: Swords,
    features: [
      "5 campaigns",
      "8 sessions/month",
      "Detailed summaries & key moments",
      "2 character portraits/session",
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

const Onboarding = () => {
  const { user, subscription, checkSubscription } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  // Discord state
  const [discordLoading, setDiscordLoading] = useState(false);
  const [discordConnected, setDiscordConnected] = useState(false);
  const [discordUsername, setDiscordUsername] = useState<string | null>(null);
  const [guilds, setGuilds] = useState<Guild[]>([]);

  // Bot state
  const [botStatuses, setBotStatuses] = useState<Record<string, boolean>>({});
  const [checkingBot, setCheckingBot] = useState<string | null>(null);
  const [selectedGuild, setSelectedGuild] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  // Handle Discord OAuth callback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const code = searchParams.get("code");
    if (code && !discordConnected) {
      handleDiscordCallback(code);
    }
  }, [searchParams]);

  // Load existing Discord data from profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("discord_id, discord_guilds, selected_guild_id")
        .eq("user_id", user.id)
        .single();

      if (data?.discord_id) {
        setDiscordConnected(true);
        setDiscordUsername(data.discord_id);
        if (data.discord_guilds && Array.isArray(data.discord_guilds)) {
          setGuilds(data.discord_guilds as unknown as Guild[]);
        }
        if (data.selected_guild_id) {
          setSelectedGuild(data.selected_guild_id);
        }
      }
    };
    loadProfile();
  }, [user]);

  const getDiscordRedirectUri = () => {
    return `${window.location.origin}/onboarding`;
  };

  const handleConnectDiscord = () => {
    const redirectUri = encodeURIComponent(getDiscordRedirectUri());
    const scope = encodeURIComponent("identify guilds");
    const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    window.location.href = url;
  };

  const handleDiscordCallback = async (code: string) => {
    setDiscordLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("discord-oauth", {
        body: { code, redirect_uri: getDiscordRedirectUri() },
      });
      if (error) throw error;

      setDiscordConnected(true);
      setDiscordUsername(data.discord_username);
      setGuilds(data.guilds || []);
      toast.success("Discord connected successfully!");
      // Clean URL
      window.history.replaceState({}, "", "/onboarding");
    } catch (err) {
      console.error("Discord OAuth error:", err);
      toast.error("Failed to connect Discord. Please try again.");
    } finally {
      setDiscordLoading(false);
    }
  };

  const checkBotStatus = useCallback(async (guildId: string) => {
    setCheckingBot(guildId);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bot-proxy?action=status&guild_id=${guildId}`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
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

  const checkAllBotStatuses = useCallback(async () => {
    for (const guild of guilds) {
      await checkBotStatus(guild.id);
    }
  }, [guilds, checkBotStatus]);

  useEffect(() => {
    if (step === 1 && guilds.length > 0) {
      checkAllBotStatuses();
      // Also fetch invite URL
      fetchInviteUrl();
    }
  }, [step, guilds]);

  const fetchInviteUrl = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bot-proxy?action=info`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const data = await res.json();
      if (data.invite_url) {
        setInviteUrl(data.invite_url);
      }
    } catch {
      console.error("Failed to fetch bot invite URL");
    }
  };

  const handleAddBot = (guildId: string) => {
    if (inviteUrl) {
      window.open(inviteUrl, "_blank");
      // Poll for bot status after opening invite
      setTimeout(() => checkBotStatus(guildId), 5000);
      setTimeout(() => checkBotStatus(guildId), 15000);
    } else {
      toast.error("Could not load bot invite link. Please try again.");
    }
  };

  const handleSelectGuild = async (guildId: string) => {
    setSelectedGuild(guildId);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bot-proxy?action=select-guild&guild_id=${guildId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
    } catch {
      console.error("Failed to save selected guild");
    }
  };

  const handleSelectPlan = async (tierKey: string | null) => {
    if (!tierKey) {
      setSelectedPlan("free");
      setStep(3);
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
        const poll = setInterval(async () => {
          await checkSubscription();
        }, 5000);
        setTimeout(() => clearInterval(poll), 120000);
        setStep(3);
      }
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleFinish = async () => {
    if (user) {
      await supabase.from("profiles").update({ onboarding_completed: true }).eq("user_id", user.id);
    }
    navigate("/dashboard");
  };

  const progressValue = ((step + 1) / STEPS.length) * 100;

  const guildIconUrl = (guild: Guild) => {
    if (guild.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
    }
    return null;
  };

  const renderStepIndicator = () => (
    <div className="w-full max-w-2xl mx-auto mb-12">
      <Progress value={progressValue} className="h-2 mb-4" />
      <div className="flex justify-between">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-display transition-all duration-300 ${
                i <= step
                  ? "bg-gold text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={`text-xs hidden sm:inline font-display ${
                i <= step ? "text-gold" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // Step 1: Connect Discord
  const renderDiscordStep = () => (
    <div className="max-w-lg mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-display text-gold-gradient mb-2">Connect Your Discord</h2>
        <p className="text-muted-foreground">
          Link your Discord account so we can find your servers and set up the bot
        </p>
      </div>

      <div className="rounded-lg border border-gold-subtle bg-card p-8 text-center space-y-6">
        {discordLoading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-10 h-10 animate-spin text-gold" />
            <p className="text-muted-foreground">Connecting to Discord...</p>
          </div>
        ) : discordConnected ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <p className="text-foreground font-display text-lg">Discord Connected!</p>
              <p className="text-muted-foreground text-sm">
                Logged in as <span className="text-gold">{discordUsername}</span>
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                Found {guilds.length} server{guilds.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button variant="hero" className="mt-2 flex items-center gap-1" onClick={() => setStep(1)}>
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-[#5865F2]/10 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-[#5865F2]" />
            </div>
            <p className="text-muted-foreground text-sm max-w-sm">
              We'll use Discord to find your servers and check if the TavernRecap bot is set up
            </p>
            <Button
              variant="hero"
              size="lg"
              className="bg-[#5865F2] hover:bg-[#4752C4] text-white border-none"
              onClick={handleConnectDiscord}
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Connect Discord
            </Button>
          </div>
        )}
      </div>

      {!discordConnected && !discordLoading && (
        <button
          onClick={() => setStep(1)}
          className="block mx-auto text-sm text-muted-foreground hover:text-gold transition-colors font-display"
        >
          Skip for now
        </button>
      )}
    </div>
  );

  // Step 2: Add Bot to Server
  const renderBotStep = () => (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-display text-gold-gradient mb-2">Add Bot to Your Server</h2>
        <p className="text-muted-foreground">
          Select the server you want to use and make sure the TavernRecap bot is added
        </p>
      </div>

      {guilds.length === 0 ? (
        <div className="rounded-lg border border-gold-subtle bg-card p-8 text-center space-y-4">
          <p className="text-muted-foreground">No Discord servers found.</p>
          <p className="text-sm text-muted-foreground">
            Connect your Discord account first to see your servers.
          </p>
          <Button variant="heroOutline" onClick={() => setStep(0)}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Discord
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {guilds.map((guild) => {
              const isActive = botStatuses[guild.id] === true;
              const isChecking = checkingBot === guild.id;
              const isSelected = selectedGuild === guild.id;
              const iconUrl = guildIconUrl(guild);

              return (
                <div
                  key={guild.id}
                  className={`rounded-lg border p-4 flex items-center gap-4 transition-all cursor-pointer ${
                    isSelected
                      ? "border-gold/50 bg-gold/5 ring-1 ring-gold/30"
                      : "border-gold-subtle bg-card hover:border-gold/30"
                  }`}
                  onClick={() => handleSelectGuild(guild.id)}
                >
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                    {iconUrl ? (
                      <img src={iconUrl} alt={guild.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-display truncate">{guild.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isActive ? (
                        <span className="text-green-500 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Bot Active
                        </span>
                      ) : (
                        "Bot not added"
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isSelected && (
                      <span className="text-xs text-gold font-display bg-gold/10 px-2 py-1 rounded">
                        Selected
                      </span>
                    )}
                    {isActive ? (
                      <span className="text-xs text-green-500 font-display flex items-center gap-1 bg-green-500/10 px-3 py-1.5 rounded">
                        <Check className="w-3 h-3" /> Bot Active
                      </span>
                    ) : isChecking ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Button
                        variant="heroOutline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddBot(guild.id);
                        }}
                      >
                        Add Bot <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={checkAllBotStatuses}
              className="text-muted-foreground"
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh bot status
            </Button>
          </div>

          <div className="flex gap-3">
            <Button variant="heroOutline" onClick={() => setStep(0)} className="flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <Button
              variant="hero"
              className="flex-1 flex items-center justify-center gap-1"
              onClick={() => setStep(2)}
            >
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}

      {guilds.length > 0 && (
        <button
          onClick={() => setStep(2)}
          className="block mx-auto text-sm text-muted-foreground hover:text-gold transition-colors font-display"
        >
          Skip for now
        </button>
      )}
    </div>
  );

  // Step 3: Choose Plan
  const renderPlanStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-display text-gold-gradient mb-2">Choose Your Path</h2>
        <p className="text-muted-foreground">Select the plan that fits your adventuring party</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 max-w-6xl mx-auto">
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
      <div className="flex justify-center">
        <Button variant="heroOutline" onClick={() => setStep(1)} className="flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>
      </div>
    </div>
  );

  // Step 4: Done
  const renderCompleteStep = () => (
    <div className="max-w-lg mx-auto text-center space-y-8">
      <div className="w-20 h-20 mx-auto rounded-full bg-gold/10 flex items-center justify-center glow-gold">
        <Crown className="w-10 h-10 text-gold" />
      </div>
      <div>
        <h2 className="text-3xl font-display text-gold-gradient mb-3">Your Chronicle Awaits!</h2>
        <p className="text-muted-foreground text-lg">
          You're all set up. Here's how to get started with your first session:
        </p>
      </div>

      {subscription.subscribed && (
        <div className="rounded-lg border border-gold/30 bg-card p-4 inline-block">
          <p className="text-sm text-muted-foreground">
            Active plan:{" "}
            <span className="text-gold font-display">
              {subscription.productId === TIERS.guildMaster.product_id
                ? "Guild Master"
                : subscription.productId === TIERS.adventurer.product_id
                  ? "Adventurer"
                  : subscription.productId === TIERS.tavernRegular.product_id
                    ? "Tavern Regular"
                    : "Apprentice"}
            </span>
          </p>
        </div>
      )}

      <div className="rounded-lg border border-gold-subtle bg-card p-6 text-left space-y-4">
        <h3 className="font-display text-lg text-foreground text-center mb-4">Next Steps</h3>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Terminal className="w-4 h-4 text-gold" />
          </div>
          <div>
            <p className="text-foreground font-display text-sm">Start Recording</p>
            <p className="text-muted-foreground text-sm">
              Go to your Discord server and type{" "}
              <code className="text-gold bg-gold/10 px-1.5 py-0.5 rounded text-xs">/session start</code>{" "}
              in any voice channel to begin recording
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Gamepad2 className="w-4 h-4 text-gold" />
          </div>
          <div>
            <p className="text-foreground font-display text-sm">Create Characters</p>
            <p className="text-muted-foreground text-sm">
              Use{" "}
              <code className="text-gold bg-gold/10 px-1.5 py-0.5 rounded text-xs">/character create</code>{" "}
              to register your character
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Users className="w-4 h-4 text-gold" />
          </div>
          <div>
            <p className="text-foreground font-display text-sm">Set the DM</p>
            <p className="text-muted-foreground text-sm">
              Use{" "}
              <code className="text-gold bg-gold/10 px-1.5 py-0.5 rounded text-xs">/campaign setdm @username</code>{" "}
              to set the Dungeon Master
            </p>
          </div>
        </div>
      </div>

      <Button variant="hero" size="lg" className="px-12" onClick={handleFinish}>
        View Dashboard <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-16">
      <a href="/" className="inline-flex items-center gap-2 mb-8">
        <img src={tavernLogo} alt="TavernRecap" className="h-8 w-auto object-contain" />
        <span className="font-display text-2xl text-foreground tracking-wide">TavernRecap</span>
      </a>

      {renderStepIndicator()}

      {step === 0 && renderDiscordStep()}
      {step === 1 && renderBotStep()}
      {step === 2 && renderPlanStep()}
      {step === 3 && renderCompleteStep()}
    </div>
  );
};

export default Onboarding;
