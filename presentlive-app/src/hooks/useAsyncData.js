import { useCallback, useEffect, useRef, useState } from 'react';
import { useLatestRef } from './useLatestRef.js';

/**
 * Load data from the API and expose the three states every screen needs:
 * loading, ready and failed.
 *
 * Centralising this is what lets each page render a spinner, an empty state or
 * an error panel without repeating the same useState/useEffect dance. The
 * request is aborted when the component unmounts or the dependencies change, so
 * a slow response can never write into a screen the user has already left.
 *
 * A reload is a background refresh: data already on screen stays visible while
 * the new copy is fetched, instead of the whole screen dropping back to a
 * spinner. That matters for live updates, which reload every time someone
 * answers a poll.
 *
 * @template T
 * @param {(options: {signal: AbortSignal}) => Promise<T>} loader Fetches the data.
 * @param {unknown[]} [deps] Values that should trigger a refetch when they change.
 * @returns {{data: T|null, status: 'loading'|'ready'|'error', error: Error|null,
 *            isLoading: boolean, reload: () => void, setData: (updater: T|((current: T) => T)) => void}}
 */
export const useAsyncData = (loader, deps = []) => {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });
  const [reloadCount, setReloadCount] = useState(0);

  // Held in a ref so that an inline arrow function passed as `loader` does not
  // restart the request on every render.
  const loaderRef = useLatestRef(loader);

  // Set by reload() so the effect knows this run is a refresh of data already
  // on screen, rather than a first load or a switch to a different record.
  const backgroundRef = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const isBackground = backgroundRef.current;
    backgroundRef.current = false;

    /** True when the screen already shows good data that should stay up. */
    const keepsCurrent = (current) => isBackground && current.status === 'ready';

    setState((current) =>
      keepsCurrent(current) ? current : { ...current, status: 'loading', error: null },
    );

    loaderRef
      .current({ signal: controller.signal })
      .then((data) => {
        if (active) setState({ status: 'ready', data, error: null });
      })
      .catch((error) => {
        if (!active || error?.name === 'AbortError') return;
        // A failed background refresh leaves the last good copy on screen; the
        // next refresh will try again.
        setState((current) =>
          keepsCurrent(current) ? current : { status: 'error', data: null, error },
        );
      });

    return () => {
      active = false;
      controller.abort();
    };
    // The loader is intentionally excluded; it is read from a ref instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadCount]);

  /** Fetch the data again, for example after a record was deleted. */
  const reload = useCallback(() => {
    backgroundRef.current = true;
    setReloadCount((count) => count + 1);
  }, []);

  /**
   * Replace the loaded data locally, so a screen can reflect a save without
   * paying for a second round trip.
   */
  const setData = useCallback((updater) => {
    setState((current) =>
      current.status !== 'ready'
        ? current
        : {
            ...current,
            data: typeof updater === 'function' ? updater(current.data) : updater,
          },
    );
  }, []);

  return {
    data: state.data,
    status: state.status,
    error: state.error,
    isLoading: state.status === 'loading',
    reload,
    setData,
  };
};
