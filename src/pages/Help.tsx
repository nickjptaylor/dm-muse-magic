import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Rocket,
  Mic,
  Scroll,
  Swords,
  FlaskConical,
  Palette,
  Sparkles,
  Gem,
  HelpCircle,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SectionId =
  | "getting-started"
  | "recording"
  | "campaigns"
  | "characters"
  | "homebrew"
  | "summaries"
  | "dm-prep"
  | "tiers"
  | "faq";

const sections: { id: SectionId; title: string; icon: typeof Rocket }[] = [
  { id: "getting-started", title: "Getting Started", icon: Rocket },
  { id: "recording", title: "Recording Sessions", icon: Mic },
  { id: "campaigns", title: "Campaigns", icon: Scroll },
  { id: "characters", title: "Characters", icon: Swords },
  { id: "homebrew", title: "Homebrew Content", icon: FlaskConical },
  { id: "summaries", title: "Summaries & Artwork", icon: Palette },
  { id: "dm-prep", title: "DM Session Prep", icon: Sparkles },
  { id: "tiers", title: "Subscription Tiers", icon: Gem },
  { id: "faq", title: "FAQ", icon: HelpCircle },
];

function Cmd({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[0.85em] text-gold-light break-words">
      {children}
    </code>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon: typeof Rocket; title: string; subtitle?: string }) {
  return (
    <div className="mb-6 flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gold/10 text-gold">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-display text-2xl tracking-wide">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

const tierRows: { feature: string; values: [string, string, string, string] }[] = [
  { feature: "Sessions / month", values: ["2", "4", "8", "Unlimited"] },
  { feature: "Campaigns", values: ["1", "2", "5", "Unlimited"] },
  { feature: "Key moment art", values: ["-", "1 / session", "2 / session", "Unlimited"] },
  { feature: "DM coaching", values: ["-", "-", "✓", "✓"] },
  { feature: "Session prep tools", values: ["-", "-", "-", "✓"] },
];
const tierNames = ["Apprentice (Free)", "Tavern Regular ($5/mo)", "Adventurer ($9/mo)", "Guild Master ($19/mo)"];

export default function Help() {
  const [active, setActive] = useState<SectionId>("getting-started");

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl tracking-wide text-gold-gradient">Help & Documentation</h1>
        <p className="mt-2 text-muted-foreground">
          Everything you need to know about the Tavern Recap bot and website.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Sidebar nav */}
        <nav className="lg:sticky lg:top-4 lg:self-start">
          <ul className="flex flex-row flex-wrap gap-1 lg:flex-col">
            {sections.map((s) => {
              const isActive = active === s.id;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => setActive(s.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-gold/15 text-gold"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    )}
                  >
                    <s.icon className="h-4 w-4" />
                    <span>{s.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content */}
        <Card className="border-gold-subtle">
          <CardContent className="p-6 sm:p-8">
            {active === "getting-started" && (
              <div>
                <SectionHeader icon={Rocket} title="Getting Started" subtitle="Go from zero to your first recorded session." />
                <ol className="space-y-3 text-sm leading-relaxed">
                  {[
                    <><strong>Sign up</strong> at tavernrecap.com and choose a subscription.</>,
                    <><strong>Add the bot</strong> to your Discord server using the invite link.</>,
                    <><strong>Link your account</strong>: the website gives you a one-time code. Type <Cmd>/account link YOUR-CODE</Cmd> in Discord to connect your subscription to your server.</>,
                    <><strong>Create a campaign</strong>: type <Cmd>/campaign create name:"My Campaign"</Cmd>.</>,
                    <><strong>Set the DM</strong>: type <Cmd>/campaign setdm dm:@YourDM</Cmd>.</>,
                    <><strong>Register characters</strong>: each player types <Cmd>/character register name:"Thorin" race:"Dwarf" class:"Fighter" level:5</Cmd>.</>,
                    <><strong>Record a session</strong>: join a voice channel, type <Cmd>/session start</Cmd>, play your game, then <Cmd>/session stop</Cmd> when you're done.</>,
                    <>The bot handles the rest: transcription, summary, key moment art, and DM coaching notes happen automatically.</>,
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-semibold text-gold">{i + 1}</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {active === "recording" && (
              <div className="space-y-6">
                <SectionHeader icon={Mic} title="Recording Sessions" />
                <ul className="space-y-2 text-sm">
                  <li><Cmd>/session start</Cmd>: Join a voice channel first, then run this. The bot joins and records each speaker separately for accurate transcription.</li>
                  <li><Cmd>/session stop</Cmd>: Stops the recording. The bot leaves voice and processes everything in the background (usually 1–3 minutes).</li>
                  <li><Cmd>/session status</Cmd>: Check if a recording is running and how long it's been going.</li>
                </ul>
                <div>
                  <h3 className="mb-2 font-display text-lg">After you stop, the bot will:</h3>
                  <ol className="ml-5 list-decimal space-y-1 text-sm text-muted-foreground">
                    <li>Transcribe the audio (via Deepgram).</li>
                    <li>Write a narrative summary of what happened.</li>
                    <li>Extract the most dramatic moment for each player.</li>
                    <li>Generate unique artwork for each key moment.</li>
                    <li>Send private DM coaching notes to the Dungeon Master (if your tier includes it).</li>
                    <li>Track story threads for future session prep.</li>
                  </ol>
                </div>
              </div>
            )}

            {active === "campaigns" && (
              <div className="space-y-4">
                <SectionHeader icon={Scroll} title="Campaigns" subtitle="Organise your sessions, characters, and homebrew. Each server can have multiple." />
                <ul className="space-y-2 text-sm">
                  <li><Cmd>/campaign create name:"Curse of Strahd" description:"Gothic horror in Barovia"</Cmd>: creates a new campaign and makes it active.</li>
                  <li><Cmd>/campaign list</Cmd>: shows all campaigns (✓ marks the active one).</li>
                  <li><Cmd>/campaign select name:"My Campaign"</Cmd>: switches the active campaign.</li>
                  <li><Cmd>/campaign setdm dm:@Username</Cmd>: sets the DM (their speech becomes narration, not a player character).</li>
                  <li><Cmd>/campaign setchannel channel:#recaps mode:thread</Cmd>: choose where summaries go. Use <Cmd>thread</Cmd> mode to create a new thread per session.</li>
                </ul>
              </div>
            )}

            {active === "characters" && (
              <div className="space-y-4">
                <SectionHeader icon={Swords} title="Characters" subtitle="Register your character so the bot knows who you are and can generate personalised artwork." />
                <ul className="space-y-2 text-sm">
                  <li><Cmd>/character register name:"Elara" race:"Half-Elf" class:"Ranger" level:7</Cmd>: links your Discord account to your character.</li>
                  <li><Cmd>/character upload image:&lt;attach file&gt;</Cmd>: upload a reference image. Used when generating key moment art to keep your character looking consistent.</li>
                  <li><Cmd>/character list</Cmd>: shows all characters in the active campaign.</li>
                  <li><Cmd>/character view</Cmd>: view your character's details and reference image.</li>
                </ul>
                <div className="rounded-md border border-gold/30 bg-gold/5 p-3 text-sm">
                  <strong className="text-gold">Tip:</strong> Uploading a character portrait dramatically improves the generated artwork quality.
                </div>
              </div>
            )}

            {active === "homebrew" && (
              <div className="space-y-4">
                <SectionHeader icon={FlaskConical} title="Homebrew Content" subtitle="Add custom lore, NPCs, locations, rules, and items. The bot weaves them into summaries and DM coaching." />
                <ul className="space-y-2 text-sm">
                  <li><Cmd>/campaign homebrew add type:npc title:"Bram Ironkettle" content:"Gruff dwarf blacksmith in Millhaven who secretly works for the thieves' guild"</Cmd></li>
                  <li>Types: <Cmd>lore</Cmd> <Cmd>npc</Cmd> <Cmd>location</Cmd> <Cmd>rule</Cmd> <Cmd>item</Cmd></li>
                  <li><Cmd>/campaign homebrew list</Cmd>: view all entries (filter by type).</li>
                  <li><Cmd>/campaign homebrew view title:"Bram Ironkettle"</Cmd>: see full details.</li>
                  <li><Cmd>/campaign homebrew remove title:"Bram Ironkettle"</Cmd>: delete an entry.</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  The more the bot knows about your world, the better it gets: summaries reference your NPCs by name, describe your locations accurately, and coaching suggests ways to use your established lore.
                </p>
              </div>
            )}

            {active === "summaries" && (
              <div className="space-y-4">
                <SectionHeader icon={Palette} title="Summaries & Artwork" subtitle="What you get after every session." />
                <ul className="space-y-2 text-sm">
                  <li><strong>Narrative summary</strong>: a story-style recap written in past tense, like a chapter in a novel.</li>
                  <li><strong>Session title</strong>: an auto-generated evocative title (e.g. "The Siege of Blackhollow").</li>
                  <li><strong>Key moment art</strong>: a unique illustration for each player's most dramatic moment, matching your reference portrait when uploaded.</li>
                  <li><strong>DM coaching notes</strong>: private tips covering pacing, engagement, storytelling, and rules.</li>
                </ul>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-md border border-border p-4">
                    <h4 className="mb-2 font-display">In Discord</h4>
                    <ul className="space-y-1 text-sm">
                      <li><Cmd>/summary last</Cmd>: see the most recent recap.</li>
                      <li><Cmd>/summary history</Cmd>: browse past sessions.</li>
                    </ul>
                  </div>
                  <div className="rounded-md border border-border p-4">
                    <h4 className="mb-2 font-display">On the website</h4>
                    <p className="text-sm text-muted-foreground">Browse all sessions with full summaries and an art gallery on the campaign dashboard.</p>
                  </div>
                </div>
              </div>
            )}

            {active === "dm-prep" && (
              <div className="space-y-4">
                <SectionHeader icon={Sparkles} title="DM Session Prep" subtitle="Website-only tools to help DMs prepare for the next session." />
                <ul className="space-y-3 text-sm">
                  <li><strong>Session Intro Generator</strong>: creates a dramatic "When we last left our heroes…" read-aloud recap based on recent sessions. Edit it to your liking before game night.</li>
                  <li><strong>Story Thread Tracker</strong>: the bot extracts unresolved storylines after each session (quests accepted, villains escaped, mysteries unsolved, promises made). Mark them resolved or dismiss the ones you're not pursuing.</li>
                  <li><strong>Plot Hook Suggestions</strong>: AI-generated hooks based on active threads, character backstories, and homebrew lore. Pin the ones you like, dismiss the rest.</li>
                  <li><strong>One-Click Prep</strong>: hit "Prep Next Session" to generate an intro, update threads, and get fresh plot hooks all at once.</li>
                </ul>
              </div>
            )}

            {active === "tiers" && (
              <div className="space-y-4">
                <SectionHeader icon={Gem} title="Subscription Tiers" subtitle="One person's subscription covers the entire Discord server." />
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="p-3 text-left font-display font-normal">Feature</th>
                        {tierNames.map((n) => (
                          <th key={n} className="p-3 text-left font-display font-normal">{n}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tierRows.map((row) => (
                        <tr key={row.feature} className="border-t border-border">
                          <td className="p-3 text-muted-foreground">{row.feature}</td>
                          {row.values.map((v, i) => (
                            <td key={i} className="p-3">
                              {v === "✓" ? <Check className="h-4 w-4 text-gold" /> : v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Link your account: get a code on the website, then type <Cmd>/account link YOUR-CODE</Cmd> in Discord.</p>
                  <p>Check your tier: <Cmd>/account status</Cmd></p>
                </div>
                <Button asChild variant="outline" className="border-gold/50 text-gold hover:bg-gold/10">
                  <a href="/dashboard">Manage your subscription</a>
                </Button>
              </div>
            )}

            {active === "faq" && (
              <div className="space-y-4">
                <SectionHeader icon={HelpCircle} title="Frequently Asked Questions" />
                {[
                  { q: "Does the bot record audio permanently?", a: "Audio is processed for transcription and then stored securely. Only your server's members can access the resulting summaries and art." },
                  { q: "Can I use the bot in multiple servers?", a: "Yes. The bot works in any server. Each server needs at least one person to link their subscription, so link your account in each server you want to use it in." },
                  { q: "What if I'm not the DM?", a: "Players can register characters, upload reference art, and view summaries. Only DM-specific features (coaching, session prep) are restricted to the DM." },
                  { q: "Can I have multiple campaigns in one server?", a: "Yes. Use /campaign create to add campaigns and /campaign select to switch between them. Each campaign has its own characters, sessions, homebrew, and history." },
                  { q: "How long does processing take after a session?", a: "Usually 1–3 minutes depending on session length. You'll see progress updates in the Discord channel." },
                  { q: "What voice channels does it support?", a: "Any standard Discord voice channel. Stage channels are not currently supported." },
                ].map((f) => (
                  <div key={f.q} className="rounded-md border border-border p-4">
                    <h4 className="mb-1 font-display text-base text-gold-light">{f.q}</h4>
                    <p className="text-sm text-muted-foreground">{f.a}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Badge variant="outline" className="mt-8 border-gold/30 text-muted-foreground">
        Need more help? Reach out in our Discord support server.
      </Badge>
    </div>
  );
}