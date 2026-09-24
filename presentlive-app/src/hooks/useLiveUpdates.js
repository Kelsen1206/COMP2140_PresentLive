import { useEffect, useState } from 'react';
import { subscribeToEntity } from '../lib/liveEvents.js';
import { useLatestRef } from './useLatestRef.js';

/** How long to wait after a burst of events before reloading. */
const DEBOUNCE_MS = 400;

/**
 * Re-run a callback whenever the API reports that one of the given entities
 * changed.
 *
 * Several attendees answering a poll at once produces a burst of events, so the
 * callback is debounced: the screen refreshes once, shortly after the burst,
 * rather than once per message.
 *
 * @param {string[]} entities Entity names to watch, e.g. `['poll_responses']`.
 * @param {() => void} onChange Called after a change is reported.
 * @param {{enabled?: boolean}} [options]
 * @returns {{isConnected: boolean}} Whether the streams are currently healthy.
 */
export const useLiveUpdates = (entities, onChange, { enabled = true } = {}) => {
  const [isConnected, setIsConnected] = useState(false);

  const onChangeRef = useLatestRef(onChange);

  // Joining the names gives a stable dependency for an array literal that would
  // otherwise be a new value on every render.
  const key = entities.join(',');

  useEffect(() => {
    if (!enabled || key === '') return undefined;

    let timer;
    const scheduleRefresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => onChangeRef.current(), DEBOUNCE_MS);
    };

    // Connection state is driven by the stream itself rather than set up front,
    // so the indicator only claims to be live once the server has answered.
    const unsubscribers = key.split(',').map((entity) =>
      subscribeToEntity(entity, {
        onOpen: () => setIsConnected(true),
        onChange: scheduleRefresh,
        onError: () => setIsConnected(false),
      }),
    );

    return () => {
      clearTimeout(timer);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      setIsConnected(false);
    };
    // The ref object itself never changes; it is listed so the dependency rule
    // can see every value the effect reads.
  }, [key, enabled, onChangeRef]);

  // While disabled there is no stream, so the indicator must not claim to be
  // live even if a previous subscription had connected.
  return { isConnected: enabled && isConnected };
};
