// Skills 爬取器 - 从 skill.sh 和 GitHub 获取热门 Claude Skills
// 使用 Playwright 处理 JavaScript 渲染的页面

import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

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
  installed?: boolean;  // 是否已安装
}

const SKILLS_DIR = path.join(process.env.HOME || "~", ".claude", "skills");

// 获取已安装的 skills
export function getInstalledSkills(): Set<string> {
  const installed = new Set<string>();

  if (!fs.existsSync(SKILLS_DIR)) {
    return installed;
  }

  const entries = fs.readdirSync(SKILLS_DIR, { withFileTypes: true });
  for (const entry of entries) {
    // 目录名或符号链接名作为 skill 名称
    const name = entry.name.toLowerCase().replace(/\.md$/, "");
    installed.add(name);
  }

  return installed;
}

export async function scrapeSkillSh(): Promise<SkillInfo[]> {
  const browser = await chromium.launch({
    headless: true,
    args: ['--ignore-certificate-errors']  // 忽略证书错误
  });
  const page = await browser.newPage();
  const skills: SkillInfo[] = [];

  try {
    // 尝试多个可能的 URL
    const urls = [
      "https://skill.sh",
      "https://www.skill.sh",
      "https://skillhub.club"
    ];

    for (const url of urls) {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForTimeout(3000);

        // 获取页面内容
        const content = await page.content();

        if (content.length > 1000 && !content.includes("blocked")) {
          console.log(`   成功访问: ${url}`);

          // 尝试多种选择器
          const selectors = [
            "article", ".skill-card", "[data-skill]", ".card",
            ".skill", ".plugin", ".item", "li a[href*='skill']"
          ];

          for (const selector of selectors) {
            const elements = await page.$$(selector);
            if (elements.length > 0) {
              console.log(`   找到 ${elements.length} 个元素 (${selector})`);

              for (let i = 0; i < Math.min(elements.length, 30); i++) {
                try {
                  const el = elements[i];
                  const text = await el.textContent() || "";
                  const href = await el.$eval("a", (a) => a.href).catch(() => "");

                  if (text.length > 10) {
                    const lines = text.split("\n").filter(l => l.trim());
                    const name = lines[0]?.trim().slice(0, 50) || `skill-${i}`;
                    const description = lines.slice(1).join(" ").trim().slice(0, 200) || "";

                    skills.push({
                      id: i + 1,
                      name,
                      description,
                      author: "skill.sh",
                      source: "skill.sh",
                      url: href || url,
                      tags: [],
                    });
                  }
                } catch {
                  continue;
                }
              }

              if (skills.length > 0) break;
            }
          }

          if (skills.length > 0) break;
        }
      } catch (e) {
        console.log(`   访问 ${url} 失败: ${(e as Error).message?.slice(0, 50)}`);
        continue;
      }
    }
  } catch (error) {
    console.error("Error scraping skill.sh:", (error as Error).message?.slice(0, 100));
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
  const installedSkills = getInstalledSkills();
  console.log(`📦 你已安装 ${installedSkills.size} 个 skills\n`);

  console.log("🔍 正在爬取 skill.sh...");
  const skillShSkills = await scrapeSkillSh();
  console.log(`   找到 ${skillShSkills.length} 个 skills`);

  console.log("🔍 正在爬取 GitHub Skills...");
  const githubSkills = await scrapeGitHubSkills();
  console.log(`   找到 ${githubSkills.length} 个 skills`);

  const allSkills = [...skillShSkills, ...githubSkills];

  // 重新编号并标记已安装状态
  allSkills.forEach((skill, i) => {
    skill.id = i + 1;
    const normalizedName = skill.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    skill.installed = installedSkills.has(normalizedName) ||
                      installedSkills.has(skill.name.toLowerCase());
  });

  return allSkills;
}
