import { getAuthenticatedWebUser } from "@/lib/auth-request";
import {
  mtnBillingGateway,
  mtnMessagingGateway,
  mtnReportingGateway,
} from "@/lib/mtn-integration";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { DAILY_SUBSCRIPTION_FEE_NAIRA } from "@/lib/service-config";
import { recordSubscriptionTransaction } from "@/lib/subscription-transactions";
import { NextResponse } from "next/server";

type Channel = "sms" | "web";

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

  const { channel, msisdn, keyword, date, paystackReference } = body as {
    channel?: unknown;
    msisdn?: unknown;
    keyword?: unknown;
    date?: unknown;
    paystackReference?: unknown;
  };

  if (channel !== "sms" && channel !== "web") {
    return NextResponse.json({ error: "channel must be sms or web" }, { status: 400 });
  }
  if (typeof msisdn !== "string" || msisdn.trim().length < 7) {
    return NextResponse.json({ error: "Valid msisdn is required" }, { status: 400 });
  }
  if (channel === "sms" && typeof keyword !== "string") {
    return NextResponse.json(
      { error: "SMS subscription must include keyword" },
      { status: 400 },
    );
  }

  const normalizedMsisdn = msisdn.trim();
  if (channel === "web") {
    const user = await getAuthenticatedWebUser();
    if (!user || user.phone !== normalizedMsisdn) {
      return NextResponse.json(
        { error: "Please sign in to the same phone number for web activation" },
        { status: 401 },
      );
    }
  }
  const billing =
    channel === "web"
      ? null
      : await mtnBillingGateway.chargeDailySubscription(normalizedMsisdn);

  if (channel === "web") {
    if (typeof paystackReference !== "string" || !paystackReference.trim()) {
      return NextResponse.json(
        { error: "paystackReference is required for web activation" },
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

  const confirmation =
    channel === "sms"
      ? await mtnMessagingGateway.sendSubscriptionConfirmation(normalizedMsisdn)
      : { ok: true as const, providerRef: "web_confirmation" };
  if (!confirmation.ok) {
    return NextResponse.json({ error: confirmation.error }, { status: 502 });
  }

  const billingRef =
    channel === "web"
      ? (paystackReference as string)
      : billing && billing.ok
        ? billing.providerRef
        : "mtn-billing";

  await mtnReportingGateway.publishActivity({
    eventType: "subscription_activated",
    msisdn: normalizedMsisdn,
    channel: channel as Channel,
    date: typeof date === "string" ? date : null,
    billingRef,
  });

  await recordSubscriptionTransaction({
    msisdn: normalizedMsisdn,
    channel: channel as Channel,
    provider: channel === "web" ? "paystack" : "network",
    eventType: "activated",
    status: "success",
    amountNaira: DAILY_SUBSCRIPTION_FEE_NAIRA,
    reference: billingRef,
    metadata: {
      keyword: typeof keyword === "string" ? keyword : null,
      date: typeof date === "string" ? date : null,
    },
  }).catch(() => {
    // Best-effort write: transaction ledger failure should not block activation.
  });

  return NextResponse.json({
    active: true,
    chargedAmount: mtnBillingGateway.amount,
    billingRef,
    confirmationRef: confirmation.providerRef,
  });
}
