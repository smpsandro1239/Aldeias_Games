/**
 * Retry logic for Prisma transactions with exponential backoff.
 */
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 200;

export async function executeWithRetry<T>(
  fn: () => Promise<T>
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const msg = lastError.message || '';
      const isRetryable =
        msg.includes('Stock insuficiente') ||
        msg.includes('operacao concorrente') ||
        msg.includes('PGRST116') ||
        msg.includes('Deadlock') ||
        msg.includes('could not execute') ||
        msg.includes('CONFLICT');
      if (!isRetryable || attempt === MAX_RETRIES - 1) {
        throw lastError;
      }
      const backoff = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt) + Math.random() * 100, 5000);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
  throw lastError;
}