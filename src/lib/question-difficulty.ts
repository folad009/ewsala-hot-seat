import type { Question } from "@/lib/types";

/** 1 = warm-up, 2 = medium, 3 = hardest — used to order the daily ladder. */
export const QUESTION_DIFFICULTY: Record<string, 1 | 2 | 3> = {
  "fb-1": 2,
  "fb-2": 1,
  "fb-3": 3,
  "fb-4": 3,
  "fb-5": 1,
  "fb-6": 2,
  "fb-7": 2,
  "fb-8": 1,
  "nl-1": 2,
  "nl-2": 3,
  "nl-3": 3,
  "nl-4": 1,
  "nl-5": 1,
  "nl-6": 2,
  "nl-7": 1,
  "nh-1": 1,
  "nh-2": 2,
  "nh-3": 2,
  "nh-4": 2,
  "nh-5": 1,
  "nh-6": 3,
  "nh-7": 3,
  "mu-1": 3,
  "mu-2": 2,
  "mu-3": 1,
  "mu-4": 2,
  "mu-5": 2,
  "mu-6": 1,
  "mu-7": 2,
  "ca-1": 1,
  "ca-2": 2,
  "ca-3": 1,
  "ca-4": 1,
  "ca-5": 2,
  "ca-6": 1,
  "ca-7": 2,
};

export function getDifficulty(q: Question): 1 | 2 | 3 {
  return QUESTION_DIFFICULTY[q.id] ?? 2;
}
