# GitHub Trending Tracker - 架构设计文档

## 📋 项目概述

每日自动抓取 GitHub Trending 前 20 项目，通过 Web UI 展示，支持语言筛选、收藏、微信通知、一键克隆。

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel (Hosting)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  Cron Job   │    │  Next.js    │    │  API Routes │         │
│  │  (Daily)    │───▶│  App Router │◀───│  /api/*     │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                  │                  │                 │
│         ▼                  ▼                  ▼                 │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              React Components (Client)               │       │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐             │       │
│  │  │RepoCard │  │RepoList │  │LangFilter│             │       │
│  │  └─────────┘  └─────────┘  └─────────┘             │       │
│  └─────────────────────────────────────────────────────┘       │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              Zustand (State Management)              │       │
│  │  ┌─────────────┐      ┌─────────────┐               │       │
│  │  │FavoriteStore│      │FilterStore  │               │       │
│  │  └─────────────┘      └─────────────┘               │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Supabase (PostgreSQL)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ trending_repos  │  │ user_favorites  │  │notification_set │ │
│  │                 │  │                 │  │     tings       │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐            ┌─────────────────┐            │
│  │ GitHub Trending │            │  WeChat Webhook │            │
│  │   (Scraping)    │            │  (Notification) │            │
│  └─────────────────┘            └─────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 目录结构

```
github-trending-tracker/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # 首页
│   │   ├── layout.tsx                # 根布局
│   │   ├── globals.css               # 全局样式
│   │   └── api/                      # API 路由
│   │       ├── trending/route.ts     # GET /api/trending
│   │       └── cron/
│   │           ├── fetch/route.ts    # GET /api/cron/fetch
│   │           └── notify/route.ts   # GET /api/cron/notify
│   │
│   ├── components/                   # React 组件
│   │   ├── ui/                       # 基础 UI 组件
│   │   │   ├── button.tsx
│   │   │   └── card.tsx
│   │   └── trending/                 # 业务组件
│   │       ├── repo-card.tsx         # 仓库卡片
│   │       ├── repo-list.tsx         # 仓库列表
│   │       └── language-filter.tsx   # 语言筛选器
│   │
│   ├── lib/                          # 核心库
│   │   ├── supabase/client.ts        # Supabase 客户端
│   │   ├── scraper/github-trending.ts # GitHub 爬虫
│   │   ├── notify/wechat-bot.ts      # 微信通知
│   │   ├── types.ts                  # TypeScript 类型
│   │   └── utils.ts                  # 工具函数
│   │
│   └── stores/                       # 状态管理
│       ├── favorite-store.ts         # 收藏状态
│       └── filter-store.ts           # 筛选状态
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql    # 数据库 Schema
│
├── docs/
│   └── ARCHITECTURE.md               # 本文档
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── vercel.json                       # Cron 配置
└── .env.example                      # 环境变量模板
```

---

## 🗄️ 数据库设计

### trending_repos (Trending 仓库)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| repo_name | TEXT | 仓库全名 (owner/name) |
| owner | TEXT | 仓库所有者 |
| name | TEXT | 仓库名称 |
| description | TEXT | 描述 |
| url | TEXT | GitHub URL |
| language | TEXT | 编程语言 |
| language_color | TEXT | 语言颜色 |
| stars | INTEGER | 总 Star 数 |
| stars_today | INTEGER | 今日 Star 数 |
| forks | INTEGER | Fork 数 |
| trending_date | DATE | Trending 日期 |
| rank | INTEGER | 排名 (1-20) |
| created_at | TIMESTAMPTZ | 创建时间 |

**唯一约束**: `(repo_name, trending_date)`

### user_favorites (用户收藏)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | TEXT | 用户 ID |
| repo_name | TEXT | 仓库全名 |
| repo_url | TEXT | GitHub URL |
| notes | TEXT | 备注 |
| created_at | TIMESTAMPTZ | 创建时间 |

### notification_settings (通知设置)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | TEXT | 用户 ID |
| wechat_webhook_url | TEXT | 企业微信 Webhook |
| wechat_enabled | BOOLEAN | 是否启用 |
| languages | TEXT[] | 关注的语言 |
| min_stars | INTEGER | 最小 Star 数 |
| notify_time | TIME | 通知时间 |

---

## 🔄 数据流程

### 1. 每日抓取流程

```
Vercel Cron (09:00 UTC)
        │
        ▼
GET /api/cron/fetch
        │
        ▼
scrapeGitHubTrending()
        │ 使用 Cheerio 解析 HTML
        ▼
获取前 20 个 Trending 仓库
        │
        ▼
Supabase.upsert(trending_repos)
        │ 按 (repo_name, trending_date) 去重
        ▼
完成 ✓
```

### 2. 用户查看流程

```
用户访问首页
        │
        ▼
React useEffect → fetch /api/trending
        │
        ▼
Supabase.select(trending_repos)
        │ 按 date/language 筛选
        ▼
渲染 RepoList → RepoCard[]
        │
        ▼
用户交互：
  ├─ 收藏 → useFavoriteStore.toggleFavorite()
  ├─ 克隆 → copyToClipboard(git clone URL)
  └─ 筛选 → useFilterStore.setLanguage()
```

### 3. 通知流程

```
Vercel Cron (10:00 UTC)
        │
        ▼
GET /api/cron/notify
        │
        ▼
Supabase.select(notification_settings)
        │ 筛选 wechat_enabled = true
        ▼
Supabase.select(trending_repos)
        │ 今日数据，按用户偏好过滤
        ▼
sendWeChatNotification()
        │ POST 到企业微信 Webhook
        ▼
完成 ✓
```

---

## 🧩 核心模块

### 1. GitHub Scraper (`src/lib/scraper/github-trending.ts`)

```typescript
// 核心函数
export async function scrapeGitHubTrending(language?: string): Promise<ScrapedRepo[]>

// 解析逻辑：
// 1. fetch('https://github.com/trending')
// 2. cheerio.load(html)
// 3. 解析 article.Box-row 元素
// 4. 提取: repo_name, stars, forks, language, description
```

### 2. Zustand Store (`src/stores/`)

```typescript
// favorite-store.ts
interface FavoriteStore {
  favorites: Set<string>;
  toggleFavorite: (repoName: string) => void;
  isFavorite: (repoName: string) => boolean;
}

// filter-store.ts
interface FilterStore {
  selectedLanguage: string | null;
  selectedDate: string;
  setLanguage: (language: string | null) => void;
}
```

### 3. WeChat Bot (`src/lib/notify/wechat-bot.ts`)

```typescript
// 发送通知
export async function sendWeChatNotification(
  webhookUrl: string,
  repos: TrendingRepoForNotify[]
): Promise<boolean>

// 测试 Webhook
export async function testWeChatWebhook(webhookUrl: string): Promise<boolean>
```

---

## 🔐 安全设计

### API 认证

```typescript
// Cron API 使用 Bearer Token 认证
const authHeader = request.headers.get("authorization");
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### 环境变量

| 变量 | 用途 | 公开 |
|------|------|------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase URL | ✓ |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase 匿名 Key | ✓ |
| SUPABASE_SERVICE_ROLE_KEY | Supabase 管理 Key | ✗ |
| CRON_SECRET | Cron 认证密钥 | ✗ |

### RLS 策略

```sql
-- 公开读取 trending_repos
CREATE POLICY "Allow public read" ON trending_repos FOR SELECT USING (true);

-- 仅 service_role 可写入
CREATE POLICY "Allow service role" ON trending_repos FOR ALL
  USING (auth.role() = 'service_role');
```

---

## 📊 性能优化

### 1. 数据库索引

```sql
CREATE INDEX idx_trending_repos_date ON trending_repos(trending_date);
CREATE INDEX idx_trending_repos_language ON trending_repos(language);
CREATE INDEX idx_trending_repos_date_rank ON trending_repos(trending_date, rank);
```

### 2. 客户端缓存

- Zustand persist: 收藏数据持久化到 localStorage
- Next.js 缓存: API 路由默认缓存策略

### 3. 请求优化

- 只加载前 20 条数据
- 按需筛选，避免全表扫描

---

## 🚀 部署配置

### Vercel Cron Jobs (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/cron/fetch",
      "schedule": "0 9 * * *"   // 每日 09:00 UTC
    },
    {
      "path": "/api/cron/notify",
      "schedule": "0 10 * * *"  // 每日 10:00 UTC
    }
  ]
}
```

### 环境变量配置

在 Vercel Dashboard → Settings → Environment Variables 添加：

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `CRON_SECRET`

---

## 🔮 扩展计划

### Phase 2 (待实现)

- [ ] 用户认证 (Supabase Auth)
- [ ] 收藏同步到数据库
- [ ] 设置页面 UI
- [ ] 日期选择器

### Phase 3 (待实现)

- [ ] 历史数据趋势图
- [ ] 邮件通知
- [ ] Telegram 通知
- [ ] 多语言支持

---

## 📚 参考资料

- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Cheerio](https://cheerio.js.org/)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [企业微信机器人](https://developer.work.weixin.qq.com/document/path/91770)
