import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { tavernApi, type Campaign } from "@/lib/tavern-api";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Scroll } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { formatDate } from "@/lib/format";

export default function Campaigns() {
  const { user } = useAuth();
  const [guildId, setGuildId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("selected_guild_id")
        .eq("user_id", user.id)
        .single();
      setGuildId(data?.selected_guild_id ?? null);
    })();
  }, [user]);

  useEffect(() => {
    if (!guildId) return;
    setError(null);
    setCampaigns(null);
    tavernApi
      .listCampaigns(guildId)
      .then((res) => setCampaigns(res.campaigns ?? []))
      .catch((e: Error) => setError(e.message));
  }, [guildId]);

  const filtered = useMemo(() => {
    if (!campaigns) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return campaigns;
    return campaigns.filter((c) => c.name.toLowerCase().includes(q));
  }, [campaigns, filter]);

  return (
    <div className="container max-w-6xl mx-auto px-6 py-8 space-y-6">
      <Breadcrumbs items={[{ label: "Campaigns" }]} />
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-gold-gradient">Your Campaigns</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tales unfolding at the tavern table.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {!guildId && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No server selected. Finish onboarding to pick a Discord server.
          </CardContent>
        </Card>
      )}

      {guildId && error && (
        <Card>
          <CardContent className="py-10 text-center text-destructive">{error}</CardContent>
        </Card>
      )}

      {guildId && !error && campaigns === null && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      )}

      {guildId && campaigns && filtered.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No campaigns found.
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <Link key={c.id} to={`/campaigns/${c.id}`} className="group">
            <Card className="h-full transition-all hover:border-gold/40 hover:bg-card-hover">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <Scroll className="h-4 w-4 text-gold opacity-70" />
                    {c.name}
                  </CardTitle>
                  {c.is_active && (
                    <Badge className="bg-gold text-primary-foreground hover:bg-gold">Active</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3.75rem]">
                  {c.description || "No description yet."}
                </p>
                <p className="text-xs text-muted-foreground">Created {formatDate(c.created_at)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}