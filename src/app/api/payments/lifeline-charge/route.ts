import { isValidYyyyMmDd } from "@/lib/date-lagos";
import type { LifelineKind } from "@/lib/lifeline-pricing";
import { getLifelineFeeNgn } from "@/lib/lifeline-pricing";
import { NextResponse } from "next/server";

/**
 * Stub: records intent and returns success. For production, init Paystack/Flutterwave
 * transaction here, return authorization_url or use inline JS popup, then verify webhook
 * before allowing lifeline API calls (or pass a signed token to lifeline routes).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { kind, quizDate, questionId } = (body ?? {}) as {
    kind?: unknown;
    quizDate?: unknown;
    questionId?: unknown;
  };

  if (kind !== "fifty" && kind !== "audience") {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  if (typeof quizDate !== "string" || !isValidYyyyMmDd(quizDate)) {
    return NextResponse.json({ error: "Invalid quizDate" }, { status: 400 });
  }
  if (typeof questionId !== "string") {
    return NextResponse.json({ error: "Invalid questionId" }, { status: 400 });
  }

  const amount = getLifelineFeeNgn(kind as LifelineKind);
  const reference = `lf-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  return NextResponse.json({
    ok: true,
    reference,
    amount,
    kind,
    message:
      "Stub payment succeeded. Replace this route with your PSP (Paystack/Flutterwave) init + verify.",
  });
}
