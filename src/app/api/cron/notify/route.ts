import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { sendServerChanNotification } from "@/lib/notify/serverchan";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const serverChanKey = process.env.SERVERCHAN_KEY;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "Server misconfigured: CRON_SECRET not set" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!serverChanKey) {
    return NextResponse.json(
      { error: "SERVERCHAN_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const supabase = createServerClient();
    const today = new Date().toISOString().split("T")[0];

    // 获取今日 trending repos
    const { data: repos } = await supabase
      .from("trending_repos")
      .select("*")
      .eq("trending_date", today)
      .order("rank", { ascending: true })
      .limit(10);

    if (!repos || repos.length === 0) {
      return NextResponse.json({ message: "No repos to notify" });
    }

    // 获取 AI 总结
    const { data: summaries } = await supabase
      .from("repo_summaries")
      .select("repo_name, summary, what_it_does, core_features, why_useful, use_cases, tech_stack, recommendation, recommendation_reason")
      .in("repo_name", repos.map((r) => r.repo_name));

    // 发送 Server酱 推送
    const success = await sendServerChanNotification(
      serverChanKey,
      repos,
      summaries || []
    );

    if (success) {
      return NextResponse.json({
        success: true,
        message: "推送成功",
        repos_count: repos.length,
        summaries_count: summaries?.length || 0,
      });
    } else {
      return NextResponse.json(
        { error: "推送失败" },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
