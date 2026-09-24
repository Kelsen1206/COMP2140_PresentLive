import { Icon } from './Icon.jsx';

/** Which icon goes with each tone. */
const ICONS = {
  info: 'info',
  warning: 'alert',
  danger: 'alert',
  success: 'check',
};

/**
 * A short instruction or warning set apart from the surrounding text.
 *
 * Used for the guidance each workflow needs -- what a Draft deck means, why an
 * answer cannot be changed, what the audience will see.
 *
 * @param {{
 *   tone?: 'info'|'warning'|'danger'|'success',
 *   title?: React.ReactNode,
 *   children: React.ReactNode,
 * }} props
 */
export const Callout = ({ tone = 'info', title, children }) => (
  <div className={`callout callout--${tone}`} role={tone === 'danger' ? 'alert' : undefined}>
    <span className="callout__icon">
      <Icon name={ICONS[tone] ?? 'info'} size={18} />
    </span>
    <div className="callout__body">
      {title ? <p className="callout__title">{title}</p> : null}
      <div className="callout__text">{children}</div>
    </div>
  </div>
);
