-- GitHub Trending Tracker Schema
-- Run this in Supabase SQL Editor

-- 1. Trending Repos Table
CREATE TABLE IF NOT EXISTS trending_repos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  repo_name TEXT NOT NULL,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  language TEXT,
  language_color TEXT,
  stars INTEGER DEFAULT 0,
  stars_today INTEGER DEFAULT 0,
  forks INTEGER DEFAULT 0,
  trending_date DATE NOT NULL,
  rank INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(repo_name, trending_date)
);

-- 2. User Favorites Table
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  repo_name TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, repo_name)
);

-- 3. Notification Settings Table
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'anonymous',
  wechat_webhook_url TEXT,
  wechat_enabled BOOLEAN DEFAULT FALSE,
  languages TEXT[] DEFAULT '{}',
  min_stars INTEGER DEFAULT 0,
  notify_time TIME DEFAULT '09:00:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- 4. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_trending_repos_date ON trending_repos(trending_date);
CREATE INDEX IF NOT EXISTS idx_trending_repos_language ON trending_repos(language);
CREATE INDEX IF NOT EXISTS idx_trending_repos_date_rank ON trending_repos(trending_date, rank);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);

-- 5. RLS Policies (Optional - for public access)
ALTER TABLE trending_repos ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access to trending repos
CREATE POLICY "Allow public read access to trending_repos"
  ON trending_repos FOR SELECT
  USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access to trending_repos"
  ON trending_repos FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to user_favorites"
  ON user_favorites FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to notification_settings"
  ON notification_settings FOR ALL
  USING (auth.role() = 'service_role');

-- 6. Updated_at trigger for notification_settings
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
