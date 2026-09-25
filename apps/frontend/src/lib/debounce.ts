/**
 * ============================================================================
 * LEARNING NOTE: DEBOUNCE UTILITY
 * ============================================================================
 * Delays invoking `fn` until `delay` ms have elapsed since the last call.
 * Use for inputs that trigger expensive operations (API lookups, searches).
 *
 * `debounce(fn, delay)` — standalone function wrapper (plain JS/TS).
 * `useDebounce(value, delay)` — React hook that debounces a reactive value.
 */

// ---------------------------------------------------------------------------
// 1. Standalone debounce — wraps any function
// ---------------------------------------------------------------------------

export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

// ---------------------------------------------------------------------------
// 2. React hook — debounces a state value
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
