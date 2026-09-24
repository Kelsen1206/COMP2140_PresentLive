import { Outlet } from 'react-router-dom';
import { SiteHeader } from './SiteHeader.jsx';
import { SiteFooter } from './SiteFooter.jsx';
import { ConfigNotice } from './ConfigNotice.jsx';
import { ScrollToTop } from './ScrollToTop.jsx';

/**
 * The frame every route renders inside: the same header, the routed page, and
 * the same footer.
 *
 * Because the layout is a route rather than a wrapper around each page, the
 * header and footer are never unmounted while navigating -- so the chrome stays
 * completely still as the content changes.
 */
export const AppLayout = () => (
  <div className="app-shell">
    <ScrollToTop />
    <a className="skip-link" href="#main-content">
      Skip to content
    </a>
    <SiteHeader />
    <ConfigNotice />
    <main className="app-main" id="main-content">
      <Outlet />
    </main>
    <SiteFooter />
  </div>
);
