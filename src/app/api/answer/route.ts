import { getDailyQuizForDate, getQuestionById } from "@/lib/daily";
import { mtnMessagingGateway, mtnReportingGateway } from "@/lib/mtn-integration";
import { isValidYyyyMmDd } from "@/lib/date-lagos";
import { NextResponse } from "next/server";

const POINTS_PER_QUESTION = 10;

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

  const { date, questionId, selectedIndex, timedOut, channel, msisdn, sessionKey } = body as {
    date?: unknown;
    questionId?: unknown;
    selectedIndex?: unknown;
    timedOut?: unknown;
    channel?: unknown;
    msisdn?: unknown;
    sessionKey?: unknown;
  };
  const resolvedChannel = channel === "sms" || channel === "web" ? channel : "web";
  const resolvedMsisdn = typeof msisdn === "string" ? msisdn.trim() : "";


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

  const quiz = getDailyQuizForDate(
    date,
    typeof sessionKey === "string" ? sessionKey : undefined,
  );
  const slot = quiz.questions.find((q) => q.id === questionId);
  const full = getQuestionById(questionId);

  if (!slot || !full) {
    return NextResponse.json({ error: "Unknown question" }, { status: 400 });
  }

  if (isTimeout) {
    const level = slot.level;
    const completedCorrect = level - 1;
    const pointsAfterWrong = completedCorrect * POINTS_PER_QUESTION;
    const payload = {
      correct: false,
      correctIndex: full.correctIndex,
      level,
      pointsAfterWrong,
      timedOut: true,
    };
    await mtnReportingGateway.publishActivity({
      eventType: "answer_submitted",
      channel: resolvedChannel,
      msisdn: resolvedMsisdn || null,
      questionId,
      correct: false,
      timedOut: true,
      date,
    });
    if (resolvedChannel === "sms" && resolvedMsisdn) {
      await mtnMessagingGateway.sendAnswerFeedback(resolvedMsisdn);
    }
    return NextResponse.json(payload);
  }

  const correct = (selectedIndex as number) === full.correctIndex;
  const level = slot.level;

  if (correct) {
    const securedPoints = level * POINTS_PER_QUESTION;
    const isLast = level === quiz.questionCount;
    const payload = {
      correct: true,
      correctIndex: full.correctIndex,
      level,
      securedPoints,
      isLast,
    };
    await mtnReportingGateway.publishActivity({
      eventType: "answer_submitted",
      channel: resolvedChannel,
      msisdn: resolvedMsisdn || null,
      questionId,
      correct: true,
      timedOut: false,
      date,
    });
    if (resolvedChannel === "sms" && resolvedMsisdn) {
      await mtnMessagingGateway.sendAnswerFeedback(resolvedMsisdn);
    }
    return NextResponse.json(payload);
  }

  const completedCorrect = level - 1;
  const pointsAfterWrong = completedCorrect * POINTS_PER_QUESTION;

  const payload = {
    correct: false,
    correctIndex: full.correctIndex,
    level,
    pointsAfterWrong,
  };
  await mtnReportingGateway.publishActivity({
    eventType: "answer_submitted",
    channel: resolvedChannel,
    msisdn: resolvedMsisdn || null,
    questionId,
    correct: false,
    timedOut: false,
    date,
  });
  if (resolvedChannel === "sms" && resolvedMsisdn) {
    await mtnMessagingGateway.sendAnswerFeedback(resolvedMsisdn);
  }
  return NextResponse.json(payload);
}
