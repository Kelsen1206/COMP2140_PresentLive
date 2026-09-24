import { useId } from 'react';
import { Button } from './Button.jsx';
import { useClipboard } from '../../hooks/useClipboard.js';
import { useToast } from '../../context/toastContext.js';

/**
 * A read-only link with a button that copies it to the clipboard.
 *
 * This is how both share links leave the application. The value is selectable
 * as well as copyable, so the link is still usable if the browser refuses
 * clipboard access.
 *
 * @param {{
 *   label: string,
 *   value: string,
 *   description?: React.ReactNode,
 *   openLabel?: string,
 *   successMessage?: string,
 * }} props
 */
export const CopyField = ({ label, value, description, openLabel, successMessage }) => {
  const inputId = useId();
  const { copy, isCopied, error } = useClipboard();
  const { notifySuccess, notifyError } = useToast();

  /** Copy the link, then confirm the outcome in the corner of the screen. */
  const handleCopy = async () => {
    const succeeded = await copy(value);
    if (succeeded) {
      notifySuccess(successMessage ?? `${label} copied to your clipboard.`);
    } else {
      notifyError('Your browser blocked copying. Select the link and copy it manually.');
    }
  };

  return (
    <div className="copy-field">
      <label className="copy-field__label" htmlFor={inputId}>
        {label}
      </label>
      {description ? <p className="copy-field__description">{description}</p> : null}
      <div className="copy-field__row">
        <input
          id={inputId}
          className="copy-field__input"
          type="text"
          value={value}
          readOnly
          onFocus={(event) => event.target.select()}
        />
        <Button
          onClick={handleCopy}
          icon={isCopied ? 'check' : 'copy'}
          variant={isCopied ? 'primary' : 'secondary'}
        >
          {isCopied ? 'Copied' : 'Copy'}
        </Button>
        {openLabel ? (
          <Button href={value} icon="arrowRight" variant="ghost">
            {openLabel}
          </Button>
        ) : null}
      </div>
      {error ? <p className="copy-field__error">{error}</p> : null}
    </div>
  );
};
