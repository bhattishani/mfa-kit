import type { RateLimiter } from "./storage";

interface MemoryBucket {
  tokens: number;
  lastRefill: number;
}

export class MemoryRateLimiter implements RateLimiter {
  private buckets: Map<string, MemoryBucket>;

  constructor() {
    this.buckets = new Map();
  }

  async take(
    key: string,
    limit: number,
    windowSec: number
  ): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const bucket = this.buckets.get(key) ?? { tokens: limit, lastRefill: now };

    // Calculate token refill
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor((timePassed / 1000) * (limit / windowSec));
    bucket.tokens = Math.min(limit, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Check if we can take a token
    if (bucket.tokens <= 0) {
      this.buckets.set(key, bucket);
      return { allowed: false, remaining: 0 };
    }

    bucket.tokens--;
    this.buckets.set(key, bucket);
    return { allowed: true, remaining: bucket.tokens };
  }

  async reset(key: string): Promise<void> {
    this.buckets.delete(key);
  }
}

/**
 * Default in-memory rate limiter instance
 * Note: This should only be used for development or single-instance deployments
 */
export const memoryRateLimiter = new MemoryRateLimiter();

/**
 * Wraps a function with rate limiting
 * @param limiter - The rate limiter to use
 * @param keyFn - Function to generate the rate limit key from the wrapped function's arguments
 * @param limit - Maximum number of tokens in the window
 * @param windowSec - Window size in seconds
 * @param fn - The function to wrap
 * @returns The wrapped function that will throw if rate limited
 */
export function withRateLimit<T extends (...args: any[]) => any>(
  limiter: RateLimiter,
  keyFn: (...args: Parameters<T>) => Promise<string> | string,
  limit: number,
  windowSec: number,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    const key = await keyFn(...args);
    const { allowed } = await limiter.take(key, limit, windowSec);
    if (!allowed) {
      const err = new Error("Rate limit exceeded");
      err.name = "RateLimitExceededError";
      throw err;
    }
    return await fn(...args);
  }) as T;
}
