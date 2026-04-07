/** Deterministic pick from quiz date so copy varies by day but stays stable. */
function hashDate(date: string): number {
  let h = 2166136261;
  for (let i = 0; i < date.length; i++) {
    h ^= date.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const WIN_CONGRATS = [
  "Congratulations — you cleared the whole ladder today!",
  "Outstanding! Every answer locked in. You’re on fire!",
  "Champion move! That’s a full house on today’s quiz.",
  "Brilliant run — top of the ladder. Well played!",
  "You did it! Perfect score for this daily set.",
  "Naija trivia masterclass. Congratulations!",
];

export function pickWinCongratulations(quizDate: string): string {
  const i = hashDate(`${quizDate}|congrats`) % WIN_CONGRATS.length;
  return WIN_CONGRATS[i];
}

export const WALK_SUB =
  "Smart play — you locked in your points before the next risk.";

export function pickLossEncouragement(
  reason: "wrong" | "timeout" | undefined,
): string {
  if (reason === "timeout") {
    return "The clock won this round — try again on the next daily set.";
  }
  return "Not quite — checkpoints saved part of your score. Come back tomorrow!";
}
