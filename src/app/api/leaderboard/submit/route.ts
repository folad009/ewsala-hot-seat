import { getAuthenticatedWebUser } from "@/lib/auth-request";
import {
  hasCompletedGameSession,
  recordSubscriptionTransaction,
} from "@/lib/subscription-transactions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const user = await getAuthenticatedWebUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { points, date, sessionKey, channel, outcome } = body as {
    points?: unknown;
    date?: unknown;
    sessionKey?: unknown;
    channel?: unknown;
    outcome?: unknown;
  };

  if (typeof points !== "number" || points < 0) {
    return NextResponse.json({ error: "points must be a non-negative number" }, { status: 400 });
  }
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }
  if (typeof sessionKey !== "string" || !sessionKey.trim()) {
    return NextResponse.json({ error: "sessionKey is required" }, { status: 400 });
  }

  const reference = `game:${date}:${sessionKey.trim()}`;
  const exists = await hasCompletedGameSession(user.phone, reference);
  if (exists) {
    return NextResponse.json({ accepted: true, duplicate: true });
  }

  const resolvedChannel = channel === "sms" ? "sms" : "web";
  await recordSubscriptionTransaction({
    msisdn: user.phone,
    channel: resolvedChannel,
    provider: resolvedChannel === "sms" ? "network" : "paystack",
    eventType: "game_completed",
    status: "success",
    reference,
    metadata: {
      points,
      date,
      outcome: typeof outcome === "string" ? outcome : "unknown",
    },
  });

  return NextResponse.json({ accepted: true });
}
