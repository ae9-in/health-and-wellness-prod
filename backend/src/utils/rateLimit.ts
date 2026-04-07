/**
 * In-memory sliding-window rate limiter.
 * Max `limit` actions per user in `windowMs` milliseconds.
 * No external dependencies — resets on server restart.
 */

const store = new Map<string, number[]>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_COMMENTS = 5;

export function checkCommentRateLimit(userId: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const timestamps = store.get(userId) || [];

  // Prune entries outside the window
  const recent = timestamps.filter(t => now - t < WINDOW_MS);

  if (recent.length >= MAX_COMMENTS) {
    const oldestInWindow = recent[0];
    const retryAfterMs = WINDOW_MS - (now - oldestInWindow);
    store.set(userId, recent);
    return { allowed: false, retryAfterMs };
  }

  recent.push(now);
  store.set(userId, recent);
  return { allowed: true, retryAfterMs: 0 };
}
