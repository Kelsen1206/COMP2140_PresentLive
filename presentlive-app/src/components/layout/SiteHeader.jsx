import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon.jsx';

/** The primary navigation, in the order it appears in the header. */
const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: 'home', end: true },
  { to: '/presentations', label: 'Presentations', icon: 'slides' },
  { to: '/help', label: 'How it works', icon: 'info' },
];

/**
 * The header shown on every screen of the application.
 *
 * On narrow screens the links collapse behind a toggle. Following a link closes
 * the menu, so a tap never leaves it hanging open over the new page.
 */
export const SiteHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <NavLink to="/" className="brand" aria-label="PresentLive home" onClick={closeMenu}>
          <span className="brand__mark" aria-hidden="true">
            <Icon name="present" size={20} />
          </span>
          <span className="brand__text">
            <span className="brand__name">PresentLive</span>
            <span className="brand__tagline">Decks that talk back</span>
          </span>
        </NavLink>

        <button
          type="button"
          className="site-header__toggle"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
        >
          <span className="site-header__toggle-bars" aria-hidden="true" />
          <span className="visually-hidden">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
        </button>

        <nav
          id="primary-navigation"
          className={`site-nav ${isMenuOpen ? 'site-nav--open' : ''}`.trim()}
          aria-label="Primary"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={closeMenu}
              className={({ isActive }) => `site-nav__link ${isActive ? 'is-active' : ''}`.trim()}
            >
              <Icon name={item.icon} size={16} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
};
