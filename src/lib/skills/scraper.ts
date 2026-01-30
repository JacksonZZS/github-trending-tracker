// Skills 爬取器 - 从 skill.sh 和 GitHub 获取热门 Claude Skills
// 使用 Playwright 处理 JavaScript 渲染的页面

import { chromium } from "playwright";

export interface SkillInfo {
  id: number;
  name: string;
  description: string;
  author: string;
  source: "skill.sh" | "github" | "anthropics";
  url: string;
  install_url?: string;
  stars?: number;
  downloads?: number;
  tags: string[];
  raw_content?: string;
}

export async function scrapeSkillSh(): Promise<SkillInfo[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const skills: SkillInfo[] = [];

  try {
    await page.goto("https://skill.sh", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000);

    // 尝试获取 skills 列表
    const skillElements = await page.$$("article, .skill-card, [data-skill], .card");

    for (let i = 0; i < Math.min(skillElements.length, 30); i++) {
      try {
        const el = skillElements[i];
        const name = await el.$eval("h2, h3, .title, .name", (e) => e.textContent?.trim() || "").catch(() => "");
        const description = await el.$eval("p, .description, .desc", (e) => e.textContent?.trim() || "").catch(() => "");
        const author = await el.$eval(".author, .by, [data-author]", (e) => e.textContent?.trim() || "").catch(() => "unknown");
        const url = await el.$eval("a", (e) => e.href).catch(() => "");

        if (name && description) {
          skills.push({
            id: i + 1,
            name,
            description,
            author,
            source: "skill.sh",
            url,
            tags: [],
          });
        }
      } catch {
        continue;
      }
    }
  } catch (error) {
    console.error("Error scraping skill.sh:", error);
  } finally {
    await browser.close();
  }

  return skills;
}

export async function scrapeGitHubSkills(): Promise<SkillInfo[]> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const skills: SkillInfo[] = [];

  const repos = [
    "https://github.com/anthropics/skills",
    "https://github.com/CavinHuang/claude-skills-hub",
  ];

  try {
    for (const repoUrl of repos) {
      await page.goto(repoUrl, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1000);

      // 获取 README 内容或文件列表
      const readmeContent = await page.$eval("article.markdown-body", (e) => e.textContent || "").catch(() => "");

      // 查找 skills 目录下的文件
      const fileLinks = await page.$$eval('a[href*="/tree/"][href*="skill"], a[href*="/blob/"][href*="SKILL.md"]',
        (links) => links.map((a) => ({
          name: a.textContent?.trim() || "",
          href: a.href
        }))
      ).catch(() => []);

      for (let i = 0; i < fileLinks.length; i++) {
        const file = fileLinks[i];
        if (file.name && !file.name.includes("..")) {
          skills.push({
            id: skills.length + 1,
            name: file.name.replace(/\.md$/i, ""),
            description: `GitHub Skill from ${repoUrl.split("/").slice(-2).join("/")}`,
            author: repoUrl.split("/")[3],
            source: repoUrl.includes("anthropics") ? "anthropics" : "github",
            url: file.href,
            install_url: file.href.replace("/blob/", "/raw/"),
            tags: [],
          });
        }
      }
    }
  } catch (error) {
    console.error("Error scraping GitHub:", error);
  } finally {
    await browser.close();
  }

  return skills;
}

export async function scrapeAllSkills(): Promise<SkillInfo[]> {
  console.log("🔍 正在爬取 skill.sh...");
  const skillShSkills = await scrapeSkillSh();
  console.log(`   找到 ${skillShSkills.length} 个 skills`);

  console.log("🔍 正在爬取 GitHub Skills...");
  const githubSkills = await scrapeGitHubSkills();
  console.log(`   找到 ${githubSkills.length} 个 skills`);

  const allSkills = [...skillShSkills, ...githubSkills];

  // 重新编号
  allSkills.forEach((skill, i) => {
    skill.id = i + 1;
  });

  return allSkills;
}
