"use client";

export type AccessChannel = "sms" | "web";

export type SubscriptionState = {
  active: boolean;
  channel: AccessChannel | null;
  msisdn: string | null;
  activatedAt: string | null;
  lastChargedDate: string | null;
};

const STORAGE_KEY = "eswala-trivia-subscription";

const DEFAULT_STATE: SubscriptionState = {
  active: false,
  channel: null,
  msisdn: null,
  activatedAt: null,
  lastChargedDate: null,
};

export function getSubscriptionState(): SubscriptionState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as SubscriptionState;
    return {
      active: parsed.active === true,
      channel: parsed.channel ?? null,
      msisdn: parsed.msisdn ?? null,
      activatedAt: parsed.activatedAt ?? null,
      lastChargedDate: parsed.lastChargedDate ?? null,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function setSubscriptionState(next: SubscriptionState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore write issues in private mode
  }
}
