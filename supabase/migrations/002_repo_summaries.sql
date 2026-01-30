-- 创建 repo_summaries 表存储 AI 生成的总结
-- 在 Supabase SQL Editor 中运行此脚本

CREATE TABLE IF NOT EXISTS repo_summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  repo_name TEXT UNIQUE NOT NULL,
  summary TEXT NOT NULL,
  what_it_does TEXT NOT NULL,
  core_features TEXT[] DEFAULT '{}',
  why_useful TEXT,
  use_cases TEXT[] DEFAULT '{}',
  tech_stack TEXT[] DEFAULT '{}',
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  recommendation TEXT CHECK (recommendation IN ('high', 'medium', 'low')),
  recommendation_reason TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_repo_summaries_repo_name ON repo_summaries(repo_name);
CREATE INDEX IF NOT EXISTS idx_repo_summaries_recommendation ON repo_summaries(recommendation);

-- 启用 RLS
ALTER TABLE repo_summaries ENABLE ROW LEVEL SECURITY;

-- 允许公开读取
CREATE POLICY "Allow public read" ON repo_summaries
  FOR SELECT USING (true);

-- 允许服务角色写入
CREATE POLICY "Allow service role write" ON repo_summaries
  FOR ALL USING (auth.role() = 'service_role');
