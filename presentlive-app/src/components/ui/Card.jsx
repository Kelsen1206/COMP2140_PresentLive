/**
 * The surface every block of content in the app sits on.
 *
 * A card optionally carries a title row with actions on the right, so pages can
 * be composed from cards instead of each one inventing its own panel markup.
 *
 * @param {{
 *   title?: React.ReactNode,
 *   description?: React.ReactNode,
 *   actions?: React.ReactNode,
 *   children: React.ReactNode,
 *   as?: React.ElementType,
 *   padded?: boolean,
 *   className?: string,
 * }} props
 */
export const Card = ({
  title,
  description,
  actions,
  children,
  as: Element = 'section',
  padded = true,
  className = '',
}) => (
  <Element className={`card ${className}`.trim()}>
    {(title || actions) && (
      <header className="card__header">
        <div className="card__heading">
          {title ? <h2 className="card__title">{title}</h2> : null}
          {description ? <p className="card__description">{description}</p> : null}
        </div>
        {actions ? <div className="card__actions">{actions}</div> : null}
      </header>
    )}
    <div className={padded ? 'card__body' : 'card__body card__body--flush'}>{children}</div>
  </Element>
);
