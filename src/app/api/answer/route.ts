import { getDailyQuizForDate, getQuestionById } from "@/lib/daily";
import { isValidYyyyMmDd } from "@/lib/date-lagos";
import { pointsOnWrong } from "@/lib/ladder";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { date, questionId, selectedIndex, timedOut } = body as {
    date?: unknown;
    questionId?: unknown;
    selectedIndex?: unknown;
    timedOut?: unknown;
  };

  if (typeof date !== "string" || !isValidYyyyMmDd(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  if (typeof questionId !== "string") {
    return NextResponse.json({ error: "Invalid questionId" }, { status: 400 });
  }

  const isTimeout = timedOut === true;

  if (!isTimeout) {
    if (
      typeof selectedIndex !== "number" ||
      selectedIndex < 0 ||
      selectedIndex > 3 ||
      !Number.isInteger(selectedIndex)
    ) {
      return NextResponse.json({ error: "selectedIndex must be 0–3" }, { status: 400 });
    }
  } else if (selectedIndex !== undefined && selectedIndex !== null) {
    return NextResponse.json(
      { error: "Do not send selectedIndex when timedOut is true" },
      { status: 400 },
    );
  }

  const quiz = getDailyQuizForDate(date);
  const slot = quiz.questions.find((q) => q.id === questionId);
  const full = getQuestionById(questionId);

  if (!slot || !full) {
    return NextResponse.json({ error: "Unknown question" }, { status: 400 });
  }

  if (isTimeout) {
    const level = slot.level;
    const ladder = quiz.pointsLadder;
    const completedCorrect = level - 1;
    const pointsAfterWrong = pointsOnWrong(
      completedCorrect,
      ladder,
      quiz.checkpointLevels,
    );
    return NextResponse.json({
      correct: false,
      correctIndex: full.correctIndex,
      level,
      pointsAfterWrong,
      timedOut: true,
    });
  }

  const correct = (selectedIndex as number) === full.correctIndex;
  const level = slot.level;
  const ladder = quiz.pointsLadder;

  if (correct) {
    const securedPoints = ladder[level - 1];
    const isLast = level === quiz.questionCount;
    return NextResponse.json({
      correct: true,
      correctIndex: full.correctIndex,
      level,
      securedPoints,
      isLast,
    });
  }

  const completedCorrect = level - 1;
  const pointsAfterWrong = pointsOnWrong(
    completedCorrect,
    ladder,
    quiz.checkpointLevels,
  );

  return NextResponse.json({
    correct: false,
    correctIndex: full.correctIndex,
    level,
    pointsAfterWrong,
  });
}
