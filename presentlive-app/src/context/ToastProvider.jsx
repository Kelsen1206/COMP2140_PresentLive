import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContext } from './toastContext.js';

/** How long a toast stays on screen before it removes itself. */
const VISIBLE_MS = 4500;

/**
 * Provides the short confirmation messages shown after a save, a delete or a
 * failed action, and renders them in a fixed region at the edge of the screen.
 *
 * Having one provider means a component only has to say what happened; where
 * and how the confirmation appears is decided once, here.
 *
 * @param {{children: React.ReactNode}} props
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const nextIdRef = useRef(1);
  const timersRef = useRef(new Map());

  /** Remove one toast and cancel its pending timer. */
  const dismiss = useCallback((id) => {
    clearTimeout(timersRef.current.get(id));
    timersRef.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Add a toast of the given tone.
   *
   * @param {'success'|'error'|'info'} tone
   * @returns {(message: string) => void}
   */
  const notify = useCallback(
    (tone) => (message) => {
      const id = nextIdRef.current;
      nextIdRef.current += 1;

      setToasts((current) => [...current, { id, tone, message }]);
      timersRef.current.set(
        id,
        setTimeout(() => dismiss(id), VISIBLE_MS),
      );
    },
    [dismiss],
  );

  // Clear every outstanding timer if the provider itself unmounts.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      notifySuccess: notify('success'),
      notifyError: notify('error'),
      notifyInfo: notify('info'),
      dismiss,
    }),
    [notify, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.tone}`}>
            <span className="toast__message">{toast.message}</span>
            <button
              type="button"
              className="toast__close"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
