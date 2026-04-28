import { getDailyQuizForDate, getQuestionById } from "@/lib/daily";
import type { SubmitPayload, SubmitResult } from "@/lib/types";

export function scoreSubmission(payload: SubmitPayload): SubmitResult | null {
  const quiz = getDailyQuizForDate(payload.date, payload.sessionKey);
  const ids = new Set(quiz.questions.map((q) => q.id));

  let correct = 0;
  const results: SubmitResult["results"] = [];

  for (const q of quiz.questions) {
    const full = getQuestionById(q.id);
    if (!full) return null;

    const raw = payload.answers[q.id];
    const selectedIndex =
      typeof raw === "number" && raw >= 0 && raw <= 3 ? raw : null;

    const isCorrect = selectedIndex === full.correctIndex;
    if (isCorrect) correct++;

    results.push({
      questionId: q.id,
      category: full.category,
      correct: isCorrect,
      correctIndex: full.correctIndex,
      selectedIndex,
    });
  }

  const total = quiz.questions.length;
  const percentage = total === 0 ? 0 : Math.round((correct / total) * 100);

  return {
    date: payload.date,
    correct,
    total,
    percentage,
    results,
  };
}

/** Reject if client sends answers for questions not in today’s quiz. */
export function validateAnswerKeys(payload: SubmitPayload): boolean {
  const quiz = getDailyQuizForDate(payload.date, payload.sessionKey);
  const allowed = new Set(quiz.questions.map((q) => q.id));
  for (const key of Object.keys(payload.answers)) {
    if (!allowed.has(key)) return false;
  }
  return true;
}
