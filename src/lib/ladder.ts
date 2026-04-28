/** Game points per level (TV-style ladder — not cash). */
export const FULL_POINTS_LADDER = [
  500, 1_000, 2_000, 3_000, 5_000, 7_500, 15_000, 25_000, 50_000, 100_000,
] as const;

export function getPointsLadder(questionCount: number): number[] {
  const n = Math.max(questionCount, 1);
  if (n <= FULL_POINTS_LADDER.length) {
    return FULL_POINTS_LADDER.slice(0, n);
  }
  const ladder: number[] = [...FULL_POINTS_LADDER];
  while (ladder.length < n) {
    const prev = ladder[ladder.length - 1] ?? FULL_POINTS_LADDER[FULL_POINTS_LADDER.length - 1];
    const next = Math.round((prev * 1.22) / 50) * 50;
    ladder.push(next);
  }
  return ladder;
}

/**
 * 1-based level numbers where crossing that level guarantees a floor
 * (after answering that question correctly).
 */
export function getCheckpointLevels1Based(questionCount: number): number[] {
  if (questionCount >= 50) return [10, 20, 30, 40, 50];
  if (questionCount >= 10) return [5, 10];
  if (questionCount >= 5) return [5];
  if (questionCount >= 3) return [Math.floor(questionCount / 2)];
  return [];
}

/** Points you keep if you miss after `completedCorrect` prior correct answers. */
export function pointsOnWrong(
  completedCorrect: number,
  ladder: number[],
  safeLevels1Based: number[],
): number {
  if (completedCorrect <= 0) return 0;
  const applicable = safeLevels1Based.filter((s) => s <= completedCorrect);
  if (applicable.length > 0) {
    return Math.max(...applicable.map((s) => ladder[s - 1]));
  }
  return ladder[completedCorrect - 1];
}

/** Points already banked before answering question at `questionIndex` (0-based). */
export function pointsBeforeQuestion(questionIndex: number, ladder: number[]): number {
  if (questionIndex <= 0) return 0;
  return ladder[questionIndex - 1];
}

/** Back-compat aliases — prefer `getPointsLadder` / `getCheckpointLevels1Based`. */
export { getPointsLadder as getPrizeLadder, getCheckpointLevels1Based as getSafeHavenLevels1Based };
