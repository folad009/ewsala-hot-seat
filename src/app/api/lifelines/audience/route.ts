import { getQuestionById } from "@/lib/daily";
import { isValidYyyyMmDd } from "@/lib/date-lagos";
import { hashString, mulberry32 } from "@/lib/prng";
import { NextResponse } from "next/server";

function audiencePoll(correctIndex: number, seed: number): [number, number, number, number] {
  const rand = mulberry32(seed);
  const p: number[] = [0, 0, 0, 0];
  p[correctIndex] = 38 + Math.floor(rand() * 20);

  const wrongIdx = ([0, 1, 2, 3] as const).filter((i) => i !== correctIndex);
  let left = 100 - p[correctIndex];
  for (let i = 0; i < wrongIdx.length; i++) {
    const idx = wrongIdx[i];
    if (i === wrongIdx.length - 1) {
      p[idx] = left;
    } else {
      const chunk = Math.floor(rand() * (left + 1));
      p[idx] = chunk;
      left -= chunk;
    }
  }

  const sum = p.reduce((a, b) => a + b, 0);
  if (sum !== 100) {
    p[correctIndex] += 100 - sum;
  }
  return p as [number, number, number, number];
}

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

  const full = getQuestionById(questionId);
  if (!full) {
    return NextResponse.json({ error: "Unknown question" }, { status: 400 });
  }

  const seed = hashString(`audience|${date}|${questionId}`);
  const percentages = audiencePoll(full.correctIndex, seed);

  return NextResponse.json({ percentages });
}
