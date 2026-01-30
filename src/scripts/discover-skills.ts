#!/usr/bin/env npx tsx
// Skills 发现与安装脚本
// 使用方法: npx tsx src/scripts/discover-skills.ts

import { config } from "dotenv";
config({ path: ".env.local" });

import * as readline from "readline";
import { scrapeAllSkills, type SkillInfo } from "../lib/skills/scraper";
import { analyzeSkills, type SkillAnalysis } from "../lib/skills/analyzer";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const SKILLS_DIR = path.join(process.env.HOME || "~", ".claude", "skills");

async function main() {
  console.log("🔍 Skills 发现器 - 帮你找到最有用的 Claude Code Skills\n");

  // 1. 爬取 Skills
  console.log("📡 正在获取最新 Skills...\n");
  const skills = await scrapeAllSkills();

  if (skills.length === 0) {
    console.log("❌ 没有找到 Skills，请检查网络连接");
    process.exit(1);
  }

  console.log(`\n✅ 找到 ${skills.length} 个 Skills\n`);

  // 2. AI 分析
  console.log("🤖 正在用 AI 分析每个 Skill 对你的价值...\n");
  const analyses = await analyzeSkills(skills, (current, total, name) => {
    process.stdout.write(`\r[${current}/${total}] 分析中: ${name.slice(0, 30).padEnd(30)}`);
  });
  console.log("\n");

  // 3. 分类展示
  const high = analyses.filter((a) => a.usefulness === "high");
  const medium = analyses.filter((a) => a.usefulness === "medium");
  const low = analyses.filter((a) => a.usefulness === "low");

  console.log("═".repeat(60));
  console.log("⭐ 高度推荐（与你的方向高度相关）");
  console.log("═".repeat(60));
  high.forEach((a) => {
    console.log(`\n[${a.id}] 📦 ${a.name}`);
    console.log(`    📝 ${a.summary}`);
    console.log(`    🎯 ${a.what_it_does}`);
    console.log(`    💡 ${a.usefulness_reason}`);
  });

  if (medium.length > 0) {
    console.log("\n" + "─".repeat(60));
    console.log("📌 值得关注");
    console.log("─".repeat(60));
    medium.forEach((a) => {
      console.log(`[${a.id}] ${a.name} - ${a.summary}`);
    });
  }

  if (low.length > 0) {
    console.log("\n" + "─".repeat(60));
    console.log("📋 其他 Skills");
    console.log("─".repeat(60));
    low.forEach((a) => {
      console.log(`[${a.id}] ${a.name}`);
    });
  }

  // 4. 交互式安装
  console.log("\n" + "═".repeat(60));
  console.log("💾 输入编号安装 Skill（多个用逗号分隔，如: 1,3,5）");
  console.log("   输入 'q' 退出");
  console.log("═".repeat(60));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askForInstall = () => {
    rl.question("\n请输入要安装的编号: ", async (answer) => {
      if (answer.toLowerCase() === "q") {
        console.log("\n👋 再见！");
        rl.close();
        process.exit(0);
      }

      const ids = answer.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n));

      if (ids.length === 0) {
        console.log("❌ 无效输入，请输入数字编号");
        askForInstall();
        return;
      }

      // 确保目录存在
      if (!fs.existsSync(SKILLS_DIR)) {
        fs.mkdirSync(SKILLS_DIR, { recursive: true });
      }

      for (const id of ids) {
        const analysis = analyses.find((a) => a.id === id);
        const skill = skills.find((s) => s.id === id);

        if (!analysis || !skill) {
          console.log(`❌ 编号 ${id} 不存在`);
          continue;
        }

        try {
          const targetPath = path.join(SKILLS_DIR, `${skill.name}.md`);

          if (skill.install_url || skill.url) {
            const sourceUrl = skill.install_url || skill.url;
            console.log(`📥 正在下载 ${skill.name}...`);

            // 尝试下载
            execSync(`curl -sL "${sourceUrl}" -o "${targetPath}"`, { stdio: "pipe" });

            // 检查文件是否有效
            const content = fs.readFileSync(targetPath, "utf-8");
            if (content.length < 50 || content.includes("<!DOCTYPE")) {
              // 如果是 HTML 页面，创建一个占位 skill
              fs.writeFileSync(targetPath, `---
name: ${skill.name}
description: ${skill.description}
author: ${skill.author}
source: ${skill.source}
---

# ${skill.name}

${skill.description}

> 从 ${skill.url} 获取
> 请手动访问上述链接获取完整内容
`);
            }

            console.log(`✅ 已安装: ${skill.name} -> ${targetPath}`);
          } else {
            console.log(`⚠️ ${skill.name} 没有安装链接`);
          }
        } catch (error) {
          console.log(`❌ 安装 ${skill.name} 失败: ${error}`);
        }
      }

      console.log("\n💡 重启 Claude Code 后生效");
      askForInstall();
    });
  };

  askForInstall();
}

main().catch(console.error);
