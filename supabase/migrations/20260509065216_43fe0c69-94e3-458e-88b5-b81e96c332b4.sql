CREATE TABLE public.discord_account_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  guild_id TEXT NOT NULL,
  discord_user_id TEXT,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, guild_id)
);

ALTER TABLE public.discord_account_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own account links"
ON public.discord_account_links FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own account links"
ON public.discord_account_links FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on account links"
ON public.discord_account_links FOR ALL TO service_role
USING (true) WITH CHECK (true);

CREATE INDEX idx_discord_account_links_user_guild ON public.discord_account_links(user_id, guild_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.discord_account_links;
ALTER TABLE public.discord_account_links REPLICA IDENTITY FULL;