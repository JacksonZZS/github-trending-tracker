import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/client";
import { z } from "zod";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  language: z.string().max(50).optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = querySchema.safeParse({
    date: searchParams.get("date") ?? undefined,
    language: searchParams.get("language") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { date, language } = parsed.data;

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
