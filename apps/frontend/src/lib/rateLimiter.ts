/**
 * ============================================================================
 * LEARNING NOTE: CLIENT-SIDE TOKEN BUCKET RATE LIMITER
 * ============================================================================
 * Prevents UI actions from firing more than `maxCalls` times per `windowMs`.
 * Uses a token bucket strategy: bucket refills to capacity on each new window.
 *
 * Use cases in this app:
 *  - Name Enquiry button (TransferModal)  → max 5 checks / 10 s
 *  - Auth form submit (page.tsx)          → max 3 submits / 30 s
 *  - KYC seed submit (OnboardingSection)  → max 3 submits / 60 s
 *
 * `createRateLimiter(maxCalls, windowMs)` returns { allowed, reset, remaining }.
 */

export interface RateLimiterOptions {
  maxCalls: number;   // max invocations allowed in the window
  windowMs: number;   // rolling window in milliseconds
}

export interface RateLimiter {
  /**
   * Returns `true` if the call is allowed; `false` if rate limit is exceeded.
   * Consuming a token on every `true` return.
   */
  isAllowed(): boolean;
  /** Remaining tokens in the current window. */
  remaining(): number;
  /** Milliseconds until the next window opens. */
  msUntilReset(): number;
  /** Force-reset the bucket (e.g. after a successful operation). */
  reset(): void;
}

export function createRateLimiter(
  maxCalls: number,
  windowMs: number,
): RateLimiter {
  let tokens = maxCalls;
  let windowStart = Date.now();

  const refillIfNeeded = () => {
    const now = Date.now();
    if (now - windowStart >= windowMs) {
      tokens = maxCalls;
      windowStart = now;
    }
  };

  return {
    isAllowed(): boolean {
      refillIfNeeded();
      if (tokens > 0) {
        tokens -= 1;
        return true;
      }
      return false;
    },
    remaining(): number {
      refillIfNeeded();
      return tokens;
    },
    msUntilReset(): number {
      const elapsed = Date.now() - windowStart;
      return Math.max(0, windowMs - elapsed);
    },
    reset(): void {
      tokens = maxCalls;
      windowStart = Date.now();
    },
  };
}
