import { getAuthenticatedWebUser } from "@/lib/auth-request";
import { mtnBillingGateway, mtnReportingGateway } from "@/lib/mtn-integration";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { DAILY_SUBSCRIPTION_FEE_NAIRA } from "@/lib/service-config";
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

  const { msisdn, date, channel, paystackReference } = body as {
    msisdn?: unknown;
    date?: unknown;
    channel?: unknown;
    paystackReference?: unknown;
  };
  if (typeof msisdn !== "string" || msisdn.trim().length < 7) {
    return NextResponse.json({ error: "Valid msisdn is required" }, { status: 400 });
  }

  const normalizedMsisdn = msisdn.trim();
  const isWeb = channel === "web";
  if (isWeb) {
    const user = await getAuthenticatedWebUser();
    if (!user || user.phone !== normalizedMsisdn) {
      return NextResponse.json(
        { error: "Please sign in to the same phone number for web renewal" },
        { status: 401 },
      );
    }
  }

  const billing = isWeb
    ? null
    : await mtnBillingGateway.chargeDailySubscription(normalizedMsisdn);
  if (isWeb) {
    if (typeof paystackReference !== "string" || !paystackReference.trim()) {
      return NextResponse.json(
        { error: "paystackReference is required for web renewal" },
        { status: 400 },
      );
    }
    const verified = await verifyPaystackTransaction(paystackReference.trim());
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: 502 });
    }
    if (verified.status !== "success") {
      return NextResponse.json({ error: "Web payment not successful" }, { status: 402 });
    }
    if (verified.amountKobo < DAILY_SUBSCRIPTION_FEE_NAIRA * 100) {
      return NextResponse.json({ error: "Web payment amount mismatch" }, { status: 400 });
    }
  } else if (!billing?.ok) {
    return NextResponse.json({ error: billing?.error ?? "Billing failed" }, { status: 502 });
  }

  await mtnReportingGateway.publishActivity({
    eventType: "subscription_renewed",
    msisdn: normalizedMsisdn,
    date: typeof date === "string" ? date : null,
    billingRef:
      isWeb
        ? (paystackReference as string)
        : billing && billing.ok
          ? billing.providerRef
          : "mtn-billing",
  });

  await recordSubscriptionTransaction({
    msisdn: normalizedMsisdn,
    channel: isWeb ? "web" : "sms",
    provider: isWeb ? "paystack" : "network",
    eventType: "renewed",
    status: "success",
    amountNaira: DAILY_SUBSCRIPTION_FEE_NAIRA,
    reference:
      isWeb
        ? (paystackReference as string)
        : billing && billing.ok
          ? billing.providerRef
          : "mtn-billing",
    metadata: {
      date: typeof date === "string" ? date : null,
    },
  }).catch(() => {
    // Best-effort write: renewal should not fail on ledger error.
  });

  return NextResponse.json({
    renewed: true,
    chargedAmount: mtnBillingGateway.amount,
    billingRef:
      isWeb
        ? (paystackReference as string)
        : billing && billing.ok
          ? billing.providerRef
          : "mtn-billing",
  });
}
