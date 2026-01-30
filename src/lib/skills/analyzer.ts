// AI 分析 Skills - 判断对用户是否有用

import type { SkillInfo } from "./scraper";

export interface SkillAnalysis {
  id: number;
  name: string;
  summary: string;
  what_it_does: string;
  usefulness: "high" | "medium" | "low";
  usefulness_reason: string;
  use_cases: string[];
  install_command: string;
}

const SYSTEM_PROMPT = `你是一个 Claude Code Skills 分析师，帮用户判断每个 Skill 是否有用。

用户背景：
- 专业领域：Data Science, AI/ML Learning, Data Analysis, Full-stack
- 熟悉语言：Python, TypeScript, JavaScript
- 兴趣方向：机器学习、数据分析、爬虫自动化、Web 开发、效率工具

回复格式必须是严格的 JSON：
{
  "summary": "一句话总结（15字内）",
  "what_it_does": "这个 Skill 的功能（30-50字）",
  "usefulness": "high/medium/low",
  "usefulness_reason": "对你有用的原因（20字）",
  "use_cases": ["使用场景1", "使用场景2"]
}

判断标准：
- high: AI/ML、数据分析、爬虫、开发效率相关
- medium: 前端、后端、工具类
- low: 与用户方向无关`;

export async function analyzeSkill(skill: SkillInfo): Promise<SkillAnalysis | null> {
  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || "claude-opus-4-5-thinking";

  if (!baseUrl || !apiKey) {
    console.error("AI_BASE_URL or AI_API_KEY not configured");
    return null;
  }

  const userPrompt = `分析这个 Claude Code Skill：

名称：${skill.name}
描述：${skill.description}
来源：${skill.source}
作者：${skill.author}

请判断对用户是否有用。`;

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
        max_tokens: 512,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const analysis = JSON.parse(jsonMatch[0]);

    return {
      id: skill.id,
      name: skill.name,
      summary: analysis.summary,
      what_it_does: analysis.what_it_does,
      usefulness: analysis.usefulness || "medium",
      usefulness_reason: analysis.usefulness_reason,
      use_cases: analysis.use_cases || [],
      install_command: `curl -o ~/.claude/skills/${skill.name}.md ${skill.install_url || skill.url}`,
    };
  } catch (error) {
    console.error("Failed to analyze skill:", error);
    return null;
  }
}

export async function analyzeSkills(
  skills: SkillInfo[],
  onProgress?: (current: number, total: number, name: string) => void
): Promise<SkillAnalysis[]> {
  const results: SkillAnalysis[] = [];

  for (let i = 0; i < skills.length; i++) {
    const skill = skills[i];
    onProgress?.(i + 1, skills.length, skill.name);

    const analysis = await analyzeSkill(skill);
    if (analysis) {
      results.push(analysis);
    }

    // 避免限流
    if (i < skills.length - 1) {
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  return results;
}
