import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { tavernApi, type SessionDetail } from "@/lib/tavern-api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Loader2, Clock, ChevronDown, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { formatDate, formatDuration } from "@/lib/format";

export default function SessionDetailPage() {
  const { campaignId, sessionId } = useParams();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    setDetail(null);
    setError(null);
    tavernApi.getSession(sessionId).then(setDetail).catch((e: Error) => setError(e.message));
  }, [sessionId]);

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto px-6 py-8">
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

  const status = (detail.status || "").toLowerCase();
  const duration = formatDuration(detail.started_at, detail.ended_at);

  return (
    <div className="container max-w-4xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs
        items={[
          { label: "Campaigns", to: "/campaigns" },
          { label: "Campaign", to: `/campaigns/${campaignId}` },
          { label: "Sessions", to: `/campaigns/${campaignId}/sessions` },
          { label: `Session #${detail.session_number}` },
        ]}
      />

      <header className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display text-4xl text-gold-gradient">
            {detail.title || `Session #${detail.session_number}`}
          </h1>
          <Badge className="capitalize bg-secondary text-secondary-foreground">{status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Session #{detail.session_number} {formatDate(detail.started_at || detail.created_at)}
          {duration && (
            <span className="inline-flex items-center gap-1 ml-2">
              <Clock className="h-3 w-3" /> {duration}
            </span>
          )}
        </p>
      </header>

      {!detail.summary ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <Sparkles className="h-6 w-6 text-gold mx-auto opacity-70" />
            <p className="font-display text-lg">
              {status === "processing" || status === "recording"
                ? "Session is still processing..."
                : "No summary available yet"}
            </p>
            <p className="text-sm text-muted-foreground">Check back soon for the full recap.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <section>
            <h2 className="font-display text-2xl mb-3">The Recap</h2>
            <Card>
              <CardContent className="prose prose-invert max-w-none py-6 text-foreground">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {detail.summary.narrative_summary}
                </ReactMarkdown>
              </CardContent>
            </Card>
          </section>

          {detail.summary.key_moments?.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-2xl">Key Moments</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detail.summary.key_moments.map((m) => (
                  <Card key={m.id} className="overflow-hidden">
                    {m.art?.s3_url && (
                      <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                        <img
                          src={m.art.s3_url}
                          alt={m.description?.slice(0, 80) || "Key moment"}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <p className="text-sm text-foreground whitespace-pre-wrap">{m.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {detail.summary.dm_coaching_notes && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between rounded-md border border-gold-subtle bg-card px-4 py-3 text-left hover:bg-card-hover transition-colors">
                  <span className="font-display flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-gold" /> DM Coaching
                  </span>
                  <ChevronDown className="h-4 w-4 transition-transform data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="mt-2">
                  <CardContent className="prose prose-invert max-w-none py-6 text-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {detail.summary.dm_coaching_notes}
                    </ReactMarkdown>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          )}
        </>
      )}
    </div>
  );
}