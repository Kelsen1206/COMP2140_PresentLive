import { useId } from 'react';

/**
 * Shared form controls.
 *
 * Each control takes the object returned by `useForm` plus a field name, and
 * wires up its own value, change handler, blur handler and error message. That
 * is why the Add and Edit screens can share one form component instead of
 * repeating the same label/input/error markup for every field.
 */

/**
 * Label, control, hint and error message, laid out consistently.
 *
 * @param {{
 *   id: string,
 *   label: string,
 *   error?: string,
 *   hint?: React.ReactNode,
 *   required?: boolean,
 *   children: React.ReactNode,
 * }} props
 */
export const FormField = ({ id, label, error, hint, required = false, children }) => (
  <div className={`field ${error ? 'field--invalid' : ''}`.trim()}>
    <label className="field__label" htmlFor={id}>
      {label}
      {required ? (
        <span className="field__required" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
    {hint ? (
      <p className="field__hint" id={`${id}-hint`}>
        {hint}
      </p>
    ) : null}
    {children}
    {error ? (
      <p className="field__error" id={`${id}-error`} role="alert">
        {error}
      </p>
    ) : null}
  </div>
);

/**
 * Work out the accessibility attributes a control needs for its hint and error.
 *
 * @param {{id: string, hint?: unknown, error?: unknown}} options
 * @returns {{'aria-invalid'?: true, 'aria-describedby'?: string}}
 */
const describedBy = ({ id, hint, error }) => {
  const ids = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean);
  return {
    ...(error ? { 'aria-invalid': true } : {}),
    ...(ids.length > 0 ? { 'aria-describedby': ids.join(' ') } : {}),
  };
};

/**
 * A single-line text or number input bound to a form field.
 *
 * @param {{form: object, name: string, label: string, type?: string, hint?: React.ReactNode,
 *          placeholder?: string, required?: boolean, min?: number, autoFocus?: boolean}} props
 */
export const TextField = ({
  form,
  name,
  label,
  type = 'text',
  hint,
  placeholder,
  required = true,
  ...rest
}) => {
  const id = useId();
  const error = form.visibleErrors[name];

  return (
    <FormField id={id} label={label} error={error} hint={hint} required={required}>
      <input
        id={id}
        className="input"
        type={type}
        value={form.values[name] ?? ''}
        placeholder={placeholder}
        onChange={(event) => form.setField(name, event.target.value)}
        onBlur={() => form.touchField(name)}
        {...describedBy({ id, hint, error })}
        {...rest}
      />
    </FormField>
  );
};

/**
 * A multi-line text input bound to a form field.
 *
 * @param {{form: object, name: string, label: string, rows?: number, hint?: React.ReactNode,
 *          placeholder?: string, required?: boolean, mono?: boolean}} props
 */
export const TextAreaField = ({
  form,
  name,
  label,
  rows = 4,
  hint,
  placeholder,
  required = true,
  mono = false,
  ...rest
}) => {
  const id = useId();
  const error = form.visibleErrors[name];

  return (
    <FormField id={id} label={label} error={error} hint={hint} required={required}>
      <textarea
        id={id}
        className={`input textarea ${mono ? 'textarea--mono' : ''}`.trim()}
        rows={rows}
        value={form.values[name] ?? ''}
        placeholder={placeholder}
        onChange={(event) => form.setField(name, event.target.value)}
        onBlur={() => form.touchField(name)}
        {...describedBy({ id, hint, error })}
        {...rest}
      />
    </FormField>
  );
};

/**
 * A dropdown bound to a form field.
 *
 * @param {{form: object, name: string, label: string, options: {value: string, label: string}[],
 *          hint?: React.ReactNode, required?: boolean}} props
 */
export const SelectField = ({ form, name, label, options, hint, required = true, ...rest }) => {
  const id = useId();
  const error = form.visibleErrors[name];

  return (
    <FormField id={id} label={label} error={error} hint={hint} required={required}>
      <select
        id={id}
        className="input select"
        value={form.values[name] ?? ''}
        onChange={(event) => form.setField(name, event.target.value)}
        onBlur={() => form.touchField(name)}
        {...describedBy({ id, hint, error })}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
};

/**
 * A group of radio buttons bound to a form field. Used where the choice matters
 * enough to be visible without opening a dropdown.
 *
 * @param {{form: object, name: string, label: string,
 *          options: {value: string, label: string, description?: string}[],
 *          hint?: React.ReactNode}} props
 */
export const RadioField = ({ form, name, label, options, hint }) => {
  const id = useId();
  const error = form.visibleErrors[name];

  return (
    <fieldset className={`field fieldset ${error ? 'field--invalid' : ''}`.trim()}>
      <legend className="field__label">{label}</legend>
      {hint ? <p className="field__hint">{hint}</p> : null}
      <div className="radio-group">
        {options.map((option) => (
          <label
            key={option.value}
            className={`radio ${form.values[name] === option.value ? 'radio--checked' : ''}`.trim()}
          >
            <input
              type="radio"
              name={`${id}-${name}`}
              value={option.value}
              checked={form.values[name] === option.value}
              onChange={() => {
                form.setField(name, option.value);
                form.touchField(name);
              }}
            />
            <span className="radio__text">
              <span className="radio__label">{option.label}</span>
              {option.description ? (
                <span className="radio__description">{option.description}</span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
      {error ? (
        <p className="field__error" role="alert">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
};
