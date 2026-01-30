# GitHub Trending Tracker - 项目总结

## 项目概述

每日自动抓取 GitHub Trending 前 20 项目，通过 Web UI 展示，支持语言筛选、收藏、通知、一键克隆。

---

## 技术栈总览

| 技术 | 用途 | 为什么选它 |
|------|------|-----------|
| **Next.js 15** | 全栈框架 | App Router、API Routes、SSR |
| **React 19** | UI 库 | 最新特性、组件化 |
| **TypeScript** | 类型安全 | 减少 Bug、IDE 提示 |
| **Tailwind CSS** | 样式 | 快速开发、响应式 |
| **Supabase** | 数据库 | PostgreSQL、免费额度、实时订阅 |
| **Zustand** | 状态管理 | 轻量、简单、支持持久化 |
| **Cheerio** | HTML 解析 | 服务端爬虫、jQuery 语法 |
| **Zod** | 数据验证 | 类型安全的输入校验 |
| **Vercel** | 部署 | 免费、Cron Jobs、自动 CI/CD |

---

## 核心文件说明

### 🕷️ 爬虫模块

| 文件 | 作用 |
|------|------|
| `src/lib/scraper/github-trending.ts` | **核心爬虫**：使用 Cheerio 解析 GitHub Trending 页面，提取仓库名、Star、Fork、语言等信息 |

```typescript
// 核心函数
scrapeGitHubTrending(language?: string): Promise<ScrapedRepo[]>
```

### 🗄️ 数据库模块

| 文件 | 作用 |
|------|------|
| `src/lib/supabase/client.ts` | Supabase 客户端，区分前端（anon key）和后端（service role） |
| `supabase/migrations/001_initial_schema.sql` | 数据库表结构：trending_repos、user_favorites、notification_settings |

### 🌐 API 路由

| 文件 | 端点 | 作用 |
|------|------|------|
| `src/app/api/trending/route.ts` | `GET /api/trending` | 查询 Trending 数据，支持日期和语言筛选 |
| `src/app/api/cron/fetch/route.ts` | `GET /api/cron/fetch` | Cron 任务：抓取 GitHub Trending 并存入数据库 |
| `src/app/api/cron/notify/route.ts` | `GET /api/cron/notify` | Cron 任务：发送通知 |

### 🎨 UI 组件

| 文件 | 作用 |
|------|------|
| `src/app/page.tsx` | 首页：展示 Trending 列表 |
| `src/components/trending/repo-card.tsx` | 仓库卡片：显示名称、描述、Star、Fork、语言、收藏按钮、克隆按钮 |
| `src/components/trending/repo-list.tsx` | 仓库列表：渲染多个 RepoCard |
| `src/components/trending/language-filter.tsx` | 语言筛选器：Python/JS/TS/Go/Rust 等按钮 |
| `src/components/ui/button.tsx` | Button 组件（基于 CVA） |
| `src/components/ui/card.tsx` | Card 组件 |

### 📦 状态管理

| 文件 | 作用 |
|------|------|
| `src/stores/favorite-store.ts` | 收藏状态：使用 Zustand + localStorage 持久化 |
| `src/stores/filter-store.ts` | 筛选状态：当前选择的语言和日期 |

### 🔔 通知模块

| 文件 | 作用 |
|------|------|
| `src/lib/notify/wechat-bot.ts` | 企业微信机器人通知（Webhook） |

### 🛠️ 工具函数

| 文件 | 作用 |
|------|------|
| `src/lib/utils.ts` | 通用工具：cn()、formatNumber()、copyToClipboard() |
| `src/lib/types.ts` | TypeScript 类型定义 |

---

## 数据库表结构

### trending_repos（Trending 仓库）

```sql
id, repo_name, owner, name, description, url,
language, language_color, stars, stars_today, forks,
trending_date, rank, created_at
```

### user_favorites（用户收藏）

```sql
id, user_id, repo_name, repo_url, notes, created_at
```

### notification_settings（通知设置）

```sql
id, user_id, wechat_webhook_url, wechat_enabled,
languages[], min_stars, notify_time, created_at, updated_at
```

---

## 安全措施

| 措施 | 说明 |
|------|------|
| **CRON_SECRET 认证** | Cron API 需要 Bearer Token 才能访问 |
| **Zod 输入验证** | API 参数经过严格校验，防止注入 |
| **RLS 策略** | Supabase 行级安全，公开只读 trending_repos |
| **SSR 安全检查** | Zustand store 检查 window 环境 |
| **环境变量分离** | 敏感 key 不暴露到前端 |

---

## Vercel 部署步骤

### 方式一：命令行部署

```bash
cd /Users/zhishengzhang/Projects/github-trending-tracker

# 1. 登录 Vercel
vercel login

# 2. 部署（首次会创建项目）
vercel

# 3. 按提示选择：
#    - Set up and deploy? Yes
#    - Which scope? 选择你的账户
#    - Link to existing project? No
#    - Project name? github-trending-tracker
#    - Directory? ./
#    - Override settings? No

# 4. 部署生产环境
vercel --prod
```

### 方式二：GitHub 自动部署

1. 打开 https://vercel.com
2. 点击 **Add New** → **Project**
3. 选择 **Import Git Repository**
4. 选择 `github-trending-tracker` 仓库
5. 点击 **Deploy**

### 配置环境变量

在 Vercel Dashboard → Project Settings → Environment Variables 添加：

| 变量名 | 值 |
|--------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxx.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJ... |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJ... |
| `CRON_SECRET` | 你的密钥 |

### Cron Jobs 配置

`vercel.json` 已配置好：

```json
{
  "crons": [
    { "path": "/api/cron/fetch", "schedule": "0 9 * * *" },   // 每日 17:00 北京时间
    { "path": "/api/cron/notify", "schedule": "0 10 * * *" }  // 每日 18:00 北京时间
  ]
}
```

> 注意：Vercel Cron 使用 UTC 时间，北京时间 = UTC + 8

---

## 个人微信通知方案

由于你是**个人微信**（不是企业微信），有以下方案：

### 方案一：Server 酱（推荐）

1. 访问 https://sct.ftqq.com/
2. 用微信扫码登录
3. 获取 **SendKey**
4. 调用 API 发送消息

```typescript
// 修改 src/lib/notify/wechat-bot.ts
export async function sendServerChanNotification(
  sendKey: string,
  title: string,
  content: string
): Promise<boolean> {
  const url = `https://sctapi.ftqq.com/${sendKey}.send`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ title, desp: content }),
  });

  const result = await response.json();
  return result.code === 0;
}
```

### 方案二：PushPlus

1. 访问 https://www.pushplus.plus/
2. 微信扫码关注公众号
3. 获取 **Token**
4. 调用 API 发送消息

```typescript
export async function sendPushPlusNotification(
  token: string,
  title: string,
  content: string
): Promise<boolean> {
  const response = await fetch("https://www.pushplus.plus/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      title,
      content,
      template: "markdown",
    }),
  });

  const result = await response.json();
  return result.code === 200;
}
```

### 方案三：Bark（iOS 推荐）

1. App Store 下载 **Bark**
2. 打开获取推送 URL
3. 调用 API 发送

```typescript
export async function sendBarkNotification(
  barkUrl: string,  // 如: https://api.day.app/xxxx
  title: string,
  body: string
): Promise<boolean> {
  const response = await fetch(`${barkUrl}/${encodeURIComponent(title)}/${encodeURIComponent(body)}`);
  return response.ok;
}
```

---

## 功能清单

| 功能 | 状态 | 说明 |
|------|------|------|
| ✅ 每日抓取 | 完成 | Vercel Cron 每日 17:00 执行 |
| ✅ Web UI | 完成 | 响应式设计，支持移动端 |
| ✅ 语言筛选 | 完成 | Python/JS/TS/Go/Rust/Java/C++ 等 |
| ✅ 收藏管理 | 完成 | localStorage 持久化 |
| ✅ 一键克隆 | 完成 | 复制 git clone 命令 |
| ✅ 数据库存储 | 完成 | Supabase PostgreSQL |
| ✅ 安全认证 | 完成 | Cron API 需要 Bearer Token |
| ⏳ 个人微信通知 | 待配置 | 选择 Server酱/PushPlus/Bark |
| ⏳ 历史数据查看 | 待开发 | 日期选择器 |
| ⏳ 用户登录 | 待开发 | Supabase Auth |

---

## 本地开发命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 手动触发抓取
curl -H "Authorization: Bearer 你的CRON_SECRET" http://localhost:3000/api/cron/fetch

# 部署到 Vercel
vercel --prod
```

---

## 项目链接

- **GitHub**: https://github.com/JacksonZZS/github-trending-tracker
- **本地开发**: http://localhost:3000
- **Supabase**: https://supabase.com/dashboard

---

## 未来扩展方向

1. **多平台通知** - 支持 Telegram、邮件、飞书
2. **用户系统** - Supabase Auth 登录，云端同步收藏
3. **历史趋势** - 图表展示仓库 Star 增长趋势
4. **RSS 订阅** - 生成 RSS Feed
5. **关键词订阅** - 监控特定关键词的新项目
6. **AI 摘要** - 用 LLM 生成项目简介

---

## 学到的技术点

| 技术点 | 学到什么 |
|--------|---------|
| Next.js App Router | 文件系统路由、Server Components、API Routes |
| Supabase | PostgreSQL 托管、RLS 安全策略、实时订阅 |
| Cheerio | 服务端 HTML 解析、jQuery 选择器语法 |
| Zustand | 轻量状态管理、中间件（persist） |
| Zod | 运行时类型验证、与 TypeScript 集成 |
| Vercel Cron | 定时任务、Serverless 函数 |
| Tailwind CSS | 原子化 CSS、响应式设计 |
| CVA | 组件变体管理（class-variance-authority） |

---

*文档生成时间: 2026-01-30*
