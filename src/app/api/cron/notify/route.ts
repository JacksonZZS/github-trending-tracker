import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { sendWeChatNotification } from "@/lib/notify/wechat-bot";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "Server misconfigured: CRON_SECRET not set" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerClient();

    const { data: settings } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("wechat_enabled", true);

    if (!settings || settings.length === 0) {
      return NextResponse.json({ message: "No enabled notifications" });
    }

    const today = new Date().toISOString().split("T")[0];

    const { data: repos } = await supabase
      .from("trending_repos")
      .select("*")
      .eq("trending_date", today)
      .order("rank", { ascending: true })
      .limit(10);

    if (!repos || repos.length === 0) {
      return NextResponse.json({ message: "No repos to notify" });
    }

    const results = await Promise.allSettled(
      settings.map(async (setting) => {
        if (!setting.wechat_webhook_url) return false;

        let filteredRepos = repos;

        if (setting.languages && setting.languages.length > 0) {
          filteredRepos = repos.filter(
            (r) => r.language && setting.languages.includes(r.language.toLowerCase())
          );
        }

        if (setting.min_stars > 0) {
          filteredRepos = filteredRepos.filter((r) => r.stars >= setting.min_stars);
        }

        if (filteredRepos.length === 0) return false;

        return sendWeChatNotification(setting.wechat_webhook_url, filteredRepos);
      })
    );

    const successCount = results.filter(
      (r) => r.status === "fulfilled" && r.value === true
    ).length;

    return NextResponse.json({
      success: true,
      notified: successCount,
      total: settings.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
