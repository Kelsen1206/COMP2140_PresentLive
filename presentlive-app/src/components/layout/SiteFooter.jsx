import { Link } from 'react-router-dom';

/**
 * The footer shown on every screen. It repeats the two entry points into the
 * app and names the course the project was built for.
 */
export const SiteFooter = () => (
  <footer className="site-footer">
    <div className="site-footer__inner">
      <div className="site-footer__block">
        <p className="site-footer__name">PresentLive</p>
        <p className="site-footer__note">
          Write a deck, share a link, and watch the room answer back. No installs, no accounts.
        </p>
      </div>

      <nav className="site-footer__links" aria-label="Footer">
        <Link to="/presentations">All presentations</Link>
        <Link to="/presentations/new">Create a presentation</Link>
        <Link to="/help">How it works</Link>
      </nav>

      <p className="site-footer__credit">
        Built for COMP2140 Web &amp; Mobile Programming, The University of Queensland.
      </p>
    </div>
  </footer>
);
