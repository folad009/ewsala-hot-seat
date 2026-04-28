import { isValidYyyyMmDd } from "@/lib/date-lagos";
import { mtnReportingGateway } from "@/lib/mtn-integration";
import { scoreSubmission, validateAnswerKeys } from "@/lib/scoring";
import type { SubmitPayload } from "@/lib/types";
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

  const { date, answers, sessionKey, channel, msisdn } = body as Partial<SubmitPayload> & {
    channel?: unknown;
    msisdn?: unknown;
  };

  if (typeof date !== "string" || !isValidYyyyMmDd(date)) {
    return NextResponse.json({ error: "Invalid or missing date (YYYY-MM-DD)" }, { status: 400 });
  }

  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return NextResponse.json({ error: "answers must be an object of questionId → index" }, { status: 400 });
  }

  const payload: SubmitPayload = {
    date,
    answers: answers as Record<string, number>,
    sessionKey: typeof sessionKey === "string" ? sessionKey : undefined,
  };

  if (!validateAnswerKeys(payload)) {
    return NextResponse.json(
      { error: "Unknown question id in answers" },
      { status: 400 },
    );
  }

  const result = scoreSubmission(payload);
  if (!result) {
    return NextResponse.json({ error: "Could not score quiz" }, { status: 500 });
  }

  await mtnReportingGateway.publishActivity({
    eventType: "session_submitted",
    date,
    score: result.correct,
    total: result.total,
    percentage: result.percentage,
    channel: channel === "sms" || channel === "web" ? channel : "web",
    msisdn: typeof msisdn === "string" ? msisdn.trim() : null,
  });

  return NextResponse.json(result);
}
