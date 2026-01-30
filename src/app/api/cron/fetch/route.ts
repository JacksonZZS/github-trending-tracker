import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { scrapeGitHubTrending, formatTrendingDate } from "@/lib/scraper/github-trending";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const trendingDate = formatTrendingDate();

    const repos = await scrapeGitHubTrending();

    if (repos.length === 0) {
      return NextResponse.json(
        { error: "No repos scraped" },
        { status: 500 }
      );
    }

    const reposToInsert = repos.map((repo) => ({
      ...repo,
      trending_date: trendingDate,
    }));

    const { error } = await supabase
      .from("trending_repos")
      .upsert(reposToInsert, {
        onConflict: "repo_name,trending_date",
        ignoreDuplicates: false,
      });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Database insert failed", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      date: trendingDate,
      count: repos.length,
      repos: repos.slice(0, 5).map((r) => r.repo_name),
    });
  } catch (error) {
    console.error("Cron fetch error:", error);
    return NextResponse.json(
      { error: "Fetch failed", details: String(error) },
      { status: 500 }
    );
  }
}
