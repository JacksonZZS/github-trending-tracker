interface WeChatMessage {
  msgtype: "markdown";
  markdown: {
    content: string;
  };
}

interface TrendingRepoForNotify {
  repo_name: string;
  url: string;
  description: string | null;
  language: string | null;
  stars: number;
  stars_today: number;
}

export async function sendWeChatNotification(
  webhookUrl: string,
  repos: TrendingRepoForNotify[]
): Promise<boolean> {
  const content = formatMarkdownMessage(repos);

  const message: WeChatMessage = {
    msgtype: "markdown",
    markdown: {
      content,
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error("WeChat notification failed:", await response.text());
      return false;
    }

    const result = await response.json();
    return result.errcode === 0;
  } catch (error) {
    console.error("WeChat notification error:", error);
    return false;
  }
}

function formatMarkdownMessage(repos: TrendingRepoForNotify[]): string {
  const date = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let content = `# 🔥 GitHub Trending Daily\n`;
  content += `> ${date}\n\n`;

  repos.slice(0, 10).forEach((repo, index) => {
    const langBadge = repo.language ? `\`${repo.language}\`` : "";
    const stars = repo.stars >= 1000 ? `${(repo.stars / 1000).toFixed(1)}k` : repo.stars;
    const todayStars = repo.stars_today > 0 ? ` (+${repo.stars_today} today)` : "";

    content += `**${index + 1}. [${repo.repo_name}](${repo.url})**\n`;
    content += `⭐ ${stars}${todayStars} ${langBadge}\n`;
    if (repo.description) {
      content += `> ${repo.description.slice(0, 80)}${repo.description.length > 80 ? "..." : ""}\n`;
    }
    content += `\n`;
  });

  content += `---\n`;
  content += `[查看完整列表](https://github.com/trending)`;

  return content;
}

export async function testWeChatWebhook(webhookUrl: string): Promise<boolean> {
  const testMessage: WeChatMessage = {
    msgtype: "markdown",
    markdown: {
      content: "# ✅ GitHub Trending Tracker\n> Webhook 配置测试成功！",
    },
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testMessage),
    });

    const result = await response.json();
    return result.errcode === 0;
  } catch {
    return false;
  }
}
