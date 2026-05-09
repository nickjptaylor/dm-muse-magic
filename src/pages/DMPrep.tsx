import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Pin, X, BookOpen, Wand2 } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";

type ThreadStatus = "active" | "resolved" | "dismissed";

interface PlotHook {
  id: string;
  title: string;
  description: string;
  state: "suggested" | "pinned" | "dismissed";
}

interface Thread {
  id: string;
  title: string;
  description: string;
  status: ThreadStatus;
  origin: string;
}

const PLACEHOLDER_HOOKS: PlotHook[] = [
  { id: "1", title: "Follow up on the mysterious letter from Session 3", description: "The party never opened the sealed envelope from the cloaked stranger.", state: "suggested" },
  { id: "2", title: "The merchant's debt comes due", description: "Old Henrick promised to pay back the party, perhaps with information instead of gold.", state: "suggested" },
  { id: "3", title: "Whispers in the crypt return", description: "Players reported strange voices when last visiting the abandoned crypt.", state: "suggested" },
];

const PLACEHOLDER_THREADS: Thread[] = [
  { id: "t1", title: "The Crimson Cult", description: "Hooded figures spotted in three towns.", status: "active", origin: "Session 2" },
  { id: "t2", title: "Lyra's missing brother", description: "Last seen heading north past the falls.", status: "active", origin: "Session 4" },
  { id: "t3", title: "The cursed amulet", description: "Destroyed at the standing stones.", status: "resolved", origin: "Session 5" },
];

export default function DMPrep() {
  const { campaignId } = useParams();
  const [intro, setIntro] = useState("");
  const [hooks, setHooks] = useState<PlotHook[]>(PLACEHOLDER_HOOKS);
  const [threads, setThreads] = useState<Thread[]>(PLACEHOLDER_THREADS);
  const [filter, setFilter] = useState<"all" | ThreadStatus>("all");

  const filteredThreads = threads.filter((t) => filter === "all" || t.status === filter);

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
        <Button className="bg-gold text-primary-foreground hover:bg-gold-light">
          <Wand2 className="h-4 w-4 mr-2" /> Prep Next Session
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
              <Button disabled variant="outline" className="border-gold/40">
                <Sparkles className="h-4 w-4 mr-2" /> Generate Intro
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Plot Hooks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {hooks.map((h) => (
            <Card key={h.id} className={h.state === "dismissed" ? "opacity-50" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-display">{h.title}</CardTitle>
                  {h.state === "pinned" && (
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
                    onClick={() =>
                      setHooks((arr) => arr.map((x) => (x.id === h.id ? { ...x, state: x.state === "pinned" ? "suggested" : "pinned" } : x)))
                    }
                  >
                    <Pin className="h-3.5 w-3.5 mr-1" /> {h.state === "pinned" ? "Unpin" : "Pin"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setHooks((arr) => arr.map((x) => (x.id === h.id ? { ...x, state: "dismissed" } : x)))}
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
          {filteredThreads.length === 0 && (
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
                  <p className="text-xs text-muted-foreground">From {t.origin}</p>
                </div>
                <div className="flex gap-1">
                  {(["active", "resolved", "dismissed"] as ThreadStatus[]).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={t.status === s ? "default" : "ghost"}
                      onClick={() => setThreads((arr) => arr.map((x) => (x.id === t.id ? { ...x, status: s } : x)))}
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