import { getAuthenticatedWebUser } from "@/lib/auth-request";
import {
  hasSuccessfulOptOut,
  getTrialFailureCount,
  getSubscriptionStatus,
} from "@/lib/subscription-transactions";
import { NextResponse } from "next/server";

const TRIAL_LIMIT = 2;

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

  const channel =
    body && typeof body === "object" && (body as { channel?: unknown }).channel === "sms"
      ? "sms"
      : "web";

  const status = await getSubscriptionStatus(user.phone);
  const optedOut = await hasSuccessfulOptOut(user.phone);
  if (status.active) {
    return NextResponse.json({ ok: true, subscribed: true, trialsLeft: TRIAL_LIMIT });
  }

  if (optedOut) {
    return NextResponse.json(
      { error: "Trial is unavailable after opt-out. Please subscribe to continue." },
      { status: 402 },
    );
  }

  const count = await getTrialFailureCount({ msisdn: user.phone, channel });
  if (count >= TRIAL_LIMIT) {
    return NextResponse.json(
      { error: "Trial sessions exhausted. Please subscribe to continue." },
      { status: 402 },
    );
  }

  return NextResponse.json({
    ok: true,
    subscribed: false,
    failed: count,
    trialsLeft: Math.max(TRIAL_LIMIT - count, 0),
  });
}
