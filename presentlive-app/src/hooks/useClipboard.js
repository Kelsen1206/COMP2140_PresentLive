import { useCallback, useEffect, useRef, useState } from 'react';

/** How long the "Copied" confirmation stays on screen. */
const CONFIRM_MS = 2000;

/**
 * Copy text to the clipboard and report whether it worked.
 *
 * The asynchronous Clipboard API is unavailable on insecure origins and can be
 * refused by the browser, so a hidden textarea and the older execCommand path
 * are used as a fallback before giving up.
 *
 * @returns {{copy: (text: string) => Promise<boolean>, isCopied: boolean, error: string|null}}
 */
export const useClipboard = () => {
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  /**
   * Last-resort copy for browsers without clipboard permission.
   *
   * @param {string} text
   * @returns {boolean} Whether the copy succeeded.
   */
  const copyViaTextarea = (text) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const succeeded = document.execCommand('copy');
      document.body.removeChild(textarea);
      return succeeded;
    } catch {
      return false;
    }
  };

  const copy = useCallback(async (text) => {
    const succeeded = await (async () => {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return copyViaTextarea(text);
      }
    })();

    clearTimeout(timerRef.current);

    if (succeeded) {
      setError(null);
      setIsCopied(true);
      timerRef.current = setTimeout(() => setIsCopied(false), CONFIRM_MS);
    } else {
      setIsCopied(false);
      setError('Your browser blocked copying. Select the link and copy it manually.');
    }

    return succeeded;
  }, []);

  return { copy, isCopied, error };
};
