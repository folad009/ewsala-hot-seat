/**
 * One completed game per quiz `date` (Lagos day), stored in localStorage.
 * Users can clear site data to bypass — real enforcement needs accounts + server.
 */
const STORAGE_PREFIX = "naija-trivia-completed:";

export function isDailyPlayCompleted(date: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(`${STORAGE_PREFIX}${date}`) === "1";
  } catch {
    return false;
  }
}

export function markDailyPlayCompleted(date: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${date}`, "1");
  } catch {
    /* quota / private mode */
  }
}
