import { PRESENTATION_STATUS } from '../../config.js';
import { useForm } from '../../hooks/useForm.js';
import { validatePresentation } from '../../lib/validation.js';
import { FormShell } from '../forms/FormShell.jsx';
import { RadioField, TextAreaField, TextField } from '../forms/Fields.jsx';

/** Publishing state, and what each one means for the audience. */
const STATUS_OPTIONS = [
  {
    value: PRESENTATION_STATUS.draft,
    label: 'Draft',
    description: 'Only you can see it. The presentation link tells visitors it is not ready.',
  },
  {
    value: PRESENTATION_STATUS.published,
    label: 'Published',
    description: 'Anyone with the presentation link can join and step through the deck.',
  },
];

/**
 * Turn a stored presentation into form values, or supply blanks when adding.
 *
 * @param {object|null} presentation
 * @returns {object}
 */
const toFormValues = (presentation) => ({
  title: presentation?.title ?? '',
  description: presentation?.description ?? '',
  presenter_name: presentation?.presenter_name ?? '',
  status: presentation?.status ?? PRESENTATION_STATUS.draft,
});

/**
 * The form used for both Add Presentation and Edit Presentation.
 *
 * @param {{
 *   presentation?: object|null,
 *   onSubmit: (values: object) => Promise<void>,
 *   submitLabel: string,
 *   cancelTo: string,
 *   error?: Error|null,
 * }} props
 */
export const PresentationForm = ({
  presentation = null,
  onSubmit,
  submitLabel,
  cancelTo,
  error,
}) => {
  const form = useForm({
    initialValues: toFormValues(presentation),
    validate: validatePresentation,
    onSubmit,
  });

  return (
    <FormShell form={form} submitLabel={submitLabel} cancelTo={cancelTo} error={error}>
      <TextField
        form={form}
        name="title"
        label="Title"
        placeholder="Designing for the back row"
        hint="Shown to the audience on the welcome screen."
      />

      <TextAreaField
        form={form}
        name="description"
        label="Description"
        rows={4}
        placeholder="A short talk on slide design for large rooms, with two audience polls."
        hint="One or two sentences telling the audience what they are about to see."
      />

      <TextField
        form={form}
        name="presenter_name"
        label="Presenter name"
        placeholder="Alex Chen"
        hint="Displayed alongside the title so the audience knows who is speaking."
      />

      <RadioField form={form} name="status" label="Status" options={STATUS_OPTIONS} />
    </FormShell>
  );
};
