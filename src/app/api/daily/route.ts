import { getDailyQuizForDate } from "@/lib/daily";
import { getLagosDateString, isValidYyyyMmDd } from "@/lib/date-lagos";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("date");
  const session = searchParams.get("session") ?? undefined;
  const date =
    raw && isValidYyyyMmDd(raw) ? raw : getLagosDateString();

  const quiz = getDailyQuizForDate(date, session);

  return NextResponse.json(quiz, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
