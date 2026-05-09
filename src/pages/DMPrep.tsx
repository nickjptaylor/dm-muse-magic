import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Pin, X, BookOpen, Wand2, Loader2 } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  tavernApi,
  type PlotHook,
  type StoryThread,
  type ThreadStatus,
  type HookStatus,
} from "@/lib/tavern-api";
import { toast } from "sonner";

export default function DMPrep() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [intro, setIntro] = useState("");
  const [hooks, setHooks] = useState<PlotHook[]>([]);
  const [threads, setThreads] = useState<StoryThread[]>([]);
  const [filter, setFilter] = useState<"all" | ThreadStatus>("all");
  const [loading, setLoading] = useState(true);
  const [genIntro, setGenIntro] = useState(false);
  const [genHooks, setGenHooks] = useState(false);
  const [prepping, setPrepping] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    setLoading(true);
    Promise.all([
      tavernApi.listThreads(campaignId).catch(() => ({ threads: [] as StoryThread[] })),
      tavernApi.listHooks(campaignId).catch(() => ({ hooks: [] as PlotHook[] })),
      tavernApi.listIntros(campaignId).catch(() => ({ intros: [] as { generated_text: string }[] })),
    ])
      .then(([t, h, i]) => {
        setThreads(("threads" in t ? t.threads : []) as StoryThread[]);
        setHooks(("hooks" in h ? h.hooks : []) as PlotHook[]);
        const last = (i as { intros: { generated_text: string }[] }).intros?.[0];
        if (last?.generated_text) setIntro(last.generated_text);
      })
      .finally(() => setLoading(false));
  }, [campaignId]);

  const filteredThreads = threads.filter((t) => filter === "all" || t.status === filter);

  const handleGenerateIntro = async () => {
    if (!campaignId) return;
    setGenIntro(true);
    try {
      const result = await tavernApi.generateIntro(campaignId, 3);
      setIntro(result.generated_text);
      toast.success("Intro generated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenIntro(false);
    }
  };

  const handleSuggestHooks = async () => {
    if (!campaignId) return;
    setGenHooks(true);
    try {
      const result = await tavernApi.suggestHooks(campaignId);
      setHooks(result.hooks);
      toast.success("New hooks suggested");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenHooks(false);
    }
  };

  const handleHookStatus = async (hookId: string, status: HookStatus) => {
    setHooks((arr) => arr.map((x) => (x.id === hookId ? { ...x, status } : x)));
    try {
      await tavernApi.updateHook(hookId, status);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleThreadStatus = async (threadId: string, status: ThreadStatus) => {
    setThreads((arr) => arr.map((x) => (x.id === threadId ? { ...x, status } : x)));
    try {
      await tavernApi.updateThread(threadId, status);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handlePrepAll = async () => {
    if (!campaignId) return;
    setPrepping(true);
    try {
      const result = await tavernApi.prepNextSession(campaignId);
      if (result.intro?.generated_text) setIntro(result.intro.generated_text);
      setHooks(result.hooks || []);
      setThreads(result.threads || []);
      toast.success("Session prep ready");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPrepping(false);
    }
  };

  return (
    <div className="container max-w-5xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs
        items={[
          { label: "Campaigns", to: "/campaigns" },
          { label: "Campaign", to: `/campaigns/${campaignId}` },
          { label: "DM Prep" },
        ]}
      />

      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl text-gold-gradient">DM Prep</h1>
          <p className="text-sm text-muted-foreground mt-1">Get ready for your next session at the table.</p>
        </div>
        <Button
          onClick={handlePrepAll}
          disabled={prepping || !campaignId}
          className="bg-gold text-primary-foreground hover:bg-gold-light"
        >
          {prepping ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
          Prep Next Session
        </Button>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-2xl flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-gold" /> Last time on...
        </h2>
        <Card>
          <CardContent className="py-6 space-y-4">
            <p className="text-sm text-muted-foreground">Click Generate to create a session intro based on your recent sessions.</p>
            <Textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder="Your read-aloud intro will appear here. Edit freely before reading at the table."
              className="min-h-[160px] font-body"
            />
            <div className="flex justify-end">
              <Button onClick={handleGenerateIntro} disabled={genIntro || !campaignId} variant="outline" className="border-gold/40">
                {genIntro ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Generate Intro
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-display text-2xl">Plot Hooks</h2>
          <Button onClick={handleSuggestHooks} disabled={genHooks || !campaignId} variant="outline" size="sm" className="border-gold/40">
            {genHooks ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
            Generate Hooks
          </Button>
        </div>
        {hooks.length === 0 && !loading && (
          <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No hooks yet. Generate some to get started.</CardContent></Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {hooks.map((h) => (
            <Card key={h.id} className={h.status === "dismissed" ? "opacity-50" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-display">{h.title}</CardTitle>
                  {h.status === "pinned" && (
                    <Badge className="bg-gold text-primary-foreground hover:bg-gold">Pinned</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{h.description}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gold/40"
                    onClick={() => handleHookStatus(h.id, h.status === "pinned" ? "suggested" : "pinned")}
                  >
                    <Pin className="h-3.5 w-3.5 mr-1" /> {h.status === "pinned" ? "Unpin" : "Pin"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleHookStatus(h.id, "dismissed")}
                  >
                    <X className="h-3.5 w-3.5 mr-1" /> Dismiss
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-display text-2xl">Thread Tracker</h2>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-2">
          {filteredThreads.length === 0 && !loading && (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No threads here yet.</CardContent></Card>
          )}
          {filteredThreads.map((t) => (
            <Card key={t.id}>
              <CardContent className="py-4 flex items-start justify-between gap-3 flex-wrap">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display">{t.title}</span>
                    <Badge
                      variant="outline"
                      className={
                        t.status === "active"
                          ? "border-gold/40 text-gold"
                          : t.status === "resolved"
                            ? "border-emerald-500/40 text-emerald-300"
                            : "border-muted-foreground/30 text-muted-foreground"
                      }
                    >
                      {t.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                  {t.thread_type && (
                    <p className="text-xs text-muted-foreground capitalize">{t.thread_type}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  {(["active", "resolved", "dismissed"] as ThreadStatus[]).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={t.status === s ? "default" : "ghost"}
                      onClick={() => handleThreadStatus(t.id, s)}
                      className="capitalize text-xs"
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}