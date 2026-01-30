// AI 总结服务 - 使用本地 Antigravity (Claude) 生成项目分析

interface RepoInfo {
  repo_name: string;
  description: string | null;
  language: string | null;
  stars: number;
  stars_today: number;
  url: string;
}

export interface RepoAnalysis {
  repo_name: string;
  summary: string;           // 一句话总结
  what_it_does: string;      // 这个项目是做什么的
  core_features: string[];   // 核心功能
  why_useful: string;        // 为什么对你有用
  use_cases: string[];       // 使用场景
  tech_stack: string[];      // 相关技术栈
  difficulty: "beginner" | "intermediate" | "advanced";  // 上手难度
  recommendation: "high" | "medium" | "low";  // 推荐程度
  recommendation_reason: string;  // 推荐理由
  generated_at: string;
}

const SYSTEM_PROMPT = `你是一个专业的技术分析师，专门为以下用户分析 GitHub 开源项目：

用户背景：
- 专业领域：Data Science, AI/ML Learning, Data Analysis, Full-stack
- 熟悉语言：Python, TypeScript, JavaScript
- 兴趣方向：机器学习、数据分析、爬虫自动化、Web 开发

你的任务是分析 GitHub 项目，生成详细的中文分析报告。

回复格式必须是严格的 JSON，包含以下字段：
{
  "summary": "一句话总结（20字以内）",
  "what_it_does": "这个项目是做什么的（50-100字）",
  "core_features": ["核心功能1", "核心功能2", "核心功能3"],
  "why_useful": "为什么对这个用户有用（30-50字）",
  "use_cases": ["使用场景1", "使用场景2"],
  "tech_stack": ["技术1", "技术2"],
  "difficulty": "beginner/intermediate/advanced",
  "recommendation": "high/medium/low",
  "recommendation_reason": "推荐理由（20-30字）"
}

注意：
1. 所有内容用中文回复
2. 根据用户背景判断推荐程度
3. high = 强烈推荐（与用户方向高度相关）
4. medium = 值得关注（有一定相关性）
5. low = 一般（与用户方向关联不大）
6. 只返回 JSON，不要有其他内容`;

export async function generateRepoAnalysis(repo: RepoInfo): Promise<RepoAnalysis | null> {
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || "claude-opus-4-5-thinking";

  if (!baseUrl || !apiKey) {
    console.error("AI_BASE_URL or AI_API_KEY not configured");
    return null;
  }

  const userPrompt = `请分析这个 GitHub 项目：

项目名称：${repo.repo_name}
项目描述：${repo.description || "无描述"}
编程语言：${repo.language || "未知"}
Star 数：${repo.stars.toLocaleString()}
今日新增 Star：${repo.stars_today}
项目地址：${repo.url}

请生成详细的中文分析报告。`;

  try {
    const response = await fetch(`${baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      console.error("No content in AI response");
      return null;
    }

    // 解析 JSON 响应
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", content);
      return null;
    }

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      repo_name: repo.repo_name,
      summary: analysis.summary,
      what_it_does: analysis.what_it_does,
      core_features: analysis.core_features || [],
      why_useful: analysis.why_useful,
      use_cases: analysis.use_cases || [],
      tech_stack: analysis.tech_stack || [],
      difficulty: analysis.difficulty || "intermediate",
      recommendation: analysis.recommendation || "medium",
      recommendation_reason: analysis.recommendation_reason,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to generate analysis:", error);
    return null;
  }
}

export async function generateBatchAnalysis(
  repos: RepoInfo[],
  onProgress?: (current: number, total: number, repo: string) => void
): Promise<RepoAnalysis[]> {
  const results: RepoAnalysis[] = [];

  for (let i = 0; i < repos.length; i++) {
    const repo = repos[i];
    onProgress?.(i + 1, repos.length, repo.repo_name);

    const analysis = await generateRepoAnalysis(repo);
    if (analysis) {
      results.push(analysis);
    }

    // 避免 API 限流，每个请求间隔 1 秒
    if (i < repos.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}
