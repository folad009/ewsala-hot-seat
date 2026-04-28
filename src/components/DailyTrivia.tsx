"use client";

import { CATEGORY_LABELS } from "@/lib/category-labels";
import {
  DEFAULT_OPT_OUT_KEYWORD,
  DEFAULT_SHORTCODE,
  DEFAULT_SUBSCRIBE_KEYWORD,
  DAILY_SUBSCRIPTION_FEE_NAIRA,
  formatNaira,
} from "@/lib/service-config";
import {
  getSubscriptionState,
  setSubscriptionState,
  type AccessChannel,
} from "@/lib/subscription-state";
import {
  pickLossEncouragement,
  pickWinCongratulations,
  WALK_SUB,
} from "@/lib/game-end-messages";
import { SECONDS_PER_QUESTION } from "@/lib/question-timer";
import type { CategoryId, DailyQuiz } from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Props = {
  initialDateParam?: string | null;
};

function formatPoints(n: number): string {
  return `${n.toLocaleString("en-NG")} pts`;
}

type AnswerOk =
  | {
      correct: true;
      correctIndex: number;
      level: number;
      securedPoints: number;
      isLast: boolean;
    }
  | {
      correct: false;
      correctIndex: number;
      level: number;
      pointsAfterWrong: number;
      timedOut?: boolean;
    };

type GameEnd =
  | { kind: "won"; points: number }
  | { kind: "lost"; points: number; reason?: "wrong" | "timeout" }
  | { kind: "walk"; points: number };

type SubscriptionHistoryItem = {
  id: string;
  eventType: string;
  channel: "sms" | "web";
  provider: string;
  status: string;
  amountNaira: number | null;
  occurredAt: string;
};

type SubscriptionHistoryResponse = {
  msisdn: string;
  subscription: {
    active: boolean;
    activeVia: "network" | "paystack" | null;
    lastEventAt: string | null;
  };
  transactions: SubscriptionHistoryItem[];
};

type TrialStatusResponse = {
  subscribed: boolean;
  optedOut?: boolean;
  trialLimit: number;
  failedAttempts: number;
  trialsLeft: number;
  channel: "sms" | "web";
};

type PersistedPlaySession = {
  date: string;
  sessionKey: string;
  inProgress: boolean;
  currentIndex: number;
};

const PLAY_SESSION_STORAGE_KEY = "eswala-trivia-play-session";
const LEVELS_PER_STAGE = 50;
const POINTS_PER_QUESTION = 10;

function createSessionKey(): string {
  return `sess_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

function readPersistedPlaySession(): PersistedPlaySession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PLAY_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedPlaySession;
    if (!parsed.sessionKey || typeof parsed.sessionKey !== "string") return null;
    return {
      date: typeof parsed.date === "string" ? parsed.date : "",
      sessionKey: parsed.sessionKey,
      inProgress: parsed.inProgress === true,
      currentIndex:
        typeof parsed.currentIndex === "number" && parsed.currentIndex >= 0
          ? Math.floor(parsed.currentIndex)
          : 0,
    };
  } catch {
    return null;
  }
}

function writePersistedPlaySession(next: PersistedPlaySession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLAY_SESSION_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage write failures
  }
}

function toDateOnly(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function addOneDay(dateOnly: string | null): string | null {
  if (!dateOnly || !/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null;
  const d = new Date(`${dateOnly}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function formatLagosExpiryDateTime(dateOnly: string | null): string | null {
  if (!dateOnly || !/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return null;
  // 23:59 WAT on the expiry date (WAT is UTC+1)
  const d = new Date(`${dateOnly}T22:59:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  const label = new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  return `${label} (WAT)`;
}

export function DailyTrivia({ initialDateParam }: Props) {
  const [quiz, setQuiz] = useState<DailyQuiz | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [lastAnswer, setLastAnswer] = useState<AnswerOk | null>(null);
  const [gameEnd, setGameEnd] = useState<GameEnd | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_QUESTION);

  const [fiftyUsed, setFiftyUsed] = useState(false);
  const [audienceUsed, setAudienceUsed] = useState(false);
  const [hiddenIndices, setHiddenIndices] = useState<number[]>([]);
  const [audiencePct, setAudiencePct] = useState<number[] | null>(null);
  const [subscriberMsisdn, setSubscriberMsisdn] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subChannel, setSubChannel] = useState<AccessChannel>("web");
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);
  const [lastChargedDate, setLastChargedDate] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authPhone, setAuthPhone] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPassword, setForgotPassword] = useState("");
  const [preferredPlayChannel, setPreferredPlayChannel] = useState<AccessChannel>("web");
  const [trialStatus, setTrialStatus] = useState<TrialStatusResponse | null>(null);
  const [isTrialSession, setIsTrialSession] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyStatus, setHistoryStatus] = useState<{
    active: boolean;
    activeVia: "network" | "paystack" | null;
    lastEventAt: string | null;
  } | null>(null);
  const [historyItems, setHistoryItems] = useState<SubscriptionHistoryItem[]>([]);
  const [playSessionKey, setPlaySessionKey] = useState("");
  const [resumeIndex, setResumeIndex] = useState<number | null>(null);
  const [pendingStageIndex, setPendingStageIndex] = useState<number | null>(0);

  const quizRef = useRef(quiz);
  const qRef = useRef(quiz?.questions[0]);
  const answerLockRef = useRef(false);
  const timeoutFireRef = useRef(false);
  const trialFailureRecordedRef = useRef(false);
  quizRef.current = quiz;
  qRef.current = quiz?.questions[currentIndex];

  const dailyUrl = useMemo(() => {
    const sessionQuery = playSessionKey
      ? `session=${encodeURIComponent(playSessionKey)}`
      : null;
    if (initialDateParam) {
      return `/api/daily?date=${encodeURIComponent(initialDateParam)}${
        sessionQuery ? `&${sessionQuery}` : ""
      }`;
    }
    return sessionQuery ? `/api/daily?${sessionQuery}` : "/api/daily";
  }, [initialDateParam, playSessionKey]);

  useEffect(() => {
    const saved = readPersistedPlaySession();
    setPlaySessionKey(saved?.sessionKey ?? createSessionKey());
    const state = getSubscriptionState();
    setSubscribed(state.active);
    if (state.channel) setSubChannel(state.channel);
    if (state.msisdn) setSubscriberMsisdn(state.msisdn);
    setLastChargedDate(state.lastChargedDate ?? null);
  }, []);

  useEffect(() => {
    if (!quiz) return;
    const saved = readPersistedPlaySession();
    if (!saved || saved.date !== quiz.date || saved.sessionKey !== quiz.sessionKey || !saved.inProgress) {
      setResumeIndex(null);
      writePersistedPlaySession({
        date: quiz.date,
        sessionKey: quiz.sessionKey,
        inProgress: false,
        currentIndex: 0,
      });
      return;
    }
    setResumeIndex(Math.min(saved.currentIndex, Math.max(quiz.questionCount - 1, 0)));
  }, [quiz]);

  useEffect(() => {
    if (!quiz) return;
    const inProgress = started && !gameEnd;
    writePersistedPlaySession({
      date: quiz.date,
      sessionKey: quiz.sessionKey,
      inProgress,
      currentIndex,
    });
    setResumeIndex(inProgress ? currentIndex : null);
  }, [quiz, started, gameEnd, currentIndex]);

  useEffect(() => {
    if (!quiz) return;
    const url = new URL(window.location.href);
    const paystackReturn = url.searchParams.get("paystack_return");
    const reference = url.searchParams.get("reference") ?? url.searchParams.get("trxref");
    if (!paystackReturn || !reference) return;

    void (async () => {
      setSubscriptionBusy(true);
      setError(null);
      try {
        const verifyRes = await fetch("/api/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const verifyData = (await verifyRes.json()) as { error?: string };
        if (!verifyRes.ok) {
          setError(verifyData.error ?? "Payment verification failed");
          return;
        }

        const state = getSubscriptionState();
        const endpoint =
          state.active && state.lastChargedDate !== quiz.date
            ? "/api/subscription/renew"
            : "/api/subscription/activate";

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel: "web",
            msisdn: subscriberMsisdn.trim() || state.msisdn,
            date: quiz.date,
            paystackReference: reference,
          }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? "Could not finalize web subscription");
          return;
        }

        setSubscriptionState({
          active: true,
          channel: "web",
          msisdn: subscriberMsisdn.trim() || state.msisdn || "",
          activatedAt: state.activatedAt ?? new Date().toISOString(),
          lastChargedDate: quiz.date,
        });
        setSubscribed(true);
        setSubChannel("web");
        setLastChargedDate(quiz.date);
      } catch {
        setError("Network error.");
      } finally {
        const clean = new URL(window.location.href);
        clean.searchParams.delete("paystack_return");
        clean.searchParams.delete("reference");
        clean.searchParams.delete("trxref");
        window.history.replaceState({}, "", clean.pathname + clean.search);
        setSubscriptionBusy(false);
      }
    })();
  }, [quiz, subscriberMsisdn]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) return;
        const data = (await res.json()) as { authenticated?: boolean; user?: { phone?: string } };
        if (data.authenticated && data.user?.phone) {
          setAuthenticated(true);
          setAuthPhone(data.user.phone);
          setSubscriberMsisdn(data.user.phone);
        }
      } catch {
        // ignore initial auth check failures
      }
    })();
  }, []);

  useEffect(() => {
    if (!authenticated) {
      setHistoryStatus(null);
      setHistoryItems([]);
      return;
    }
    void (async () => {
      setHistoryLoading(true);
      try {
        const res = await fetch("/api/subscription/history?limit=50");
        if (!res.ok) {
          setHistoryStatus(null);
          setHistoryItems([]);
          return;
        }
        const data = (await res.json()) as SubscriptionHistoryResponse;
        setHistoryStatus(data.subscription);
        setHistoryItems(data.transactions ?? []);
        if (data.subscription.active) {
          const providerChannel: AccessChannel =
            data.subscription.activeVia === "network" ? "sms" : "web";
          const inferredLastChargedDate =
            toDateOnly(data.subscription.lastEventAt) ??
            toDateOnly(data.transactions[0]?.occurredAt ?? null);
          setSubscribed(true);
          setSubChannel(providerChannel);
          if (inferredLastChargedDate) setLastChargedDate(inferredLastChargedDate);
          if (data.msisdn) {
            setSubscriberMsisdn(data.msisdn);
            setSubscriptionState({
              active: true,
              channel: providerChannel,
              msisdn: data.msisdn,
              activatedAt: data.subscription.lastEventAt,
              lastChargedDate: inferredLastChargedDate,
            });
          }
        } else {
          setSubscribed(false);
          setSubscriptionState({
            active: false,
            channel: null,
            msisdn: data.msisdn ?? (subscriberMsisdn || null),
            activatedAt: null,
            lastChargedDate: null,
          });
        }
      } catch {
        setHistoryStatus(null);
        setHistoryItems([]);
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, [authenticated, lastChargedDate, subscriberMsisdn]);

  const fetchTrialStatus = useCallback(async () => {
    if (!authenticated) {
      setTrialStatus(null);
      return;
    }
    try {
      const res = await fetch(`/api/trial/status?channel=${preferredPlayChannel}`);
      if (!res.ok) {
        setTrialStatus(null);
        return;
      }
      const data = (await res.json()) as TrialStatusResponse;
      setTrialStatus(data);
    } catch {
      setTrialStatus(null);
    }
  }, [authenticated, preferredPlayChannel]);

  useEffect(() => {
    void fetchTrialStatus();
  }, [fetchTrialStatus]);

  const trialSessionsLeft = trialStatus?.trialsLeft ?? 0;

  const load = useCallback(async () => {
    if (!playSessionKey) return;
    setLoading(true);
    setLoadError(null);
    setStarted(false);
    setCurrentIndex(0);
    setSelected(null);
    setLastAnswer(null);
    setGameEnd(null);
    setFiftyUsed(false);
    setAudienceUsed(false);
    setHiddenIndices([]);
    setAudiencePct(null);
    setSecondsLeft(SECONDS_PER_QUESTION);
    setIsTrialSession(false);
    trialFailureRecordedRef.current = false;
    setPendingStageIndex(0);
    try {
      const res = await fetch(dailyUrl);
      if (!res.ok) throw new Error("Could not load quiz");
      const data = (await res.json()) as DailyQuiz;
      setQuiz(data);
    } catch {
      setLoadError("Something went wrong loading the quiz. Try again.");
    } finally {
      setLoading(false);
    }
  }, [dailyUrl, playSessionKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const q = quiz?.questions[currentIndex];
  const total = quiz?.questionCount ?? 0;
  const totalLevels = quiz?.totalLevels ?? 0;
  const totalStages = Math.max(Math.ceil(total / LEVELS_PER_STAGE), 1);
  const currentStageIndex = Math.floor(currentIndex / LEVELS_PER_STAGE);

  const bankedPoints = useMemo(() => {
    if (!quiz) return 0;
    return currentIndex * POINTS_PER_QUESTION;
  }, [quiz, currentIndex]);

  useEffect(() => {
    answerLockRef.current = false;
    setSelected(null);
    setLastAnswer(null);
    setHiddenIndices([]);
    setAudiencePct(null);
    setError(null);
    setSecondsLeft(SECONDS_PER_QUESTION);
  }, [currentIndex, q?.id]);

  const submitTimeout = useCallback(async () => {
    const qNow = qRef.current;
    const quizNow = quizRef.current;
    if (!quizNow || !qNow || answerLockRef.current) return;
    answerLockRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: quizNow.date,
          sessionKey: quizNow.sessionKey,
          questionId: qNow.id,
          timedOut: true,
          channel: subChannel,
          msisdn: subscriberMsisdn.trim(),
        }),
      });
      const data = (await res.json()) as AnswerOk & { error?: string };
      if (!res.ok) {
        answerLockRef.current = false;
        setError(typeof data.error === "string" ? data.error : "Timeout failed");
        setSubmitting(false);
        return;
      }
      setLastAnswer(data as AnswerOk);
    } catch {
      answerLockRef.current = false;
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }, [subChannel, subscriberMsisdn]);

  const recordTrialFailure = useCallback(async (reason: "wrong" | "timeout") => {
    if (!isTrialSession || trialFailureRecordedRef.current) return;
    trialFailureRecordedRef.current = true;
    try {
      await fetch("/api/trial/fail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: subChannel, reason }),
      });
      await fetchTrialStatus();
    } catch {
      // ignore telemetry failure, but prevent duplicate calls
    }
  }, [isTrialSession, subChannel, fetchTrialStatus]);

  useEffect(() => {
    timeoutFireRef.current = false;
    if (!started || !q?.id || lastAnswer !== null || submitting) return;

    const deadline = Date.now() + SECONDS_PER_QUESTION * 1000;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0 && !timeoutFireRef.current) {
        timeoutFireRef.current = true;
        void submitTimeout();
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [started, q?.id, currentIndex, lastAnswer, submitting, submitTimeout]);

  useEffect(() => {
    if (!lastAnswer || lastAnswer.correct) return;
    window.alert("Game over! You failed this question.");
    const reason =
      "timedOut" in lastAnswer && lastAnswer.timedOut ? "timeout" : "wrong";
    void recordTrialFailure(reason);
  }, [lastAnswer, recordTrialFailure]);

  async function submitAnswer() {
    if (!quiz || !q || selected === null || answerLockRef.current) return;
    answerLockRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: quiz.date,
          sessionKey: quiz.sessionKey,
          questionId: q.id,
          selectedIndex: selected,
          channel: subChannel,
          msisdn: subscriberMsisdn.trim(),
        }),
      });
      const data = (await res.json()) as AnswerOk & { error?: string };
      if (!res.ok) {
        answerLockRef.current = false;
        setError(typeof data.error === "string" ? data.error : "Could not check answer");
        return;
      }
      setLastAnswer(data as AnswerOk);
    } catch {
      answerLockRef.current = false;
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  function nextQuestion() {
    if (!quiz) return;
    if (currentIndex >= total - 1) return;
    setLastAnswer(null);
    setCurrentIndex((i) => {
      const next = i + 1;
      const nextStage = Math.floor(next / LEVELS_PER_STAGE);
      const prevStage = Math.floor(i / LEVELS_PER_STAGE);
      if (nextStage > prevStage) {
        setPendingStageIndex(nextStage);
      }
      return next;
    });
  }

  function goToPreviousQuestion() {
    if (currentIndex <= 0) return;
    setLastAnswer(null);
    setSelected(null);
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }

  async function applyFiftyFifty() {
    if (!quiz || !q || fiftyUsed) return;
    setError(null);
    try {
      const res = await fetch("/api/lifelines/fifty-fifty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: quiz.date,
          questionId: q.id,
          sessionKey: quiz.sessionKey,
        }),
      });
      const data = (await res.json()) as { removeIndices?: number[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "50:50 failed");
        return;
      }
      setHiddenIndices(data.removeIndices ?? []);
      setFiftyUsed(true);
    } catch {
      setError("Network error.");
    }
  }

  async function applyAudiencePoll() {
    if (!quiz || !q || audienceUsed) return;
    setError(null);
    try {
      const res = await fetch("/api/lifelines/audience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: quiz.date,
          questionId: q.id,
          sessionKey: quiz.sessionKey,
        }),
      });
      const data = (await res.json()) as { percentages?: number[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Poll failed");
        return;
      }
      setAudiencePct(data.percentages ?? null);
      setAudienceUsed(true);
    } catch {
      setError("Network error.");
    }
  }

  function bankPointsAndExit() {
    setGameEnd({ kind: "walk", points: bankedPoints });
  }

  async function signInOrSignUp(mode: "sign-in" | "sign-up") {
    if (!authPhone.trim() || !authPassword.trim()) {
      setError("Enter phone number and password.");
      return;
    }
    setAuthBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: authPhone.trim(),
          password: authPassword,
        }),
      });
      const data = (await res.json()) as {
        authenticated?: boolean;
        user?: { phone?: string };
        error?: string;
      };
      if (!res.ok || !data.authenticated || !data.user?.phone) {
        setError(data.error ?? "Authentication failed");
        return;
      }
      setAuthenticated(true);
      setSubscriberMsisdn(data.user.phone);
      setAuthPassword("");
      setShowForgotPassword(false);
      setForgotPassword("");
      setNotice(null);
    } catch {
      setError("Network error.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function resetForgottenPassword() {
    if (!authPhone.trim() || !forgotPassword.trim()) {
      setError("Enter phone number and a new password.");
      return;
    }
    setAuthBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: authPhone.trim(),
          password: forgotPassword,
        }),
      });
      const data = (await res.json()) as { reset?: boolean; error?: string };
      if (!res.ok || !data.reset) {
        setError(data.error ?? "Could not reset password");
        return;
      }
      setShowForgotPassword(false);
      setForgotPassword("");
      setNotice("Password reset successful. Sign in now.");
    } catch {
      setError("Network error.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function startTrialSession() {
    setSubscriptionBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/trial/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: preferredPlayChannel }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Trial session unavailable");
        return;
      }
      setSubChannel(preferredPlayChannel);
      setIsTrialSession(true);
      trialFailureRecordedRef.current = false;
      if (resumeIndex !== null) {
        setCurrentIndex(resumeIndex);
        setPendingStageIndex(Math.floor(resumeIndex / LEVELS_PER_STAGE));
      } else {
        setCurrentIndex(0);
        setPendingStageIndex(0);
      }
      setStarted(true);
      await fetchTrialStatus();
    } catch {
      setError("Network error.");
    } finally {
      setSubscriptionBusy(false);
    }
  }

  async function signOut() {
    setAuthBusy(true);
    setError(null);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      setAuthenticated(false);
      setStarted(false);
      setSubscribed(false);
      setTrialStatus(null);
      setIsTrialSession(false);
    } catch {
      setError("Could not sign out.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function initializePaystackPayment(): Promise<void> {
    const callbackUrl = `${window.location.origin}/?paystack_return=1`;
    const res = await fetch("/api/paystack/initialize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: subscriberMsisdn.trim(),
        callbackUrl,
      }),
    });
    const data = (await res.json()) as {
      authorizationUrl?: string;
      reference?: string;
      error?: string;
    };
    if (!res.ok || !data.authorizationUrl) {
      setError(data.error ?? "Failed to start Paystack payment");
      return;
    }
    window.location.href = data.authorizationUrl;
  }

  async function activateSubscription(channel: AccessChannel, paystackReference?: string) {
    if (!quiz) return;
    if (!subscriberMsisdn.trim()) {
      setError("Enter your MTN number to activate subscription.");
      return;
    }
    setSubscriptionBusy(true);
    setError(null);
    try {
      if (channel === "web" && !paystackReference) {
        await initializePaystackPayment();
        return;
      }
      const res = await fetch("/api/subscription/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          msisdn: subscriberMsisdn.trim(),
          keyword: channel === "sms" ? DEFAULT_SUBSCRIBE_KEYWORD : undefined,
          date: quiz.date,
          paystackReference,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not activate subscription");
        return;
      }
      const nextState = {
        active: true,
        channel,
        msisdn: subscriberMsisdn.trim(),
        activatedAt: new Date().toISOString(),
        lastChargedDate: quiz.date,
      } as const;
      setSubscriptionState(nextState);
      setSubscribed(true);
      setSubChannel(channel);
      setLastChargedDate(quiz.date);
    } catch {
      setError("Network error.");
    } finally {
      setSubscriptionBusy(false);
    }
  }

  async function renewIfNeeded() {
    if (!quiz) return true;
    const state = getSubscriptionState();
    if (!state.active || !state.msisdn) return false;
    if (state.lastChargedDate === quiz.date) return true;
    setSubscriptionBusy(true);
    setError(null);
    try {
      if (state.channel === "web") {
        await initializePaystackPayment();
        return false;
      }

      const res = await fetch("/api/subscription/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msisdn: state.msisdn,
          date: quiz.date,
          channel: state.channel,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Daily renewal charge failed");
        return false;
      }
      setSubscriptionState({
        ...state,
        lastChargedDate: quiz.date,
      });
      setLastChargedDate(quiz.date);
      return true;
    } catch {
      setError("Network error.");
      return false;
    } finally {
      setSubscriptionBusy(false);
    }
  }

  async function optOutSubscription() {
    const state = getSubscriptionState();
    if (!state.msisdn) return;
    setSubscriptionBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/subscription/opt-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          msisdn: state.msisdn,
          channel: state.channel ?? "web",
          reason: "user_requested",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not process opt-out");
        return;
      }
      setSubscriptionState({
        active: false,
        channel: null,
        msisdn: state.msisdn,
        activatedAt: state.activatedAt,
        lastChargedDate: state.lastChargedDate,
      });
      setSubscribed(false);
      setStarted(false);
    } catch {
      setError("Network error.");
    } finally {
      setSubscriptionBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-4xl border border-white/6 bg-slate-950/40 px-8 py-16">
        <div className="h-10 w-10 animate-pulse rounded-full border-2 border-amber-400/40 border-t-transparent" />
        <p className="text-sm text-slate-500">Loading today’s questions…</p>
      </div>
    );
  }

  if (loadError || !quiz) {
    return (
      <div className="rounded-4xl border border-white/8 bg-slate-900/50 p-10 text-center backdrop-blur-sm">
        <p className="text-slate-200">{loadError ?? "No quiz"}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-6 rounded-full bg-amber-500 px-8 py-2.5 text-sm font-semibold uppercase tracking-wide text-slate-950 transition hover:bg-amber-400"
        >
          Try again
        </button>
      </div>
    );
  }

  if (gameEnd) {
    const title =
      gameEnd.kind === "won"
        ? "Perfect run!"
        : gameEnd.kind === "walk"
          ? "You banked your points"
          : gameEnd.reason === "timeout"
            ? "Time’s up!"
            : "That’s the wrong answer";
    const sub =
      gameEnd.kind === "won"
        ? "You cleared every level today — top of the ladder."
        : gameEnd.kind === "walk"
          ? WALK_SUB
          : pickLossEncouragement(gameEnd.reason);

    return (
      <div className="mx-auto max-w-lg space-y-8 text-center">
        <div className="relative flex flex-col items-center overflow-hidden rounded-4xl border border-amber-500/25 bg-linear-to-br from-amber-500/8 via-slate-900/80 to-slate-950 px-6 py-10 sm:px-10 sm:py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-400/90">
            {title}
          </p>
          {gameEnd.kind === "won" && (
            <p className="mt-5 max-w-md text-lg font-semibold leading-snug text-amber-100/95 sm:text-xl">
              {pickWinCongratulations(quiz.date)}
            </p>
          )}
          <p className="mt-6 font-(family-name:--font-stage) text-5xl font-bold tabular-nums tracking-tight text-white sm:text-6xl">
            {formatPoints(gameEnd.points)}
          </p>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">{sub}</p>
          <p className="mt-8 text-xs text-slate-600">
            Subscription remains active. Send {DEFAULT_OPT_OUT_KEYWORD} to {DEFAULT_SHORTCODE} to opt out.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="w-full rounded-full border border-white/10 bg-white/3 py-3.5 text-sm font-medium text-slate-200 transition hover:bg-white/6"
        >
          Back
        </button>
      </div>
    );
  }

  if (!started) {
    const topPts = total * POINTS_PER_QUESTION;
    const subscriptionExpired = subscribed && !!quiz && lastChargedDate !== quiz.date;
    const canPlayNow = subscribed && !subscriptionExpired && !historyLoading;
    const canResumeNow = canPlayNow && resumeIndex !== null;
    const trialStatusLoading = authenticated && !canPlayNow && trialStatus === null;
    const canStartTrialNow =
      authenticated && !canPlayNow && !trialStatusLoading && trialSessionsLeft > 0;
    const subscriptionExpiresOn = addOneDay(lastChargedDate);
    const subscriptionExpiresLabel = formatLagosExpiryDateTime(subscriptionExpiresOn);
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-stretch">
        <div className="flex flex-col justify-between rounded-4xl border border-white/[0.07] bg-linear-to-b from-slate-900/80 to-slate-950/90 p-8 sm:p-10">
          <div className="space-y-4">
            <h2 className="font-(family-name:--font-stage) text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              MTN VAS trivia service
            </h2>
            <p className="rounded-xl border border-amber-500/20 bg-amber-500/6 px-4 py-3 text-lg leading-relaxed text-amber-100/80">
              <span className="font-semibold text-amber-200">Consent and charging notice:</span> by activating, you confirm opt-in for
              daily trivia access and billing through MTN infrastructure.
            </p>
            <p className="text-sm text-slate-500">
              Questions cover general knowledge, sports, entertainment, lifestyle, and current affairs.
            </p>
            <p className="text-xs text-slate-600">
              Send <strong>{DEFAULT_OPT_OUT_KEYWORD}</strong> to <strong>{DEFAULT_SHORTCODE}</strong> anytime to opt out.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-white/6 pt-8">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
                Quiz date
              </p>
              <p className="mt-1 font-mono text-sm text-slate-300">{quiz.date}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
                Levels
              </p>
              <p className="mt-1 font-(family-name:--font-stage) text-2xl font-bold text-white">
                {totalLevels || total}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-4xl border border-amber-500/20 bg-linear-to-b from-amber-950/40 to-slate-950 p-8 text-center">
          {!authenticated && !canPlayNow ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
                Web access
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-full border border-white/10 bg-black/25 p-1">
                <button
                  type="button"
                  onClick={() => setAuthMode("sign-in")}
                  className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-wide ${
                    authMode === "sign-in"
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-300"
                  }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode("sign-up")}
                  className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-wide ${
                    authMode === "sign-up"
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-300"
                  }`}
                >
                  Sign up
                </button>
              </div>
              <input
                type="tel"
                value={authPhone}
                onChange={(e) => setAuthPhone(e.target.value)}
                placeholder="Phone number"
                className="mt-4 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400/50"
              />
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder={authMode === "sign-in" ? "Password" : "Create password"}
                className="mt-3 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400/50"
              />
              {showForgotPassword && (
                <input
                  type="password"
                  value={forgotPassword}
                  onChange={(e) => setForgotPassword(e.target.value)}
                  placeholder="New password"
                  className="mt-3 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400/50"
                />
              )}
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => void signInOrSignUp(authMode)}
                  className="w-full rounded-full bg-linear-to-r from-amber-400 via-amber-500 to-amber-600 py-3 text-xs font-bold uppercase tracking-widest text-slate-950 disabled:opacity-50"
                >
                  {authMode === "sign-in" ? "Login" : "Create account"}
                </button>
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={() => {
                    setShowForgotPassword((v) => !v);
                    setError(null);
                  }}
                  className="w-full rounded-full border border-amber-400/40 bg-transparent py-3 text-xs font-bold uppercase tracking-widest text-amber-200 disabled:opacity-50"
                >
                  {showForgotPassword ? "Hide forgot password" : "Forgot password"}
                </button>
                {showForgotPassword && (
                  <button
                    type="button"
                    disabled={authBusy}
                    onClick={() => void resetForgottenPassword()}
                    className="w-full rounded-full border border-white/20 bg-transparent py-3 text-xs font-bold uppercase tracking-widest text-white disabled:opacity-50"
                  >
                    Reset password
                  </button>
                )}
              </div>
            </>
          ) : !subscribed && trialStatusLoading ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
                Checking trial status
              </p>
              <p className="mt-4 text-xs text-slate-400">Please wait…</p>
            </>
          ) : !subscribed && !canStartTrialNow ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
                Activate subscription
              </p>
              <input
                type="tel"
                value={subscriberMsisdn}
                onChange={(e) => setSubscriberMsisdn(e.target.value)}
                placeholder="MTN number (e.g. 0803...)"
                className="mt-4 w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-amber-400/50"
              />
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  disabled={subscriptionBusy}
                  onClick={() => void activateSubscription("web")}
                  className="w-full rounded-full bg-linear-to-r from-amber-400 via-amber-500 to-amber-600 py-3 text-xs font-bold uppercase tracking-widest text-slate-950 disabled:opacity-50"
                >
                  Activate on web ({formatNaira(DAILY_SUBSCRIPTION_FEE_NAIRA)})
                </button>
                <button
                  type="button"
                  disabled={subscriptionBusy}
                  onClick={() => void activateSubscription("sms")}
                  className="w-full rounded-full border border-amber-400/40 bg-transparent py-3 text-xs font-bold uppercase tracking-widest text-amber-200 disabled:opacity-50"
                >
                  Simulate SMS opt-in ({DEFAULT_SUBSCRIBE_KEYWORD})
                </button>
              </div>
            </>
          ) : !subscribed && canStartTrialNow ? (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
                Start your free trial
              </p>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Trial access ends after 2 failed attempts. Choose channel and start.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 rounded-full border border-white/10 bg-black/25 p-1">
                <button
                  type="button"
                  onClick={() => setPreferredPlayChannel("web")}
                  className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-wide ${
                    preferredPlayChannel === "web"
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-300"
                  }`}
                >
                  Web trial
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredPlayChannel("sms")}
                  className={`rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-wide ${
                    preferredPlayChannel === "sms"
                      ? "bg-amber-500 text-slate-950"
                      : "text-slate-300"
                  }`}
                >
                  Network trial
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Failed attempts left ({preferredPlayChannel.toUpperCase()}): {trialSessionsLeft}
              </p>
              <div className="mt-2 inline-flex items-center rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-amber-200">
                {(trialStatus?.failedAttempts ?? 0)}/{trialStatus?.trialLimit ?? 2} failed attempts used
              </div>
              <button
                type="button"
                disabled={subscriptionBusy || trialSessionsLeft <= 0}
                onClick={() => void startTrialSession()}
                className="mt-4 w-full rounded-full bg-linear-to-r from-amber-400 via-amber-500 to-amber-600 py-4 text-sm font-bold uppercase tracking-widest text-slate-950 shadow-lg shadow-amber-900/30 transition hover:brightness-105 disabled:opacity-50"
              >
                Start trial session
              </button>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                After 2 failed attempts, you need an active subscription to continue.
              </p>
            </>
          ) : (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
                {subscriptionExpired
                  ? "Subscription expired"
                  : `Subscription active (${subChannel.toUpperCase()})`}
              </p>
              <p className="mt-3 font-(family-name:--font-stage) text-4xl font-bold text-amber-200">
                {formatPoints(topPts)}
              </p>
              <p className="mt-2 text-xs text-slate-500">daily max score</p>
              {subscriptionExpiresOn && (
                <p className="mt-2 text-xs text-amber-100/80">
                  Expires at: <span className="font-semibold">{subscriptionExpiresLabel ?? "N/A"}</span>
                </p>
              )}
              <button
                type="button"
                disabled={subscriptionBusy}
                onClick={async () => {
                  if (subscriptionExpired) {
                    const renewed = await renewIfNeeded();
                    if (renewed) {
                      setIsTrialSession(false);
                      trialFailureRecordedRef.current = false;
                      setCurrentIndex(0);
                      setPendingStageIndex(0);
                      setStarted(true);
                    }
                    return;
                  }
                  if (canResumeNow) {
                    setCurrentIndex(resumeIndex);
                    setPendingStageIndex(Math.floor(resumeIndex / LEVELS_PER_STAGE));
                  } else {
                    setCurrentIndex(0);
                    setPendingStageIndex(0);
                  }
                  setIsTrialSession(false);
                  trialFailureRecordedRef.current = false;
                  setStarted(true);
                }}
                className="mt-6 w-full rounded-full bg-linear-to-r from-amber-400 via-amber-500 to-amber-600 py-4 text-sm font-bold uppercase tracking-widest text-slate-950 shadow-lg shadow-amber-900/30 transition hover:brightness-105 disabled:opacity-50"
              >
                {subscriptionExpired
                  ? "Renew subscription to play"
                  : canResumeNow
                    ? "Continue to Play"
                    : "Start Daily Session"}
              </button>
              <button
                type="button"
                disabled={subscriptionBusy}
                onClick={() => void optOutSubscription()}
                className="mt-3 w-full rounded-full border border-white/20 py-3 text-xs font-semibold uppercase tracking-widest text-slate-300 disabled:opacity-50"
              >
                Opt out
              </button>
              <button
                type="button"
                disabled={authBusy}
                onClick={() => void signOut()}
                className="mt-2 w-full rounded-full border border-white/20 py-3 text-xs font-semibold uppercase tracking-widest text-slate-300 disabled:opacity-50"
              >
                Sign out
              </button>
            </>
          )}

          {notice && (
            <p className="mt-4 text-xs text-emerald-300" role="status">
              {notice}
            </p>
          )}
          {error && (
            <p className="mt-3 text-xs text-red-300" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => window.history.back()}
            className="mt-3 w-full rounded-full border border-white/15 py-3 text-xs font-semibold uppercase tracking-widest text-slate-300"
          >
            Back
          </button>

          <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-3 text-left">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              Subscription history
            </p>
            {!authenticated ? (
              <p className="mt-2 text-xs text-slate-500">
                Sign in to view Active/Inactive status and recent transactions.
              </p>
            ) : historyLoading ? (
              <p className="mt-2 text-xs text-slate-500">Loading history…</p>
            ) : (
              <>
                <p className="mt-2 text-xs text-slate-300">
                  Status:{" "}
                  <span className={historyStatus?.active ? "text-emerald-300" : "text-rose-300"}>
                    {historyStatus?.active ? "Active" : "Inactive"}
                  </span>
                  {historyStatus?.activeVia ? ` via ${historyStatus.activeVia}` : ""}
                </p>
                {historyItems.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">No recent transactions.</p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {historyItems.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-md border border-white/6 bg-white/3 px-2.5 py-1.5 text-[11px] text-slate-300"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="uppercase tracking-wide text-slate-400">
                            {item.eventType.replaceAll("_", " ")}
                          </span>
                          <span>{new Date(item.occurredAt).toLocaleDateString("en-NG")}</span>
                        </div>
                        <div className="mt-0.5 text-slate-500">
                          {item.provider} · {item.status}
                          {typeof item.amountNaira === "number"
                            ? ` · ${formatNaira(item.amountNaira)}`
                            : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!q) {
    return null;
  }

  if (pendingStageIndex !== null && pendingStageIndex === currentStageIndex) {
    const levelStart = pendingStageIndex * LEVELS_PER_STAGE + 1;
    const levelEnd = Math.min((pendingStageIndex + 1) * LEVELS_PER_STAGE, total);
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <div className="rounded-4xl border border-amber-500/25 bg-linear-to-br from-amber-500/8 via-slate-900/80 to-slate-950 px-6 py-10 sm:px-10 sm:py-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-400/90">
            Level {pendingStageIndex + 1}
          </p>
          <p className="mt-4 text-sm text-slate-300">
            Questions {levelStart} to {levelEnd}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Stage {pendingStageIndex + 1} of {totalStages}
          </p>
          <button
            type="button"
            onClick={() => setPendingStageIndex(null)}
            className="mt-8 w-full rounded-full bg-linear-to-r from-amber-400 via-amber-500 to-amber-600 py-4 text-sm font-bold uppercase tracking-widest text-slate-950"
          >
            Continue to level {pendingStageIndex + 1}
          </button>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="mt-3 w-full rounded-full border border-white/15 py-3 text-xs font-semibold uppercase tracking-widest text-slate-300"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  const showReveal = lastAnswer !== null;
  const canBank =
    !showReveal && !submitting && bankedPoints > 0 && currentIndex < total;
  const timerPct = (secondsLeft / SECONDS_PER_QUESTION) * 100;

  return (
    <>
    <div className="relative overflow-hidden rounded-4xl border border-white/8 bg-linear-to-b from-slate-900/90 via-[#070b14] to-black shadow-[0_0_0_1px_rgba(251,191,36,0.06),0_32px_64px_-24px_rgba(0,0,0,0.7)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-amber-400/40 to-transparent"
      />

      <div className="grid gap-0">
        <div className="space-y-6 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 font-(family-name:--font-stage) text-sm font-semibold uppercase tracking-wide text-amber-200">
                <span className="text-amber-400/80">Q</span>
                {q.level}
                <span className="text-amber-500/50">/</span>
                {total}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {CATEGORY_LABELS[q.category as CategoryId]}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-300/90">
                Level {currentStageIndex + 1}/{totalStages}
              </span>
            </div>
            {!showReveal && (
              <div
                className="flex min-w-30 flex-col items-end gap-1"
                role="timer"
                aria-live="polite"
                aria-label={`${secondsLeft} seconds left`}
              >
                <span className="font-(family-name:--font-stage) text-2xl font-bold tabular-nums text-amber-300">
                  {secondsLeft}s
                </span>
                <div className="h-1.5 w-full max-w-30 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-[width] duration-200 ${
                      secondsLeft <= 10 ? "bg-red-500" : "bg-amber-400"
                    }`}
                    style={{ width: `${timerPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <p className="font-(family-name:--font-stage) text-[1.35rem] font-medium leading-snug text-white sm:text-2xl sm:leading-snug">
            {q.text}
          </p>
          {!showReveal && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={fiftyUsed}
                onClick={() => void applyFiftyFifty()}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-amber-500/35 bg-linear-to-b from-amber-950/60 to-slate-950/80 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-100 transition enabled:hover:border-amber-400/50 enabled:hover:bg-amber-950/80 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <span className="text-base leading-none">50:50</span>
                <span className="text-[10px] font-normal normal-case tracking-normal text-amber-200/60">
                  Remove two wrong answers
                </span>
              </button>
              <button
                type="button"
                disabled={audienceUsed}
                onClick={() => void applyAudiencePoll()}
                className="flex min-h-11 items-center gap-2 rounded-xl border border-sky-500/35 bg-linear-to-b from-sky-950/50 to-slate-950/80 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-sky-100 transition enabled:hover:border-sky-400/50 enabled:hover:bg-sky-950/70 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <span className="text-base leading-none">Poll</span>
                <span className="text-[10px] font-normal normal-case tracking-normal text-sky-200/60">
                  Ask the audience
                </span>
              </button>
            </div>
          )}

          {audiencePct && !showReveal && (
            <div className="rounded-2xl border border-white/6 bg-black/30 p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                Audience
              </p>
              <div className="mt-4 grid gap-3">
                {q.options.map((opt, idx) => {
                  if (hiddenIndices.includes(idx)) return null;
                  const pct = audiencePct[idx] ?? 0;
                  return (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <span className="w-4 shrink-0 text-center font-mono text-slate-500">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-sky-600 to-sky-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right tabular-nums text-slate-400">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-3">
            {q.options.map((opt, idx) => {
              if (hiddenIndices.includes(idx)) {
                return null;
              }
              const picked = selected === idx;
              let ring =
                "border-white/[0.08] bg-slate-900/50 hover:border-amber-500/25";
              if (showReveal && lastAnswer) {
                if (idx === lastAnswer.correctIndex) {
                  ring = "border-emerald-500/50 bg-emerald-950/40";
                } else if (
                  picked &&
                  !lastAnswer.correct &&
                  !("timedOut" in lastAnswer && lastAnswer.timedOut)
                ) {
                  ring = "border-red-500/45 bg-red-950/35";
                } else {
                  ring = "border-white/[0.05] bg-slate-950/40 opacity-55";
                }
              } else if (picked) {
                ring =
                  "border-amber-400/55 bg-gradient-to-r from-amber-950/50 to-slate-900/80 shadow-[0_0_20px_-4px_rgba(251,191,36,0.25)]";
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={showReveal || submitting}
                  onClick={() => !showReveal && setSelected(idx)}
                  className={`group relative flex w-full items-stretch gap-0 overflow-hidden rounded-2xl border text-left transition ${ring}`}
                >
                  <span
                    className={`flex w-11 shrink-0 items-center justify-center font-(family-name:--font-stage) text-lg font-bold ${
                      picked && !showReveal ? "text-amber-300" : "text-slate-500"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex flex-1 items-center border-l border-white/6 py-4 pr-4 text-[15px] leading-snug text-slate-100">
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>

          {showReveal &&
            lastAnswer &&
            !lastAnswer.correct &&
            "timedOut" in lastAnswer &&
            lastAnswer.timedOut && (
              <p className="text-sm font-medium text-amber-200/90">Time ran out — no answer locked in.</p>
            )}

          {error && (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
            {!showReveal && (
              <>
                {currentIndex > 0 && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={goToPreviousQuestion}
                    className="order-3 rounded-full border border-white/12 py-3.5 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/4 sm:order-1 sm:min-w-44"
                  >
                    Previous question
                  </button>
                )}
                {canBank && (
                  <button
                    type="button"
                    onClick={bankPointsAndExit}
                    className="order-2 rounded-full border border-white/12 py-3.5 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/4 sm:min-w-50"
                  >
                    Bank {formatPoints(bankedPoints)} &amp; exit
                  </button>
                )}
                <button
                  type="button"
                  disabled={selected === null || submitting}
                  onClick={() => void submitAnswer()}
                  className="order-1 flex-1 rounded-full bg-linear-to-r from-emerald-600 to-emerald-500 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-emerald-900/30 transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:order-3"
                >
                  {submitting ? "Checking…" : "Final answer"}
                </button>
              </>
            )}
            {showReveal && lastAnswer?.correct && !lastAnswer.isLast && (
              <button
                type="button"
                onClick={nextQuestion}
                className="w-full rounded-full bg-linear-to-r from-amber-400 via-amber-500 to-amber-600 py-4 text-sm font-bold uppercase tracking-widest text-slate-950 shadow-lg shadow-amber-900/25"
              >
                Next question
              </button>
            )}
            {showReveal && lastAnswer?.correct && lastAnswer.isLast && (
              <button
                type="button"
                onClick={() =>
                  setGameEnd({ kind: "won", points: lastAnswer.securedPoints })
                }
                className="w-full rounded-full bg-linear-to-r from-amber-400 via-amber-500 to-amber-600 py-4 text-sm font-bold uppercase tracking-widest text-slate-950 shadow-lg shadow-amber-900/25"
              >
                See final score
              </button>
            )}
            {showReveal && lastAnswer && !lastAnswer.correct && (
              <button
                type="button"
                onClick={async () => {
                  const reason =
                    "timedOut" in lastAnswer && lastAnswer.timedOut
                      ? "timeout"
                      : "wrong";
                  await recordTrialFailure(reason);
                  setGameEnd({
                    kind: "lost",
                    points: lastAnswer.pointsAfterWrong,
                    reason,
                  });
                }}
                className="w-full rounded-full border border-red-500/35 bg-red-950/40 py-4 text-sm font-bold uppercase tracking-widest text-red-100"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
