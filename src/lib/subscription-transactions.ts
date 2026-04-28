import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

type TxStatus = "success" | "failed" | "pending";
type TxEvent =
  | "activated"
  | "renewed"
  | "opt_out"
  | "payment_verified"
  | "trial_session";
type TxProvider = "network" | "paystack";
type TxChannel = "sms" | "web";

type SubscriptionTransactionDelegate = {
  create(args: {
    data: {
      msisdn: string;
      channel: string;
      provider: string;
      eventType: string;
      status: string;
      amountNaira?: number;
      reference?: string;
      metadata?: Prisma.InputJsonValue;
      occurredAt: Date;
    };
  }): Promise<unknown>;
  findMany(args: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, "asc" | "desc">;
    take?: number;
  }): Promise<
    Array<{
      id: string;
      msisdn: string;
      channel: string;
      provider: string;
      eventType: string;
      status: string;
      amountNaira: number | null;
      reference: string | null;
      metadata: Prisma.JsonValue | null;
      occurredAt: Date;
      createdAt: Date;
    }>
  >;
  findFirst(args: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, "asc" | "desc">;
  }): Promise<{
    provider: string;
    eventType: string;
    occurredAt: Date;
  } | null>;
};

function subscriptionTransactionDelegate(): SubscriptionTransactionDelegate {
  return (prisma as unknown as { subscriptionTransaction: SubscriptionTransactionDelegate })
    .subscriptionTransaction;
}

export async function recordSubscriptionTransaction(input: {
  msisdn: string;
  channel: TxChannel;
  provider: TxProvider;
  eventType: TxEvent;
  status: TxStatus;
  amountNaira?: number;
  reference?: string;
  metadata?: Prisma.InputJsonValue;
  occurredAt?: Date;
}): Promise<void> {
  await subscriptionTransactionDelegate().create({
    data: {
      msisdn: input.msisdn,
      channel: input.channel,
      provider: input.provider,
      eventType: input.eventType,
      status: input.status,
      amountNaira: input.amountNaira,
      reference: input.reference,
      metadata: input.metadata,
      occurredAt: input.occurredAt ?? new Date(),
    },
  });
}

export async function getSubscriptionHistory(msisdn: string, limit = 100) {
  return subscriptionTransactionDelegate().findMany({
    where: { msisdn },
    orderBy: { occurredAt: "desc" },
    take: Math.min(Math.max(limit, 1), 500),
  });
}

export async function getSubscriptionStatus(msisdn: string): Promise<{
  active: boolean;
  activeVia: TxProvider | null;
  lastEventAt: string | null;
}> {
  const latest = await subscriptionTransactionDelegate().findFirst({
    where: { msisdn, status: "success" },
    orderBy: { occurredAt: "desc" },
  });

  if (!latest) {
    return { active: false, activeVia: null, lastEventAt: null };
  }

  const active = latest.eventType === "activated" || latest.eventType === "renewed";
  const activeVia =
    active && (latest.provider === "network" || latest.provider === "paystack")
      ? latest.provider
      : null;

  return {
    active,
    activeVia,
    lastEventAt: latest.occurredAt.toISOString(),
  };
}

export async function getSubscriberTransactionsByTime(input: {
  from: Date;
  to: Date;
  provider?: TxProvider;
}) {
  return subscriptionTransactionDelegate().findMany({
    where: {
      occurredAt: { gte: input.from, lte: input.to },
      ...(input.provider ? { provider: input.provider } : {}),
    },
    orderBy: { occurredAt: "desc" },
  });
}

export async function getTrialSessionCount(input: {
  msisdn: string;
  channel?: TxChannel;
}): Promise<number> {
  const items = await subscriptionTransactionDelegate().findMany({
    where: {
      msisdn: input.msisdn,
      eventType: "trial_session",
      status: "success",
      ...(input.channel ? { channel: input.channel } : {}),
    },
  });
  return items.length;
}

export async function getTrialFailureCount(input: {
  msisdn: string;
  channel?: TxChannel;
}): Promise<number> {
  const items = await subscriptionTransactionDelegate().findMany({
    where: {
      msisdn: input.msisdn,
      eventType: "trial_session",
      status: "failed",
      ...(input.channel ? { channel: input.channel } : {}),
    },
  });
  return items.length;
}

export async function hasSuccessfulOptOut(msisdn: string): Promise<boolean> {
  const latestOptOut = await subscriptionTransactionDelegate().findFirst({
    where: {
      msisdn,
      eventType: "opt_out",
      status: "success",
    },
    orderBy: { occurredAt: "desc" },
  });
  return !!latestOptOut;
}
