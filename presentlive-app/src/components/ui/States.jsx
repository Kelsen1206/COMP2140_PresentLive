import { Button } from './Button.jsx';
import { Icon } from './Icon.jsx';
import { Spinner } from './Spinner.jsx';

/**
 * Shown while a screen is waiting on the API.
 *
 * @param {{label?: string}} props
 */
export const LoadingState = ({ label = 'Loading' }) => (
  <div className="state state--loading">
    <Spinner size={28} label={label} />
    <p className="state__message">{label}...</p>
  </div>
);

/**
 * Shown when a request succeeded but there is nothing to display yet. An empty
 * screen should always tell the user what to do next, so an action is expected
 * rather than optional in most uses.
 *
 * @param {{title: string, message?: string, icon?: string, action?: React.ReactNode}} props
 */
export const EmptyState = ({ title, message, icon = 'info', action }) => (
  <div className="state state--empty">
    <span className="state__icon">
      <Icon name={icon} size={26} />
    </span>
    <h3 className="state__title">{title}</h3>
    {message ? <p className="state__message">{message}</p> : null}
    {action ? <div className="state__action">{action}</div> : null}
  </div>
);

/**
 * Shown when a request failed. The message comes from the API client, which has
 * already translated the failure into something a user can act on; the raw
 * validation details are listed underneath when the API supplied them.
 *
 * @param {{error?: Error & {details?: string[]}, title?: string, onRetry?: () => void}} props
 */
export const ErrorState = ({ error, title = 'Something went wrong', onRetry }) => (
  <div className="state state--error" role="alert">
    <span className="state__icon state__icon--error">
      <Icon name="alert" size={26} />
    </span>
    <h3 className="state__title">{title}</h3>
    <p className="state__message">
      {error?.message ?? 'An unexpected problem stopped this from loading.'}
    </p>
    {Array.isArray(error?.details) && error.details.length > 0 ? (
      <ul className="state__details">
        {error.details.map((detail) => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
    ) : null}
    {onRetry ? (
      <div className="state__action">
        <Button onClick={onRetry} icon="refresh" variant="secondary">
          Try again
        </Button>
      </div>
    ) : null}
  </div>
);

/** An array with no entries, or a missing value, counts as empty. */
const defaultIsEmpty = (data) =>
  data === null || data === undefined || (Array.isArray(data) && data.length === 0);

/**
 * Render the right thing for whichever state a `useAsyncData` call is in.
 *
 * Every list and detail screen in the app goes through this component, which is
 * what guarantees loading, empty and failure are handled the same way
 * everywhere instead of being reinvented per page.
 *
 * @template T
 * @param {{
 *   status: 'loading'|'ready'|'error',
 *   data: T,
 *   error?: Error|null,
 *   loadingLabel?: string,
 *   empty?: React.ReactNode,
 *   errorTitle?: string,
 *   onRetry?: () => void,
 *   isEmpty?: (data: T) => boolean,
 *   children: (data: T) => React.ReactNode,
 * }} props
 */
export const DataState = ({
  status,
  data,
  error,
  loadingLabel,
  empty,
  errorTitle,
  onRetry,
  isEmpty = defaultIsEmpty,
  children,
}) => {
  if (status === 'loading') return <LoadingState label={loadingLabel} />;
  if (status === 'error') return <ErrorState error={error} title={errorTitle} onRetry={onRetry} />;
  if (empty !== undefined && isEmpty(data)) return empty;
  return children(data);
};
