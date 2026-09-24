import { useCallback, useState } from 'react';

/**
 * Remember which Attendee record belongs to this browser for one presentation.
 *
 * The audience never signs in, so the link to their record is the id kept here.
 * Storing it means a refresh, or closing and reopening the tab, drops the
 * viewer back where they were instead of creating a duplicate attendee.
 *
 * Browser storage can be unavailable (private windows, blocked site data), so
 * every access is guarded and simply behaves as though nothing were stored.
 */

/**
 * @param {string} presentationId
 * @returns {string} The storage key for this presentation.
 */
const storageKey = (presentationId) => `presentlive.attendee.${presentationId}`;

/**
 * @param {string} key
 * @returns {string|null}
 */
const readStored = (key) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

/**
 * Track the attendee id saved for one presentation.
 *
 * @param {string} presentationId
 * @returns {{attendeeId: string|null, rememberAttendee: (id: string) => void, forgetAttendee: () => void}}
 */
export const useAttendeeSession = (presentationId) => {
  const key = storageKey(presentationId);
  const [attendeeId, setAttendeeId] = useState(() => readStored(key));

  /** Save the id of the attendee record created when this viewer joined. */
  const rememberAttendee = useCallback(
    (id) => {
      setAttendeeId(id);
      try {
        window.localStorage.setItem(key, id);
      } catch {
        // Storage is unavailable; the id still works for this page view.
      }
    },
    [key],
  );

  /** Clear the saved id, so the next visit starts a fresh run through the deck. */
  const forgetAttendee = useCallback(() => {
    setAttendeeId(null);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Nothing to clean up if storage is unavailable.
    }
  }, [key]);

  return { attendeeId, rememberAttendee, forgetAttendee };
};
