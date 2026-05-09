import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { tavernApi, type SessionSummary } from "@/lib/tavern-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { formatDate, formatDuration } from "@/lib/format";

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<string, string> = {
  recording: "bg-secondary text-secondary-foreground",
  processing: "bg-gold/20 text-gold border border-gold/40",
  complete: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  failed: "bg-destructive/15 text-destructive border border-destructive/30",
};

export default function Sessions() {
  const { campaignId } = useParams();
  const { user } = useAuth();
  const [guildId, setGuildId] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState<string>("");
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    if (!campaignId) return;
    tavernApi.getCampaign(campaignId).then((c) => setCampaignName(c.name)).catch(() => {});
  }, [campaignId]);

  useEffect(() => {
    if (!guildId) return;
    setLoading(true);
    setError(null);
    tavernApi
      .listSessions(guildId, { limit: PAGE_SIZE, offset })
      .then((res) => {
        setSessions(res.sessions ?? []);
        setTotal(res.total ?? 0);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [guildId, offset]);

  const filtered = useMemo(() => {
    if (!sessions) return [];
    const q = filter.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter(
      (s) =>
        (s.title ?? "").toLowerCase().includes(q) ||
        (s.session_number != null && String(s.session_number).includes(q))
    );
  }, [sessions, filter]);

  return (
    <div className="container max-w-5xl mx-auto px-6 py-8 space-y-6">
      <Breadcrumbs
        items={[
          { label: "Campaigns", to: "/campaigns" },
          { label: campaignName || "Campaign", to: `/campaigns/${campaignId}` },
          { label: "Sessions" },
        ]}
      />

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-gold-gradient">Sessions</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} session{total === 1 ? "" : "s"} recorded</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or number..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {error && <Card><CardContent className="py-10 text-center text-destructive">{error}</CardContent></Card>}

      {loading && sessions === null && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
        </div>
      )}

      {sessions && filtered.length === 0 && !loading && (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No sessions found.</CardContent></Card>
      )}

      <div className="space-y-3">
        {filtered.map((s) => {
          const status = (s.status || "").toLowerCase();
          const cls = STATUS_STYLES[status] || "bg-secondary text-secondary-foreground";
          const duration = formatDuration(s.started_at, s.ended_at);
          return (
            <Link key={s.id} to={`/campaigns/${campaignId}/sessions/${s.id}`}>
              <Card className="transition-all hover:border-gold/40 hover:bg-card-hover">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="font-display text-xl">
                        {s.title || (s.session_number != null ? `Session #${s.session_number}` : "Untitled session")}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {s.session_number != null && <>Session #{s.session_number} </>}
                        {formatDate(s.started_at || s.created_at)}
                        {duration && (
                          <span className="inline-flex items-center gap-1 ml-2">
                            <Clock className="h-3 w-3" /> {duration}
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge className={`capitalize ${cls}`}>{status || "unknown"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0" />
              </Card>
            </Link>
          );
        })}
      </div>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            disabled={offset === 0 || loading}
            onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            {offset + 1} to {Math.min(offset + PAGE_SIZE, total)} of {total}
          </span>
          <Button
            variant="outline"
            disabled={offset + PAGE_SIZE >= total || loading}
            onClick={() => setOffset((o) => o + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}