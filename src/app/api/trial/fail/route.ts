import { getAuthenticatedWebUser } from "@/lib/auth-request";
import { recordSubscriptionTransaction } from "@/lib/subscription-transactions";
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

  const channel =
    body && typeof body === "object" && (body as { channel?: unknown }).channel === "sms"
      ? "sms"
      : "web";
  const reason =
    body && typeof body === "object" && typeof (body as { reason?: unknown }).reason === "string"
      ? (body as { reason: string }).reason
      : "wrong";

  await recordSubscriptionTransaction({
    msisdn: user.phone,
    channel,
    provider: channel === "sms" ? "network" : "paystack",
    eventType: "trial_session",
    status: "failed",
    metadata: { reason },
  });

  return NextResponse.json({ recorded: true });
}
