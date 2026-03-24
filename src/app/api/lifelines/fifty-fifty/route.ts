import { getDailyQuizForDate, getQuestionById } from "@/lib/daily";
import { isValidYyyyMmDd } from "@/lib/date-lagos";
import { hashString, mulberry32 } from "@/lib/prng";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { date, questionId } = (body ?? {}) as {
    date?: unknown;
    questionId?: unknown;
  };

  if (typeof date !== "string" || !isValidYyyyMmDd(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (typeof questionId !== "string") {
    return NextResponse.json({ error: "Invalid questionId" }, { status: 400 });
  }

  const quiz = getDailyQuizForDate(date);
  if (!quiz.questions.some((q) => q.id === questionId)) {
    return NextResponse.json({ error: "Unknown question" }, { status: 400 });
  }

  const full = getQuestionById(questionId);
  if (!full) {
    return NextResponse.json({ error: "Unknown question" }, { status: 400 });
  }

  const wrong = ([0, 1, 2, 3] as const).filter((i) => i !== full.correctIndex);
  const rand = mulberry32(hashString(`5050|${date}|${questionId}`));
  const shuffled = [...wrong];
  for (let k = shuffled.length - 1; k > 0; k--) {
    const j = Math.floor(rand() * (k + 1));
    [shuffled[k], shuffled[j]] = [shuffled[j], shuffled[k]];
  }
  const removeIndices = shuffled.slice(0, 2).sort((x, y) => x - y);

  return NextResponse.json({ removeIndices });
}
