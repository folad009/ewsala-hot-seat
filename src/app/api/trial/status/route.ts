import { getAuthenticatedWebUser } from "@/lib/auth-request";
import {
  hasSuccessfulOptOut,
  getSubscriptionStatus,
  getTrialFailureCount,
} from "@/lib/subscription-transactions";
import { NextResponse } from "next/server";

const TRIAL_LIMIT = 2;

export async function GET(request: Request) {
  const user = await getAuthenticatedWebUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const channel = searchParams.get("channel") === "sms" ? "sms" : "web";
  const subscription = await getSubscriptionStatus(user.phone);
  const optedOut = await hasSuccessfulOptOut(user.phone);
  if (subscription.active) {
    return NextResponse.json({
      subscribed: true,
      optedOut,
      trialLimit: TRIAL_LIMIT,
      failedAttempts: 0,
      trialsLeft: TRIAL_LIMIT,
      channel,
    });
  }

  if (optedOut) {
    return NextResponse.json({
      subscribed: false,
      optedOut: true,
      trialLimit: TRIAL_LIMIT,
      failedAttempts: TRIAL_LIMIT,
      trialsLeft: 0,
      channel,
    });
  }

  const failedAttempts = await getTrialFailureCount({
    msisdn: user.phone,
    channel,
  });

  return NextResponse.json({
    subscribed: false,
    optedOut: false,
    trialLimit: TRIAL_LIMIT,
    failedAttempts,
    trialsLeft: Math.max(TRIAL_LIMIT - failedAttempts, 0),
    channel,
  });
}
