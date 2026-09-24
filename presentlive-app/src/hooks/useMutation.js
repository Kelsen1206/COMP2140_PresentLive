import { useCallback, useEffect, useRef, useState } from 'react';
import { useLatestRef } from './useLatestRef.js';

/**
 * Run a write against the API (create, update or delete) while tracking whether
 * it is in flight and what went wrong if it failed.
 *
 * Every save button in the app uses this, so disabling the button during a save
 * and surfacing a readable error message are handled in exactly one place.
 *
 * @template T
 * @param {(...args: unknown[]) => Promise<T>} action The write to perform.
 * @returns {{run: (...args: unknown[]) => Promise<{ok: true, data: T}|{ok: false, error: Error}>,
 *            isPending: boolean, error: Error|null, reset: () => void}}
 */
export const useMutation = (action) => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const actionRef = useLatestRef(action);

  // Guards against setting state after the component has gone away, which
  // happens routinely when a successful save navigates to another route.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Perform the write.
   *
   * The result is returned as a tagged object rather than thrown, so callers
   * can branch on success without a try/catch around every button handler.
   */
  const run = useCallback(async (...args) => {
    setIsPending(true);
    setError(null);
    try {
      const data = await actionRef.current(...args);
      if (mountedRef.current) setIsPending(false);
      return { ok: true, data };
    } catch (caught) {
      if (mountedRef.current) {
        setError(caught);
        setIsPending(false);
      }
      return { ok: false, error: caught };
    }
    // Both refs are stable objects; they are listed to satisfy the dependency
    // rule rather than because they can change.
  }, [actionRef]);

  const reset = useCallback(() => setError(null), []);

  return { run, isPending, error, reset };
};
