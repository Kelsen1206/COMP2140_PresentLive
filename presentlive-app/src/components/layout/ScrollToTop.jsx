import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls back to the top whenever the route changes.
 *
 * Client-side routing keeps the scroll position between pages, which is
 * disorienting when moving from a long deck screen to a short form -- or from
 * one slide of the guided flow to the next.
 */
export const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};
