export type CategoryId =
  | "football"
  | "nollywood"
  | "nigerian_history"
  | "afrobeats"
  | "current_affairs";

export type Question = {
  id: string;
  category: CategoryId;
  text: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
};

export type PublicQuestion = Omit<Question, "correctIndex">;

export type PublicQuestionWithLevel = PublicQuestion & { level: number };

export type DailyQuiz = {
  date: string;
  questionCount: number;
  /** Game points per level (index 0 = level 1) — for fun only, not money. */
  pointsLadder: number[];
  /** 1-based levels that act as score checkpoints after you clear them. */
  checkpointLevels: number[];
  questions: PublicQuestionWithLevel[];
};

export type SubmitPayload = {
  date: string;
  answers: Record<string, number>;
};

export type SubmitResult = {
  date: string;
  correct: number;
  total: number;
  percentage: number;
  results: {
    questionId: string;
    category: CategoryId;
    correct: boolean;
    correctIndex: number;
    selectedIndex: number | null;
  }[];
};
