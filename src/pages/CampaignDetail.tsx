import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { tavernApi, type CampaignDetail, type HomebrewItem } from "@/lib/tavern-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Loader2,
  Search,
  Users,
  BookOpen,
  ChevronDown,
  Scroll,
  Sparkles,
} from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { formatDate } from "@/lib/format";

export default function CampaignDetailPage() {
  const { campaignId } = useParams();
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [charFilter, setCharFilter] = useState("");

  useEffect(() => {
    if (!campaignId) return;
    setDetail(null);
    setError(null);
    tavernApi
      .getCampaign(campaignId)
      .then(setDetail)
      .catch((e: Error) => setError(e.message));
  }, [campaignId]);

  const filteredChars = useMemo(() => {
    if (!detail) return [];
    const q = charFilter.trim().toLowerCase();
    if (!q) return detail.characters;
    return detail.characters.filter((c) => c.name.toLowerCase().includes(q));
  }, [detail, charFilter]);

  const homebrewByType = useMemo(() => {
    const map: Record<string, HomebrewItem[]> = {};
    if (!detail) return map;
    for (const item of detail.homebrew) {
      const type = item.content_type || "other";
      (map[type] ||= []).push(item);
    }
    return map;
  }, [detail]);

  if (error) {
    return (
      <div className="container max-w-5xl mx-auto px-6 py-8">
        <Card><CardContent className="py-10 text-center text-destructive">{error}</CardContent></Card>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs
        items={[
          { label: "Campaigns", to: "/campaigns" },
          { label: detail.name },
        ]}
      />

      <header className="space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display text-4xl text-gold-gradient">{detail.name}</h1>
          {detail.is_active && (
            <Badge className="bg-gold text-primary-foreground hover:bg-gold">Active</Badge>
          )}
        </div>
        {detail.description && (
          <p className="text-muted-foreground max-w-3xl">{detail.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Started {formatDate(detail.created_at)}</span>
          {detail.dm_discord_id && <span>DM linked</span>}
        </div>
        <div className="flex gap-2 pt-2">
          <Link to={`/campaigns/${detail.id}/sessions`}>
            <Button variant="outline" className="border-gold/40">
              <Scroll className="h-4 w-4 mr-2" /> View Sessions
            </Button>
          </Link>
          <Link to={`/campaigns/${detail.id}/dm-prep`}>
            <Button variant="outline" className="border-gold/40">
              <Sparkles className="h-4 w-4 mr-2" /> DM Prep
            </Button>
          </Link>
        </div>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-display text-2xl flex items-center gap-2">
            <Users className="h-5 w-5 text-gold" /> Party Roster
          </h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search characters..."
              value={charFilter}
              onChange={(e) => setCharFilter(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        {filteredChars.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No characters yet.</CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredChars.map((c) => (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-lg">{c.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    {[c.race, c.character_class].filter(Boolean).join(" ")}
                    {c.level ? ` Lv ${c.level}` : ""}
                  </p>
                  {c.description && (
                    <p className="text-xs text-muted-foreground line-clamp-3 pt-1">{c.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-gold" /> Homebrew
        </h2>
        {Object.keys(homebrewByType).length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No homebrew entries yet.</CardContent></Card>
        ) : (
          <div className="space-y-2">
            {Object.entries(homebrewByType).map(([type, items]) => (
              <Collapsible key={type}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between rounded-md border border-gold-subtle bg-card px-4 py-3 text-left hover:bg-card-hover transition-colors">
                    <span className="font-display capitalize">
                      {type} <span className="text-muted-foreground text-xs ml-2">({items.length})</span>
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pl-2 pt-2">
                  {items.map((item) => (
                    <Card key={item.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-display">{item.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}