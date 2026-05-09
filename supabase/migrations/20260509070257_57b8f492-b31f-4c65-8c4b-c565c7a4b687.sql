ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS discord_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS discord_token_expires_at TIMESTAMPTZ;