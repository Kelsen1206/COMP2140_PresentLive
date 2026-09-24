import { API_BASE_URL, API_TOKEN, isApiConfigured } from '../config.js';

/**
 * Live updates over Server-Sent Events.
 *
 * The API can push a small message every time a record of a broadcasting entity
 * is created, updated or deleted. The message carries only an id, so the app
 * treats it purely as a hint that something changed and re-reads the affected
 * data from the API -- which keeps the screen consistent even if a message was
 * missed while the laptop was asleep.
 */

/** The three event names the API emits. */
const EVENT_NAMES = ['created', 'updated', 'deleted'];

/**
 * Open a live-event stream for one entity.
 *
 * EventSource cannot send an Authorization header, so the API accepts the token
 * as a query parameter on this endpoint only.
 *
 * @param {string} entity The entity name, e.g. `poll_responses`.
 * @param {{onChange: (event: {type: string, id: string}) => void,
 *           onOpen?: () => void, onError?: () => void}} handlers
 * @returns {() => void} Call to close the stream. Safe to call more than once.
 */
export const subscribeToEntity = (entity, { onChange, onOpen, onError }) => {
  if (!isApiConfigured() || typeof EventSource === 'undefined') {
    return () => {};
  }

  const url = `${API_BASE_URL}/${entity}/events?access_token=${encodeURIComponent(API_TOKEN)}`;
  const source = new EventSource(url);

  /**
   * Parse one incoming message and hand it to the caller.
   *
   * @param {string} type The event name.
   * @returns {(message: MessageEvent) => void}
   */
  const handle = (type) => (message) => {
    const payload = (() => {
      try {
        return JSON.parse(message.data);
      } catch {
        return null;
      }
    })();
    onChange({ type, id: payload?.id ?? null, entity });
  };

  const listeners = EVENT_NAMES.map((name) => {
    const listener = handle(name);
    source.addEventListener(name, listener);
    return { name, listener };
  });

  source.onopen = () => onOpen?.();

  // The browser reconnects on its own, so an error is reported but not fatal.
  source.onerror = () => onError?.();

  return () => {
    listeners.forEach(({ name, listener }) => source.removeEventListener(name, listener));
    source.onopen = null;
    source.onerror = null;
    source.close();
  };
};
