// Server酱推送服务
// 文档: https://sct.ftqq.com/

interface TrendingRepoForNotify {
  repo_name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  stars_today: number;
}

interface RepoSummary {
  repo_name: string;
  summary: string;
  what_it_does?: string;
  core_features?: string[];
  why_useful?: string;
  use_cases?: string[];
  tech_stack?: string[];
  recommendation: string;
  recommendation_reason: string;
}

export async function sendServerChanNotification(
  sendKey: string,
  repos: TrendingRepoForNotify[],
  summaries?: RepoSummary[]
): Promise<boolean> {
  const { title, desp } = formatMessage(repos, summaries);

  const url = `https://sctapi.ftqq.com/${sendKey}.send`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ title, desp }),
    });

    if (!response.ok) {
      console.error("Server酱推送失败:", await response.text());
      return false;
    }

    const result = await response.json();
    return result.code === 0;
  } catch (error) {
    console.error("Server酱推送错误:", error);
    return false;
  }
}

function formatMessage(
  repos: TrendingRepoForNotify[],
  summaries?: RepoSummary[]
): { title: string; desp: string } {
  const date = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const summaryMap = new Map(summaries?.map((s) => [s.repo_name, s]) || []);

  const title = `🔥 GitHub Trending ${date}`;

  let desp = `# 🔥 GitHub Trending 每日推送\n\n`;
  desp += `> ${date}\n\n`;

  // 高度推荐的项目 - 详细展示
  const highRecommended = repos.filter((r) => {
    const s = summaryMap.get(r.repo_name);
    return s?.recommendation === "high";
  });

  if (highRecommended.length > 0) {
    desp += `---\n\n`;
    desp += `## ⭐ 高度推荐（与你的方向相关）\n\n`;

    highRecommended.forEach((repo) => {
      const summary = summaryMap.get(repo.repo_name);

      desp += `### 🌟 ${repo.repo_name}\n\n`;
      desp += `**${formatStars(repo.stars)}** stars (+${repo.stars_today} today)`;
      if (repo.language) desp += ` · ${repo.language}`;
      desp += `\n\n`;

      if (summary) {
        desp += `**📝 一句话总结：** ${summary.summary}\n\n`;

        if (summary.what_it_does) {
          desp += `**🎯 这个项目是做什么的：**\n${summary.what_it_does}\n\n`;
        }

        if (summary.core_features && summary.core_features.length > 0) {
          desp += `**✨ 核心功能：**\n`;
          summary.core_features.forEach((f) => {
            desp += `- ${f}\n`;
          });
          desp += `\n`;
        }

        if (summary.why_useful) {
          desp += `**💡 为什么对你有用：**\n${summary.why_useful}\n\n`;
        }

        if (summary.use_cases && summary.use_cases.length > 0) {
          desp += `**🔧 使用场景：** ${summary.use_cases.join("、")}\n\n`;
        }

        if (summary.tech_stack && summary.tech_stack.length > 0) {
          desp += `**🛠️ 技术栈：** ${summary.tech_stack.join("、")}\n\n`;
        }

        desp += `**🎖️ 推荐理由：** ${summary.recommendation_reason}\n\n`;
      }

      desp += `👉 [查看项目](${repo.url})\n\n`;
      desp += `---\n\n`;
    });
  }

  // 值得关注的项目
  const mediumRecommended = repos.filter((r) => {
    const s = summaryMap.get(r.repo_name);
    return s?.recommendation === "medium";
  });

  if (mediumRecommended.length > 0) {
    desp += `## 📌 值得关注\n\n`;

    mediumRecommended.forEach((repo) => {
      const summary = summaryMap.get(repo.repo_name);

      desp += `### ${repo.repo_name}\n\n`;
      desp += `**${formatStars(repo.stars)}** stars (+${repo.stars_today} today)`;
      if (repo.language) desp += ` · ${repo.language}`;
      desp += `\n\n`;

      if (summary) {
        desp += `**简介：** ${summary.summary}\n\n`;
        if (summary.what_it_does) {
          desp += `${summary.what_it_does}\n\n`;
        }
        if (summary.why_useful) {
          desp += `**💡 为什么有用：** ${summary.why_useful}\n\n`;
        }
      }

      desp += `👉 [查看项目](${repo.url})\n\n`;
    });

    desp += `---\n\n`;
  }

  // 其他项目简要列表
  const otherRepos = repos.filter((r) => {
    const s = summaryMap.get(r.repo_name);
    return !s || s.recommendation === "low";
  });

  if (otherRepos.length > 0) {
    desp += `## 📋 其他项目\n\n`;

    otherRepos.forEach((repo, index) => {
      const summary = summaryMap.get(repo.repo_name);
      desp += `${index + 1}. **[${repo.repo_name}](${repo.url})**\n`;
      desp += `   ${formatStars(repo.stars)} stars`;
      if (repo.language) desp += ` · ${repo.language}`;
      desp += `\n`;
      if (summary?.summary) {
        desp += `   ${summary.summary}\n`;
      } else if (repo.description) {
        desp += `   ${repo.description.slice(0, 80)}${repo.description.length > 80 ? "..." : ""}\n`;
      }
      desp += `\n`;
    });
  }

  desp += `---\n\n`;
  desp += `📊 [查看完整分析](https://github-trending-tracker.vercel.app)\n\n`;
  desp += `> 由 AI 自动分析生成，基于你的专业方向：Data Science, AI/ML, Full-stack`;

  return { title, desp };
}

function formatStars(stars: number): string {
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(1)}k`;
  }
  return String(stars);
}
