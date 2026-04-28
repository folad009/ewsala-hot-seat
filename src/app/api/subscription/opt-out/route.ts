import { mtnReportingGateway } from "@/lib/mtn-integration";
import { recordSubscriptionTransaction } from "@/lib/subscription-transactions";
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

  const { msisdn, channel, reason } = body as {
    msisdn?: unknown;
    channel?: unknown;
    reason?: unknown;
  };

  if (typeof msisdn !== "string" || msisdn.trim().length < 7) {
    return NextResponse.json({ error: "Valid msisdn is required" }, { status: 400 });
  }
  if (channel !== "sms" && channel !== "web") {
    return NextResponse.json({ error: "channel must be sms or web" }, { status: 400 });
  }

  await mtnReportingGateway.publishActivity({
    eventType: "subscription_opt_out",
    msisdn: msisdn.trim(),
    channel,
    reason: typeof reason === "string" ? reason : null,
  });

  await recordSubscriptionTransaction({
    msisdn: msisdn.trim(),
    channel,
    provider: channel === "web" ? "paystack" : "network",
    eventType: "opt_out",
    status: "success",
    metadata: {
      reason: typeof reason === "string" ? reason : null,
    },
  }).catch(() => {
    // Best-effort write: opt-out should still complete.
  });

  return NextResponse.json({ optedOut: true });
}
