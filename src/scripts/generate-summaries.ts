// 本地运行脚本 - 为 Trending 项目生成 AI 总结
// 使用方法: npx tsx src/scripts/generate-summaries.ts

import { createClient } from "@supabase/supabase-js";
import { generateBatchAnalysis, type RepoAnalysis } from "../lib/ai/summarizer";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("🚀 开始生成 AI 总结...\n");

  // 获取今天的 trending repos
  const today = new Date().toISOString().split("T")[0];

  const { data: repos, error } = await supabase
    .from("trending_repos")
    .select("*")
    .eq("trending_date", today)
    .order("rank", { ascending: true })
    .limit(25);  // Top 25

  if (error) {
    console.error("❌ 获取数据失败:", error.message);
    process.exit(1);
  }

  if (!repos || repos.length === 0) {
    console.log("⚠️ 今天没有 trending 数据，请先运行抓取");
    process.exit(0);
  }

  console.log(`📊 找到 ${repos.length} 个项目\n`);

  // 检查哪些已经有总结
  const { data: existingSummaries } = await supabase
    .from("repo_summaries")
    .select("repo_name")
    .in("repo_name", repos.map((r) => r.repo_name));

  const existingNames = new Set(existingSummaries?.map((s) => s.repo_name) || []);
  const reposToSummarize = repos.filter((r) => !existingNames.has(r.repo_name));

  if (reposToSummarize.length === 0) {
    console.log("✅ 所有项目已有总结，无需重新生成");
    process.exit(0);
  }

  console.log(`🤖 需要生成 ${reposToSummarize.length} 个项目的总结\n`);

  // 生成总结
  const analyses = await generateBatchAnalysis(
    reposToSummarize.map((r) => ({
      repo_name: r.repo_name,
      description: r.description,
      language: r.language,
      stars: r.stars,
      stars_today: r.stars_today,
      url: r.url,
    })),
    (current, total, repo) => {
      console.log(`[${current}/${total}] 正在分析: ${repo}`);
    }
  );

  console.log(`\n✨ 成功生成 ${analyses.length} 个总结\n`);

  // 保存到数据库
  if (analyses.length > 0) {
    const { error: insertError } = await supabase
      .from("repo_summaries")
      .upsert(
        analyses.map((a) => ({
          repo_name: a.repo_name,
          summary: a.summary,
          what_it_does: a.what_it_does,
          core_features: a.core_features,
          why_useful: a.why_useful,
          use_cases: a.use_cases,
          tech_stack: a.tech_stack,
          difficulty: a.difficulty,
          recommendation: a.recommendation,
          recommendation_reason: a.recommendation_reason,
          generated_at: a.generated_at,
        })),
        { onConflict: "repo_name" }
      );

    if (insertError) {
      console.error("❌ 保存失败:", insertError.message);
      process.exit(1);
    }

    console.log("💾 已保存到数据库");
  }

  console.log("\n🎉 完成！");
}

main().catch(console.error);
