import { useEffect } from 'react';

/** Suffix appended to every page title. */
const APP_NAME = 'PresentLive';

/**
 * Set the browser tab title for the current screen.
 *
 * With client-side routing the document title does not change on its own, which
 * makes browser history and open tabs hard to tell apart. Each page calls this
 * with its own heading.
 *
 * @param {string} [title] The page name, or omitted for the app name alone.
 */
export const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | ${APP_NAME}` : APP_NAME;
  }, [title]);
};
