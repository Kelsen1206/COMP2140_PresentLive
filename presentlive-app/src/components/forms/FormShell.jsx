import { Button } from '../ui/Button.jsx';
import { ErrorState } from '../ui/States.jsx';

/**
 * The frame every Add and Edit form sits in: the fields, anything the API said
 * went wrong, and the submit and cancel buttons.
 *
 * Pulling this out means the Presentation form and the Slide form differ only
 * in their fields, not in how they submit, report failure or lay out actions.
 *
 * @param {{
 *   form: object,
 *   submitLabel: string,
 *   pendingLabel?: string,
 *   cancelTo?: string,
 *   cancelLabel?: string,
 *   error?: Error|null,
 *   children: React.ReactNode,
 *   secondaryAction?: React.ReactNode,
 * }} props
 */
export const FormShell = ({
  form,
  submitLabel,
  pendingLabel = 'Saving',
  cancelTo,
  cancelLabel = 'Cancel',
  error,
  children,
  secondaryAction,
}) => (
  <form className="form" onSubmit={form.handleSubmit} noValidate>
    <div className="form__fields">{children}</div>

    {error ? (
      <div className="form__error">
        <ErrorState error={error} title="That could not be saved" />
      </div>
    ) : null}

    {form.submitAttempted && form.hasErrors ? (
      <p className="form__summary" role="alert">
        Please fix the highlighted fields before saving.
      </p>
    ) : null}

    <div className="form__actions">
      <Button
        type="submit"
        variant="primary"
        icon="check"
        isPending={form.isSubmitting}
        pendingLabel={pendingLabel}
      >
        {submitLabel}
      </Button>
      {cancelTo ? (
        <Button to={cancelTo} variant="ghost">
          {cancelLabel}
        </Button>
      ) : null}
      {secondaryAction ? <div className="form__spacer">{secondaryAction}</div> : null}
    </div>
  </form>
);
