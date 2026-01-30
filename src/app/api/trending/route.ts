import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const language = searchParams.get("language");

  try {
    const supabase = createServerClient();

    let query = supabase
      .from("trending_repos")
      .select("*")
      .order("rank", { ascending: true });

    if (date) {
      query = query.eq("trending_date", date);
    }

    if (language) {
      query = query.ilike("language", language);
    }

    const { data, error } = await query.limit(20);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ repos: data });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
