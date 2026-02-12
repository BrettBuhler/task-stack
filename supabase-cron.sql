-- =============================================================
-- Email Preferences table + pg_cron setup for Task Stack digests
-- =============================================================

-- 1. Create email_preferences table
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  custom_cron TEXT,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id)
);

-- RLS policies for email_preferences
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own email preferences"
  ON email_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own email preferences"
  ON email_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email preferences"
  ON email_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at trigger
CREATE TRIGGER email_preferences_updated_at
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 3. Schedule the digest cron job to run every hour
-- Replace YOUR_APP_URL and YOUR_DIGEST_API_KEY with actual values
SELECT cron.schedule(
  'send-task-digest',
  '0 * * * *', -- every hour at minute 0
  $$
  SELECT net.http_post(
    url := 'YOUR_APP_URL/api/send-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-api-key', 'YOUR_DIGEST_API_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To remove the job:
-- SELECT cron.unschedule('send-task-digest');
