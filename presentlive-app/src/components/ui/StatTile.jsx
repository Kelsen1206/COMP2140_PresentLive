import { Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';

/**
 * One figure derived from related records -- a slide count, how many people
 * joined, how many answers came back.
 *
 * When `to` is supplied the whole tile becomes a link, which is what lets a
 * summary number take the presenter straight to the records behind it.
 *
 * @param {{label: string, value: React.ReactNode, hint?: string, icon?: string, to?: string}} props
 */
export const StatTile = ({ label, value, hint, icon, to }) => {
  const body = (
    <>
      <span className="stat__label">
        {icon ? <Icon name={icon} size={15} /> : null}
        {label}
      </span>
      <span className="stat__value">{value}</span>
      {hint ? <span className="stat__hint">{hint}</span> : null}
      {to ? (
        <span className="stat__go" aria-hidden="true">
          <Icon name="arrowRight" size={15} />
        </span>
      ) : null}
    </>
  );

  return to ? (
    <Link to={to} className="stat stat--link">
      {body}
    </Link>
  ) : (
    <div className="stat">{body}</div>
  );
};

/**
 * Lays out a row of stat tiles that wraps on narrow screens.
 *
 * @param {{children: React.ReactNode}} props
 */
export const StatGrid = ({ children }) => <div className="stat-grid">{children}</div>;
