import { SLIDE_TYPE } from '../../config.js';
import { useForm } from '../../hooks/useForm.js';
import { validateSlide } from '../../lib/validation.js';
import { PRESENTMD_CHEATSHEET } from '../../lib/presentMD.js';
import { FormShell } from '../forms/FormShell.jsx';
import { RadioField, TextAreaField, TextField } from '../forms/Fields.jsx';
import { OptionsField } from '../forms/OptionsField.jsx';
import { Card } from '../ui/Card.jsx';
import { SlideStage } from './SlideStage.jsx';

/** The two slide types a deck can contain. */
const TYPE_OPTIONS = [
  {
    value: SLIDE_TYPE.content,
    label: 'Content',
    description: 'Text the audience reads and moves past.',
  },
  {
    value: SLIDE_TYPE.poll,
    label: 'Poll',
    description: 'Asks a question and records one answer per person.',
  },
];

/**
 * Build the starting values for the form from an existing slide, or from
 * nothing when adding.
 *
 * @param {object|null} slide
 * @param {number} nextPosition Position to suggest for a new slide.
 * @returns {object}
 */
const toFormValues = (slide, nextPosition) => ({
  title: slide?.title ?? '',
  body: slide?.body ?? '# New slide\n\n- First point\n- Second point\n',
  type: slide?.type ?? SLIDE_TYPE.content,
  position: String(slide?.position ?? nextPosition),
  question: slide?.question ?? '',
  options: Array.isArray(slide?.options) && slide.options.length > 0 ? slide.options : ['', ''],
});

/**
 * The form used for both Add Slide and Edit Slide.
 *
 * The poll question and answer options only appear once the slide type is set
 * to Poll, and the validation rules follow the same switch -- so a content
 * slide is never blocked by a poll field it does not have.
 *
 * @param {{
 *   slide?: object|null,
 *   nextPosition?: number,
 *   onSubmit: (values: object) => Promise<void>,
 *   submitLabel: string,
 *   cancelTo: string,
 *   error?: Error|null,
 * }} props
 */
export const SlideForm = ({
  slide = null,
  nextPosition = 1,
  onSubmit,
  submitLabel,
  cancelTo,
  error,
}) => {
  const form = useForm({
    initialValues: toFormValues(slide, nextPosition),
    validate: validateSlide,
    onSubmit,
  });

  const isPoll = form.values.type === SLIDE_TYPE.poll;

  return (
    <div className="slide-editor">
      <div className="slide-editor__form">
        <FormShell form={form} submitLabel={submitLabel} cancelTo={cancelTo} error={error}>
          <TextField
            form={form}
            name="title"
            label="Slide title"
            placeholder="Why this matters"
            hint="Shown to you in the slide list. It is not printed on the slide itself."
          />

          <TextAreaField
            form={form}
            name="body"
            label="Slide body (presentMD)"
            rows={12}
            mono
            hint="Write the slide in presentMD. The preview beside this box updates as you type."
          />

          <details className="cheatsheet">
            <summary>presentMD syntax reference</summary>
            <dl className="cheatsheet__list">
              {PRESENTMD_CHEATSHEET.map((entry) => (
                <div className="cheatsheet__row" key={entry.syntax}>
                  <dt>
                    <code>{entry.syntax}</code>
                  </dt>
                  <dd>{entry.meaning}</dd>
                </div>
              ))}
            </dl>
          </details>

          <RadioField form={form} name="type" label="Slide type" options={TYPE_OPTIONS} />

          <TextField
            form={form}
            name="position"
            label="Position"
            type="number"
            min={1}
            hint="The order this slide appears in. You can also reorder slides from the deck screen."
          />

          {isPoll ? (
            <>
              <TextField
                form={form}
                name="question"
                label="Poll question"
                placeholder="Which of these worries you most?"
                hint="Shown under the slide with the answer options."
              />
              <OptionsField form={form} />
            </>
          ) : null}
        </FormShell>
      </div>

      <aside className="slide-editor__preview">
        <Card title="Live preview" description="Exactly what an audience member will see.">
          <SlideStage slide={form.values} showPollQuestion />
          {isPoll ? (
            <ul className="preview-options">
              {form.values.options
                .map((option) => option.trim())
                .filter(Boolean)
                .map((option) => (
                  <li key={option} className="preview-options__item">
                    {option}
                  </li>
                ))}
            </ul>
          ) : null}
        </Card>
      </aside>
    </div>
  );
};
