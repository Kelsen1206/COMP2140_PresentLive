import { Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';

/**
 * The title block at the top of every management screen: an optional "back"
 * link, the page name, a line of explanation, and the primary actions.
 *
 * @param {{
 *   title: React.ReactNode,
 *   description?: React.ReactNode,
 *   actions?: React.ReactNode,
 *   backTo?: string,
 *   backLabel?: string,
 *   eyebrow?: React.ReactNode,
 * }} props
 */
export const PageHeader = ({ title, description, actions, backTo, backLabel = 'Back', eyebrow }) => (
  <header className="page-header">
    {backTo ? (
      <Link to={backTo} className="page-header__back">
        <Icon name="arrowLeft" size={16} />
        <span>{backLabel}</span>
      </Link>
    ) : null}

    <div className="page-header__row">
      <div className="page-header__text">
        {eyebrow ? <p className="page-header__eyebrow">{eyebrow}</p> : null}
        <h1 className="page-header__title">{title}</h1>
        {description ? <p className="page-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </div>
  </header>
);
