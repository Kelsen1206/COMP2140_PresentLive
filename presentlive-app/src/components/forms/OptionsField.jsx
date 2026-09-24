import { Button } from '../ui/Button.jsx';
import { Icon } from '../ui/Icon.jsx';
import { FormField } from './Fields.jsx';

/** A poll may offer between two and six answers. */
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

/**
 * Editor for the list of answers a poll slide offers.
 *
 * The options are stored as a JSON array on the Slide record, so this control
 * edits an array rather than a string: each row is its own text input, rows can
 * be added and removed, and the array is handed back to the form untouched by
 * any parsing step.
 *
 * @param {{form: object, name?: string, label?: string, hint?: React.ReactNode}} props
 */
export const OptionsField = ({
  form,
  name = 'options',
  label = 'Answer options',
  hint = 'Audience members pick exactly one of these. Two to six options.',
}) => {
  const options = Array.isArray(form.values[name]) ? form.values[name] : [];
  const error = form.visibleErrors[name];

  /**
   * Replace the option at one index.
   *
   * @param {number} index
   * @param {string} value
   */
  const updateOption = (index, value) => {
    form.setField(
      name,
      options.map((option, position) => (position === index ? value : option)),
    );
  };

  /** Append an empty row for another answer. */
  const addOption = () => form.setField(name, [...options, '']);

  /**
   * Remove one row, keeping at least the minimum number of inputs on screen.
   *
   * @param {number} index
   */
  const removeOption = (index) => {
    form.setField(
      name,
      options.filter((_, position) => position !== index),
    );
    form.touchField(name);
  };

  return (
    <FormField id={`${name}-editor`} label={label} error={error} hint={hint}>
      <ul className="options-editor">
        {options.map((option, index) => (
          // The array is a plain list of strings with no stable id of its own,
          // so the row position is the only key available.
          // eslint-disable-next-line react/no-array-index-key
          <li className="options-editor__row" key={`option-${index}`}>
            <span className="options-editor__number" aria-hidden="true">
              {index + 1}
            </span>
            <input
              className="input"
              type="text"
              value={option}
              aria-label={`Answer option ${index + 1}`}
              placeholder={`Option ${index + 1}`}
              onChange={(event) => updateOption(index, event.target.value)}
              onBlur={() => form.touchField(name)}
            />
            <button
              type="button"
              className="options-editor__remove"
              onClick={() => removeOption(index)}
              disabled={options.length <= MIN_OPTIONS}
              aria-label={`Remove answer option ${index + 1}`}
              title={
                options.length <= MIN_OPTIONS
                  ? 'A poll needs at least two options'
                  : 'Remove this option'
              }
            >
              <Icon name="trash" size={16} />
            </button>
          </li>
        ))}
      </ul>

      <Button
        onClick={addOption}
        icon="plus"
        size="sm"
        variant="ghost"
        disabled={options.length >= MAX_OPTIONS}
      >
        Add option
      </Button>
    </FormField>
  );
};
