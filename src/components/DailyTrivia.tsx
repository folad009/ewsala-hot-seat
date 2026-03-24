"use client";

import { LifelinePaywall } from "@/components/LifelinePaywall";
import { CATEGORY_LABELS } from "@/lib/category-labels";
import { chargeForLifeline } from "@/lib/charge-lifeline";
import {
  isDailyPlayCompleted,
  markDailyPlayCompleted,
} from "@/lib/daily-play-limit";
import {
  formatNgn,
  getLifelineFeeNgn,
  type LifelineKind,
} from "@/lib/lifeline-pricing";
import { pointsBeforeQuestion } from "@/lib/ladder";
import { SECONDS_PER_QUESTION } from "@/lib/question-timer";
import type { CategoryId, DailyQuiz } from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const skipLifelinePayment =
  process.env.NEXT_PUBLIC_SKIP_LIFELINE_PAYMENT === "true";

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
  const [secondsLeft, setSecondsLeft] = useState(SECONDS_PER_QUESTION);

  const [fiftyUsed, setFiftyUsed] = useState(false);
  const [audienceUsed, setAudienceUsed] = useState(false);
  const [hiddenIndices, setHiddenIndices] = useState<number[]>([]);
  const [audiencePct, setAudiencePct] = useState<number[] | null>(null);
  const [paywallKind, setPaywallKind] = useState<LifelineKind | null>(null);
  const [paywallProcessing, setPaywallProcessing] = useState(false);

  const quizRef = useRef(quiz);
  const qRef = useRef(quiz?.questions[0]);
  const answerLockRef = useRef(false);
  const timeoutFireRef = useRef(false);
  quizRef.current = quiz;
  qRef.current = quiz?.questions[currentIndex];

  const dailyUrl = useMemo(() => {
    if (initialDateParam) {
      return `/api/daily?date=${encodeURIComponent(initialDateParam)}`;
    }
    return "/api/daily";
  }, [initialDateParam]);

  const load = useCallback(async () => {
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
    setPaywallKind(null);
    setPaywallProcessing(false);
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
  }, [dailyUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (gameEnd && quiz) {
      markDailyPlayCompleted(quiz.date);
    }
  }, [gameEnd, quiz]);

  const q = quiz?.questions[currentIndex];
  const ladder = quiz?.pointsLadder ?? [];
  const total = quiz?.questionCount ?? 0;

  const bankedPoints = useMemo(() => {
    if (!quiz) return 0;
    return pointsBeforeQuestion(currentIndex, quiz.pointsLadder);
  }, [quiz, currentIndex]);

  const alreadyPlayedToday = quiz ? isDailyPlayCompleted(quiz.date) : false;

  const feeFifty = useMemo(() => getLifelineFeeNgn("fifty"), []);
  const feeAudience = useMemo(() => getLifelineFeeNgn("audience"), []);

  useEffect(() => {
    answerLockRef.current = false;
    setSelected(null);
    setLastAnswer(null);
    setHiddenIndices([]);
    setAudiencePct(null);
    setError(null);
    setSecondsLeft(SECONDS_PER_QUESTION);
    setPaywallKind(null);
    setPaywallProcessing(false);
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
          questionId: qNow.id,
          timedOut: true,
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
  }, []);

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
          questionId: q.id,
          selectedIndex: selected,
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
    setCurrentIndex((i) => i + 1);
  }

  async function applyFiftyFifty() {
    if (!quiz || !q || fiftyUsed) return;
    setError(null);
    try {
      const res = await fetch("/api/lifelines/fifty-fifty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: quiz.date, questionId: q.id }),
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
        body: JSON.stringify({ date: quiz.date, questionId: q.id }),
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

  function requestFiftyFifty() {
    if (!quiz || !q || fiftyUsed) return;
    if (skipLifelinePayment) {
      void applyFiftyFifty();
      return;
    }
    setPaywallKind("fifty");
  }

  function requestAudiencePoll() {
    if (!quiz || !q || audienceUsed) return;
    if (skipLifelinePayment) {
      void applyAudiencePoll();
      return;
    }
    setPaywallKind("audience");
  }

  async function confirmPaywall() {
    if (!quiz || !q || !paywallKind) return;
    setPaywallProcessing(true);
    setError(null);
    const result = await chargeForLifeline(paywallKind, {
      quizDate: quiz.date,
      questionId: q.id,
    });
    if (!result.ok) {
      setError(result.error ?? "Payment failed");
      setPaywallProcessing(false);
      return;
    }
    const kind = paywallKind;
    setPaywallKind(null);
    setPaywallProcessing(false);
    if (kind === "fifty") await applyFiftyFifty();
    else await applyAudiencePoll();
  }

  function bankPointsAndExit() {
    setGameEnd({ kind: "walk", points: bankedPoints });
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[2rem] border border-white/[0.06] bg-slate-950/40 px-8 py-16">
        <div className="h-10 w-10 animate-pulse rounded-full border-2 border-amber-400/40 border-t-transparent" />
        <p className="text-sm text-slate-500">Loading today’s questions…</p>
      </div>
    );
  }

  if (loadError || !quiz) {
    return (
      <div className="rounded-[2rem] border border-white/[0.08] bg-slate-900/50 p-10 text-center backdrop-blur-sm">
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
          ? "Smart play. Your score is locked in for this round."
          : gameEnd.reason === "timeout"
            ? "You ran out of time on that question — same rules as a wrong answer."
            : "Checkpoints keep part of your score if you had reached one.";

    return (
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] via-slate-900/80 to-slate-950 p-8 sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/10 blur-3xl"
          />
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-400/90">
            {title}
          </p>
          <p className="mt-4 font-[family-name:var(--font-stage)] text-5xl font-bold tabular-nums tracking-tight text-white sm:text-6xl">
            {formatPoints(gameEnd.points)}
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">{sub}</p>
          <p className="mt-6 text-xs text-slate-600">
            Remember: this is trivia for fun — no cash or real prizes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="w-full rounded-full border border-white/10 bg-white/[0.03] py-3.5 text-sm font-medium text-slate-200 transition hover:bg-white/[0.06]"
        >
          {alreadyPlayedToday ? "Done for today" : "Back"}
        </button>
      </div>
    );
  }

  if (alreadyPlayedToday && !started) {
    return (
      <div className="rounded-[2rem] border border-amber-500/25 bg-gradient-to-b from-slate-900/90 to-slate-950 p-10 text-center">
        <p className="font-[family-name:var(--font-stage)] text-2xl font-bold uppercase tracking-tight text-white">
          You’ve already played today
        </p>
        <p className="mt-3 text-sm text-slate-400">
          One run per calendar day (Lagos time) for this quiz date:{" "}
          <span className="font-mono text-slate-300">{quiz.date}</span>
        </p>
        <p className="mt-4 text-xs text-slate-600">
          Come back after midnight Lagos for a new set. Use{" "}
          <code className="rounded bg-white/5 px-1.5 text-slate-500">?date=</code> in dev to try
          another day.
        </p>
      </div>
    );
  }

  if (!started) {
    const topPts = ladder[ladder.length - 1] ?? 0;
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-stretch">
        <div className="flex flex-col justify-between rounded-[2rem] border border-white/[0.07] bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-8 sm:p-10">
          <div className="space-y-4">
            <h2 className="font-[family-name:var(--font-stage)] text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              In the hot seat
            </h2>
            <p className="text-sm leading-relaxed text-slate-400">
              You have <strong className="text-amber-200">{SECONDS_PER_QUESTION} seconds</strong>{" "}
              per question — run out of time and it counts like a wrong answer. Lifelines (50:50 &
              audience) are <strong className="text-slate-200">paid per use</strong> before the hint
              is shown ({formatNgn(feeFifty)} / {formatNgn(feeAudience)} by default — configurable).
              Once each per game after payment.
            </p>
            <p className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-xs leading-relaxed text-amber-100/80">
              <span className="font-semibold text-amber-200">For fun only.</span> Points are for
              bragging rights — not money, vouchers, or prizes.
            </p>
            <p className="text-xs text-slate-600">
              One completed game per day on this device (stored in your browser). Clear site data
              to reset — real limits need sign-in on a server.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-white/[0.06] pt-8">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
                Quiz date (Lagos)
              </p>
              <p className="mt-1 font-mono text-sm text-slate-300">{quiz.date}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
                Levels
              </p>
              <p className="mt-1 font-[family-name:var(--font-stage)] text-2xl font-bold text-white">
                {total}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center rounded-[2rem] border border-amber-500/20 bg-gradient-to-b from-amber-950/40 to-slate-950 p-8 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400/80">
            Top of the ladder
          </p>
          <p className="mt-3 font-[family-name:var(--font-stage)] text-4xl font-bold text-amber-200">
            {formatPoints(topPts)}
          </p>
          <p className="mt-2 text-xs text-slate-500">today’s max (in-game points)</p>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="mt-8 w-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 py-4 text-sm font-bold uppercase tracking-widest text-slate-950 shadow-lg shadow-amber-900/30 transition hover:brightness-105"
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  if (!q) {
    return null;
  }

  const showReveal = lastAnswer !== null;
  const canBank =
    !showReveal && !submitting && bankedPoints > 0 && currentIndex < total;
  const timerPct = (secondsLeft / SECONDS_PER_QUESTION) * 100;

  return (
    <>
    <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-b from-slate-900/90 via-[#070b14] to-black shadow-[0_0_0_1px_rgba(251,191,36,0.06),0_32px_64px_-24px_rgba(0,0,0,0.7)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"
      />

      <div className="grid gap-0 lg:grid-cols-[1fr_minmax(0,240px)]">
        <div className="space-y-6 p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 font-[family-name:var(--font-stage)] text-sm font-semibold uppercase tracking-wide text-amber-200">
                <span className="text-amber-400/80">Q</span>
                {q.level}
                <span className="text-amber-500/50">/</span>
                {total}
              </span>
              <span className="text-xs font-medium text-slate-500">
                {CATEGORY_LABELS[q.category as CategoryId]}
              </span>
            </div>
            {!showReveal && (
              <div
                className="flex min-w-[120px] flex-col items-end gap-1"
                role="timer"
                aria-live="polite"
                aria-label={`${secondsLeft} seconds left`}
              >
                <span className="font-[family-name:var(--font-stage)] text-2xl font-bold tabular-nums text-amber-300">
                  {secondsLeft}s
                </span>
                <div className="h-1.5 w-full max-w-[120px] overflow-hidden rounded-full bg-white/10">
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

          <p className="font-[family-name:var(--font-stage)] text-[1.35rem] font-medium leading-snug text-white sm:text-2xl sm:leading-snug">
            {q.text}
          </p>

          {!showReveal && (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={fiftyUsed}
                onClick={requestFiftyFifty}
                className="flex min-h-[44px] items-center gap-2 rounded-xl border border-amber-500/35 bg-gradient-to-b from-amber-950/60 to-slate-950/80 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-amber-100 transition enabled:hover:border-amber-400/50 enabled:hover:bg-amber-950/80 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <span className="text-base leading-none">50:50</span>
                <span className="text-[10px] font-normal normal-case tracking-normal text-amber-200/60">
                  {skipLifelinePayment ? "Remove two" : `${formatNgn(feeFifty)} · Remove two`}
                </span>
              </button>
              <button
                type="button"
                disabled={audienceUsed}
                onClick={requestAudiencePoll}
                className="flex min-h-[44px] items-center gap-2 rounded-xl border border-sky-500/35 bg-gradient-to-b from-sky-950/50 to-slate-950/80 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-sky-100 transition enabled:hover:border-sky-400/50 enabled:hover:bg-sky-950/70 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <span className="text-base leading-none">Poll</span>
                <span className="text-[10px] font-normal normal-case tracking-normal text-sky-200/60">
                  {skipLifelinePayment
                    ? "Ask the audience"
                    : `${formatNgn(feeAudience)} · Ask the audience`}
                </span>
              </button>
            </div>
          )}

          {audiencePct && !showReveal && (
            <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-5">
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
                          className="h-full rounded-full bg-gradient-to-r from-sky-600 to-sky-400"
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
                    className={`flex w-11 shrink-0 items-center justify-center font-[family-name:var(--font-stage)] text-lg font-bold ${
                      picked && !showReveal ? "text-amber-300" : "text-slate-500"
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex flex-1 items-center border-l border-white/[0.06] py-4 pr-4 text-[15px] leading-snug text-slate-100">
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
                {canBank && (
                  <button
                    type="button"
                    onClick={bankPointsAndExit}
                    className="order-2 rounded-full border border-white/12 py-3.5 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.04] sm:order-1 sm:min-w-[200px]"
                  >
                    Bank {formatPoints(bankedPoints)} &amp; exit
                  </button>
                )}
                <button
                  type="button"
                  disabled={selected === null || submitting}
                  onClick={() => void submitAnswer()}
                  className="order-1 flex-1 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 py-4 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-emerald-900/30 transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 sm:order-2"
                >
                  {submitting ? "Checking…" : "Final answer"}
                </button>
              </>
            )}
            {showReveal && lastAnswer?.correct && !lastAnswer.isLast && (
              <button
                type="button"
                onClick={nextQuestion}
                className="w-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 py-4 text-sm font-bold uppercase tracking-widest text-slate-950 shadow-lg shadow-amber-900/25"
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
                className="w-full rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 py-4 text-sm font-bold uppercase tracking-widest text-slate-950 shadow-lg shadow-amber-900/25"
              >
                See final score
              </button>
            )}
            {showReveal && lastAnswer && !lastAnswer.correct && (
              <button
                type="button"
                onClick={() =>
                  setGameEnd({
                    kind: "lost",
                    points: lastAnswer.pointsAfterWrong,
                    reason:
                      "timedOut" in lastAnswer && lastAnswer.timedOut
                        ? "timeout"
                        : "wrong",
                  })
                }
                className="w-full rounded-full border border-red-500/35 bg-red-950/40 py-4 text-sm font-bold uppercase tracking-widest text-red-100"
              >
                Continue
              </button>
            )}
          </div>
        </div>

        <aside className="flex flex-col border-t border-white/[0.06] bg-gradient-to-b from-slate-900/50 to-black/60 lg:border-l lg:border-t-0">
          <div className="border-b border-white/[0.06] px-5 py-4 text-center">
            <p className="font-[family-name:var(--font-stage)] text-[11px] font-bold uppercase tracking-[0.35em] text-amber-400/90">
              Points ladder
            </p>
            <p className="mt-1 text-[10px] text-slate-600">In-game only</p>
          </div>
          <ol className="flex flex-1 flex-col-reverse gap-0.5 overflow-y-auto p-3">
            {ladder.map((pts, i) => {
              const level = i + 1;
              const isCurrent = level === q.level && !showReveal;
              const isDone =
                level < q.level ||
                (showReveal &&
                  lastAnswer?.correct === true &&
                  level <= lastAnswer.level);
              const isCheckpoint = quiz.checkpointLevels.includes(level);
              return (
                <li
                  key={level}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition ${
                    isCurrent
                      ? "bg-gradient-to-r from-amber-500/25 to-amber-600/10 font-semibold text-white ring-1 ring-amber-400/40"
                      : isDone
                        ? "bg-emerald-500/[0.07] text-emerald-100/90"
                        : "bg-white/[0.02] text-slate-500"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-4 tabular-nums opacity-70">{level}</span>
                    {isCheckpoint && (
                      <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-200/90">
                        Save
                      </span>
                    )}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-300">
                    {pts.toLocaleString("en-NG")}
                  </span>
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </div>
    <LifelinePaywall
      open={paywallKind !== null}
      kind={paywallKind}
      amountNgn={paywallKind ? getLifelineFeeNgn(paywallKind) : 0}
      processing={paywallProcessing}
      onCancel={() => {
        if (!paywallProcessing) setPaywallKind(null);
      }}
      onConfirm={() => void confirmPaywall()}
    />
    </>
  );
}
