import { supabase } from "@/integrations/supabase/client";

async function call<T>(
  path: string,
  params?: Record<string, string | number | undefined>,
  init?: { method?: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown }
): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not signed in");

  const search = new URLSearchParams({ path });
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      search.append(k, String(v));
    }
  }

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tavern-api?${search.toString()}`,
    {
      method: init?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    }
  );
  const text = await res.text();
  let body: unknown = {};
  if (text) {
    try { body = JSON.parse(text); } catch { body = { raw: text }; }
  }
  if (!res.ok) {
    const msg = (body as { error?: string })?.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return body as T;
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  guild_id: string;
  is_active: boolean;
  dm_discord_id: string | null;
  summary_mode: string | null;
  created_at: string;
}

export interface Character {
  id: string;
  name: string;
  race: string | null;
  character_class: string | null;
  level: number | null;
  description: string | null;
  discord_user_id: string | null;
}

export interface HomebrewItem {
  id: string;
  title: string;
  content: string;
  content_type: string;
}

export interface CampaignDetail extends Campaign {
  characters: Character[];
  homebrew: HomebrewItem[];
}

export type SessionStatus = "recording" | "processing" | "complete" | "failed" | string;

export interface SessionSummary {
  id: string;
  session_number: number;
  title: string | null;
  status: SessionStatus;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface KeyMomentArt {
  s3_url: string;
  provider: string;
  prompt_used: string;
}

export interface KeyMoment {
  id: string;
  description: string;
  scene_prompt: string | null;
  timestamp: string | null;
  discord_user_id: string | null;
  art: KeyMomentArt | null;
}

export interface SessionDetail extends SessionSummary {
  summary: {
    narrative_summary: string;
    dm_coaching_notes: string | null;
    key_moments: KeyMoment[];
  } | null;
}

export const tavernApi = {
  listCampaigns: (guildId: string) =>
    call<{ guild_id: string; campaigns: Campaign[] }>(`/api/campaigns/guild/${guildId}`),
  getCampaign: (campaignId: string) =>
    call<CampaignDetail>(`/api/campaigns/${campaignId}`),
  listSessions: (guildId: string, opts?: { limit?: number; offset?: number }) =>
    call<{ campaign_id: string; campaign_name: string; guild_id: string; sessions: SessionSummary[]; total: number }>(
      `/api/sessions/guild/${guildId}`,
      { limit: opts?.limit, offset: opts?.offset }
    ),
  getSession: (sessionId: string) => call<SessionDetail>(`/api/sessions/${sessionId}`),

  // DM Prep
  listThreads: (campaignId: string, status?: ThreadStatus) =>
    call<{ campaign_id: string; threads: StoryThread[]; total: number }>(
      `/api/dm-prep/threads/campaign/${campaignId}`,
      { status }
    ),
  updateThread: (threadId: string, status: ThreadStatus) =>
    call<StoryThread>(`/api/dm-prep/threads/${threadId}`, undefined, {
      method: "PATCH",
      body: { status },
    }),
  generateIntro: (campaignId: string, numSessions = 3) =>
    call<SessionIntro>(`/api/dm-prep/intros/generate/${campaignId}`, undefined, {
      method: "POST",
      body: { num_sessions: numSessions },
    }),
  listIntros: (campaignId: string) =>
    call<{ campaign_id: string; intros: SessionIntro[] }>(`/api/dm-prep/intros/campaign/${campaignId}`),
  suggestHooks: (campaignId: string) =>
    call<{ campaign_id: string; hooks: PlotHook[] }>(`/api/dm-prep/hooks/suggest/${campaignId}`, undefined, {
      method: "POST",
    }),
  listHooks: (campaignId: string, status?: HookStatus) =>
    call<{ campaign_id: string; hooks: PlotHook[] }>(`/api/dm-prep/hooks/campaign/${campaignId}`, { status }),
  updateHook: (hookId: string, status: HookStatus) =>
    call<PlotHook>(`/api/dm-prep/hooks/${hookId}`, undefined, { method: "PATCH", body: { status } }),
  prepNextSession: (campaignId: string) =>
    call<{ intro: SessionIntro | null; hooks: PlotHook[]; threads: StoryThread[] }>(
      `/api/dm-prep/prep/${campaignId}`,
      undefined,
      { method: "POST" }
    ),
};

export type ThreadStatus = "active" | "resolved" | "dismissed";
export type HookStatus = "suggested" | "pinned" | "dismissed" | "used";

export interface StoryThread {
  id: string;
  title: string;
  description: string;
  thread_type: string | null;
  status: ThreadStatus;
  source_session_id: string | null;
  created_at: string;
}

export interface SessionIntro {
  id: string;
  generated_text: string;
  created_at: string;
}

export interface PlotHook {
  id: string;
  title: string;
  description: string;
  hook_type: string | null;
  status: HookStatus;
  source_thread_id: string | null;
  created_at: string;
}