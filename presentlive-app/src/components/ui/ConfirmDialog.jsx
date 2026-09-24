import { useEffect, useRef } from 'react';
import { Button } from './Button.jsx';

/**
 * Asks the user to confirm an action that cannot be undone.
 *
 * Deleting a presentation also deletes its slides, audience and answers, so no
 * delete in this app happens on a single click. Escape closes the dialog and
 * focus moves to the cancel button when it opens, so the destructive choice is
 * never the one under the user's finger by default.
 *
 * @param {{
 *   open: boolean,
 *   title: string,
 *   message: React.ReactNode,
 *   confirmLabel?: string,
 *   cancelLabel?: string,
 *   isPending?: boolean,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 * }} props
 */
export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isPending = false,
  onConfirm,
  onCancel,
}) => {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    cancelRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isPending) onCancel();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isPending, onCancel]);

  if (!open) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 className="dialog__title" id="dialog-title">
          {title}
        </h2>
        <div className="dialog__message">{message}</div>
        <div className="dialog__actions">
          <Button ref={cancelRef} onClick={onCancel} disabled={isPending}>
            {cancelLabel}
          </Button>
          <Button
            variant="danger"
            icon="trash"
            onClick={onConfirm}
            isPending={isPending}
            pendingLabel="Deleting"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
