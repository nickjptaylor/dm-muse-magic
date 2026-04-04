
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS discord_access_token text,
ADD COLUMN IF NOT EXISTS discord_guilds jsonb,
ADD COLUMN IF NOT EXISTS selected_guild_id text;
