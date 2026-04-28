import { QUESTION_BANK } from "@/data/questions";
import {
  getCheckpointLevels1Based,
  getPointsLadder,
} from "@/lib/ladder";
import type { CategoryId, DailyQuiz, PublicQuestionWithLevel, Question } from "@/lib/types";

const CATEGORIES: CategoryId[] = [
  "football",
  "nollywood",
  "nigerian_history",
  "afrobeats",
  "current_affairs",
];
const TOTAL_LEVELS = 5;
const QUESTIONS_PER_LEVEL = 10;
const TOTAL_QUESTIONS_PER_SESSION = TOTAL_LEVELS * QUESTIONS_PER_LEVEL;

/** Deterministic PRNG (Mulberry32). */
function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(date: string): number {
  let h = 2166136261;
  const str = `lagos-daily|${date}`;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffleInPlace<T>(arr: T[], rand: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function groupByCategory(): Record<CategoryId, Question[]> {
  const map: Record<CategoryId, Question[]> = {
    football: [],
    nollywood: [],
    nigerian_history: [],
    afrobeats: [],
    current_affairs: [],
  };
  for (const q of QUESTION_BANK) {
    map[q.category].push(q);
  }
  return map;
}

function toPublicWithLevel(q: Question, level: number): PublicQuestionWithLevel {
  const { correctIndex: _, ...rest } = q;
  return { ...rest, level };
}

/**
 * Picks a balanced daily set: every category represented first, then fills to N.
 */
export function getDailyQuizForDate(date: string, sessionKey?: string): DailyQuiz {
  const resolvedSessionKey = sessionKey?.trim() || "default";
  const count = TOTAL_QUESTIONS_PER_SESSION;
  const rand = mulberry32(hashSeed(`${date}|${resolvedSessionKey}`));
  const byCat = groupByCategory();

  for (const c of CATEGORIES) {
    shuffleInPlace(byCat[c], rand);
  }

  const picked: Question[] = [];
  const used = new Set<string>();

  // Round 1: one from each category (order shuffled)
  const catOrder = [...CATEGORIES];
  shuffleInPlace(catOrder, rand);
  for (const c of catOrder) {
    const next = byCat[c].find((q) => !used.has(q.id));
    if (next) {
      picked.push(next);
      used.add(next.id);
    }
  }

  // Fill remaining slots from a shuffled global pool
  const pool = [...QUESTION_BANK].filter((q) => !used.has(q.id));
  shuffleInPlace(pool, rand);
  for (const q of pool) {
    if (picked.length >= count) break;
    picked.push(q);
    used.add(q.id);
  }

  // If bank is too small (shouldn’t happen), trim
  const finalQs = picked.slice(0, count);

  // Random order per play session.
  shuffleInPlace(finalQs, mulberry32(hashSeed(`${date}|${resolvedSessionKey}|order`)));

  const pointsLadder = getPointsLadder(finalQs.length);
  const checkpointLevels = getCheckpointLevels1Based(finalQs.length);

  return {
    date,
    sessionKey: resolvedSessionKey,
    totalLevels: TOTAL_LEVELS,
    questionsPerLevel: QUESTIONS_PER_LEVEL,
    questionCount: finalQs.length,
    pointsLadder,
    checkpointLevels,
    questions: finalQs.map((q, i) => toPublicWithLevel(q, i + 1)),
  };
}

export function getQuestionById(id: string): Question | undefined {
  return QUESTION_BANK.find((q) => q.id === id);
}
