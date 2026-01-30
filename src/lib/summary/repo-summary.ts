// AI 生成项目总结的工具函数
// 用于生成每日 GitHub Trending 项目的中文摘要

interface RepoForSummary {
  repo_name: string;
  description: string | null;
  language: string | null;
  stars: number;
  stars_today: number;
  url: string;
}

interface RepoSummary {
  repo_name: string;
  summary: string;
  usefulness: "high" | "medium" | "low";
  usefulnessReason: string;
  tags: string[];
}

// 用户专业领域配置
const USER_INTERESTS = {
  primary: ["Data Science", "AI/ML Learning", "Data Analysis", "Full-stack"],
  languages: ["Python", "TypeScript", "JavaScript"],
  keywords: ["machine learning", "data", "analytics", "visualization", "api", "web", "nextjs", "react"],
};

export function generateRepoSummary(repo: RepoForSummary): RepoSummary {
  const description = repo.description?.toLowerCase() || "";
  const name = repo.repo_name.toLowerCase();

  // 判断对用户的有用程度
  let usefulness: "high" | "medium" | "low" = "low";
  let usefulnessReason = "";
  const tags: string[] = [];

  // 检查语言匹配
  if (repo.language && USER_INTERESTS.languages.includes(repo.language)) {
    tags.push(repo.language);
  }

  // 检查关键词匹配
  const matchedKeywords = USER_INTERESTS.keywords.filter(
    (kw) => description.includes(kw) || name.includes(kw)
  );

  // AI/ML 相关
  if (
    description.includes("machine learning") ||
    description.includes("ai") ||
    description.includes("llm") ||
    description.includes("neural") ||
    description.includes("model") ||
    description.includes("transformer")
  ) {
    usefulness = "high";
    usefulnessReason = "AI/ML 相关，符合你的学习方向";
    tags.push("AI/ML");
  }

  // 数据分析相关
  if (
    description.includes("data") ||
    description.includes("analytics") ||
    description.includes("visualization") ||
    description.includes("pandas") ||
    description.includes("dashboard")
  ) {
    usefulness = usefulness === "high" ? "high" : "high";
    usefulnessReason = usefulnessReason || "数据分析相关，符合你的专业";
    tags.push("Data");
  }

  // 前端/全栈相关
  if (
    description.includes("react") ||
    description.includes("next") ||
    description.includes("vue") ||
    description.includes("frontend") ||
    description.includes("ui") ||
    description.includes("component")
  ) {
    usefulness = usefulness === "low" ? "medium" : usefulness;
    usefulnessReason = usefulnessReason || "前端开发相关";
    tags.push("Frontend");
  }

  // API/后端相关
  if (
    description.includes("api") ||
    description.includes("backend") ||
    description.includes("server") ||
    description.includes("database")
  ) {
    usefulness = usefulness === "low" ? "medium" : usefulness;
    usefulnessReason = usefulnessReason || "后端开发相关";
    tags.push("Backend");
  }

  // 爬虫/自动化
  if (
    description.includes("scraper") ||
    description.includes("crawler") ||
    description.includes("automation") ||
    description.includes("bot")
  ) {
    usefulness = "high";
    usefulnessReason = "爬虫/自动化相关，可用于你的项目";
    tags.push("Automation");
  }

  // 工具类
  if (
    description.includes("cli") ||
    description.includes("tool") ||
    description.includes("utility")
  ) {
    usefulness = usefulness === "low" ? "medium" : usefulness;
    usefulnessReason = usefulnessReason || "开发工具，可能提升效率";
    tags.push("Tool");
  }

  // 默认情况
  if (!usefulnessReason) {
    usefulnessReason = "暂时与你的主要方向关联不大";
  }

  // 生成中文摘要
  const summary = generateChineseSummary(repo);

  return {
    repo_name: repo.repo_name,
    summary,
    usefulness,
    usefulnessReason,
    tags,
  };
}

function generateChineseSummary(repo: RepoForSummary): string {
  if (!repo.description) {
    return "暂无描述";
  }

  // 简单翻译/总结常见词汇
  let summary = repo.description;

  // 常见英文词汇的中文映射
  const translations: Record<string, string> = {
    "a powerful": "强大的",
    "lightweight": "轻量级",
    "fast": "快速",
    "simple": "简单",
    "easy to use": "易用的",
    "open source": "开源",
    "framework": "框架",
    "library": "库",
    "tool": "工具",
    "cli": "命令行工具",
    "api": "API",
    "machine learning": "机器学习",
    "deep learning": "深度学习",
    "neural network": "神经网络",
    "data": "数据",
    "visualization": "可视化",
    "dashboard": "仪表盘",
    "web": "网页",
    "app": "应用",
    "mobile": "移动端",
    "desktop": "桌面端",
    "cross-platform": "跨平台",
  };

  // 返回原描述（后续可接入 LLM 做真正翻译）
  return summary;
}

export function formatDailySummary(repos: RepoForSummary[]): string {
  const summaries = repos.map(generateRepoSummary);

  const highUsefulness = summaries.filter((s) => s.usefulness === "high");
  const mediumUsefulness = summaries.filter((s) => s.usefulness === "medium");

  let output = `# 📊 GitHub Trending 每日总结\n\n`;
  output += `> 日期: ${new Date().toLocaleDateString("zh-CN")}\n\n`;

  if (highUsefulness.length > 0) {
    output += `## ⭐ 高度推荐（与你的方向相关）\n\n`;
    highUsefulness.forEach((s, i) => {
      output += `### ${i + 1}. ${s.repo_name}\n`;
      output += `- **简介**: ${s.summary}\n`;
      output += `- **推荐理由**: ${s.usefulnessReason}\n`;
      output += `- **标签**: ${s.tags.join(", ") || "无"}\n\n`;
    });
  }

  if (mediumUsefulness.length > 0) {
    output += `## 📌 可以关注\n\n`;
    mediumUsefulness.forEach((s, i) => {
      output += `${i + 1}. **${s.repo_name}** - ${s.summary.slice(0, 60)}...\n`;
    });
    output += `\n`;
  }

  output += `## 📋 完整列表\n\n`;
  summaries.forEach((s, i) => {
    const icon = s.usefulness === "high" ? "⭐" : s.usefulness === "medium" ? "📌" : "📄";
    output += `${i + 1}. ${icon} **${s.repo_name}** - ${s.summary.slice(0, 50)}...\n`;
  });

  return output;
}
