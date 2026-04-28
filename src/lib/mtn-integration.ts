import { DAILY_SUBSCRIPTION_FEE_NAIRA, SERVICE_NAME } from "@/lib/service-config";

type IntegrationResult =
  | { ok: true; providerRef: string }
  | { ok: false; error: string };

function newRef(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

/**
 * Adapter layer for MTN VAS integrations.
 * Replace these mock implementations with real gateway SDK/API calls.
 */
export const mtnMessagingGateway = {
  async sendSubscriptionConfirmation(msisdn: string): Promise<IntegrationResult> {
    if (!msisdn) return { ok: false, error: "Missing msisdn" };
    return { ok: true, providerRef: newRef("sms_confirm") };
  },
  async sendAnswerFeedback(msisdn: string): Promise<IntegrationResult> {
    if (!msisdn) return { ok: false, error: "Missing msisdn" };
    return { ok: true, providerRef: newRef("sms_feedback") };
  },
};

export const mtnBillingGateway = {
  async chargeDailySubscription(msisdn: string): Promise<IntegrationResult> {
    if (!msisdn) return { ok: false, error: "Missing msisdn" };
    // Stubbed MTN billing call
    return { ok: true, providerRef: newRef("bill_daily") };
  },
  amount: DAILY_SUBSCRIPTION_FEE_NAIRA,
};

export const mtnReportingGateway = {
  async publishActivity(payload: Record<string, unknown>): Promise<IntegrationResult> {
    if (!payload.eventType) return { ok: false, error: "Missing eventType" };
    return { ok: true, providerRef: newRef("report_evt") };
  },
};

export const serviceMeta = {
  name: SERVICE_NAME,
};
