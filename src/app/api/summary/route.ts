import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repoName = searchParams.get("repo");

  if (!repoName) {
    return NextResponse.json(
      { error: "repo parameter required" },
      { status: 400 }
    );
  }

  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("repo_summaries")
      .select("*")
      .eq("repo_name", repoName)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Database error", details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Summary not found", repo: repoName },
        { status: 404 }
      );
    }

    return NextResponse.json({ summary: data });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch summary", details: String(error) },
      { status: 500 }
    );
  }
}
