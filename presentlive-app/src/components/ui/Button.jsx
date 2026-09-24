import { Link } from 'react-router-dom';
import { Icon } from './Icon.jsx';
import { Spinner } from './Spinner.jsx';

/**
 * Build the class list shared by every kind of button in the app.
 *
 * @param {{variant: string, size: string, fullWidth: boolean, className: string}} options
 * @returns {string}
 */
const buttonClass = ({ variant, size, fullWidth, className }) =>
  [
    'button',
    `button--${variant}`,
    `button--${size}`,
    fullWidth ? 'button--full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

/**
 * The app's only button.
 *
 * It renders a real `<button>`, or a router `<Link>` when `to` is supplied, so
 * that navigation stays client-side and keyboard users get the right element
 * for the job. Pending state disables the control and swaps the leading icon
 * for a spinner, which is how every save in the app shows it is working.
 *
 * @param {{
 *   children?: React.ReactNode,
 *   to?: string,
 *   href?: string,
 *   type?: 'button'|'submit'|'reset',
 *   variant?: 'primary'|'secondary'|'ghost'|'danger',
 *   size?: 'sm'|'md'|'lg',
 *   icon?: string,
 *   iconAfter?: string,
 *   isPending?: boolean,
 *   pendingLabel?: string,
 *   fullWidth?: boolean,
 *   disabled?: boolean,
 *   className?: string,
 *   onClick?: (event: React.MouseEvent) => void,
 * }} props
 */
export const Button = ({
  children,
  to,
  href,
  type = 'button',
  variant = 'secondary',
  size = 'md',
  icon,
  iconAfter,
  isPending = false,
  pendingLabel,
  fullWidth = false,
  disabled = false,
  className = '',
  ...rest
}) => {
  const classes = buttonClass({ variant, size, fullWidth, className });

  const content = (
    <>
      {isPending ? <Spinner size={16} /> : icon ? <Icon name={icon} /> : null}
      <span>{isPending && pendingLabel ? pendingLabel : children}</span>
      {!isPending && iconAfter ? <Icon name={iconAfter} /> : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer" {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isPending}
      aria-busy={isPending || undefined}
      {...rest}
    >
      {content}
    </button>
  );
};
