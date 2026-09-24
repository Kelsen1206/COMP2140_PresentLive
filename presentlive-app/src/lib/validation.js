import { PRESENTATION_STATUS, SLIDE_TYPE } from '../config.js';

/**
 * Form validation rules.
 *
 * Each validator returns either a message to show against the field or null
 * when the value is acceptable. Rules are small and composable so that the same
 * "this field is required" wording appears everywhere in the app.
 */

/**
 * @param {string} label Field name as it appears on the form.
 * @returns {(value: unknown) => string|null}
 */
export const required = (label) => (value) =>
  String(value ?? '').trim() === '' ? `${label} is required.` : null;

/**
 * @param {string} label
 * @param {number} limit Maximum number of characters allowed.
 * @returns {(value: unknown) => string|null}
 */
export const maxLength = (label, limit) => (value) =>
  String(value ?? '').length > limit ? `${label} must be ${limit} characters or fewer.` : null;

/**
 * @param {string} label
 * @param {string[]} allowed
 * @returns {(value: unknown) => string|null}
 */
export const oneOf = (label, allowed) => (value) =>
  allowed.includes(value) ? null : `${label} must be one of: ${allowed.join(', ')}.`;

/**
 * @param {string} label
 * @returns {(value: unknown) => string|null}
 */
export const positiveNumber = (label) => (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return `${label} must be a number.`;
  if (parsed < 1) return `${label} must be 1 or greater.`;
  return null;
};

/**
 * Run a map of field rules over a set of values.
 *
 * @param {Record<string, unknown>} values
 * @param {Record<string, ((value: unknown, values: object) => string|null)[]>} rules
 * @returns {Record<string, string>} One message per failing field.
 */
export const runRules = (values, rules) =>
  Object.entries(rules).reduce((errors, [field, fieldRules]) => {
    const message = fieldRules
      .map((rule) => rule(values[field], values))
      .find((result) => result !== null);
    return message ? { ...errors, [field]: message } : errors;
  }, {});

/** True when a set of validation errors is empty. */
export const isValid = (errors) => Object.keys(errors).length === 0;

/**
 * Validate the Add/Edit Presentation form.
 *
 * @param {object} values
 * @returns {Record<string, string>}
 */
export const validatePresentation = (values) =>
  runRules(values, {
    title: [required('Title'), maxLength('Title', 120)],
    description: [required('Description'), maxLength('Description', 600)],
    presenter_name: [required('Presenter name'), maxLength('Presenter name', 80)],
    status: [required('Status'), oneOf('Status', Object.values(PRESENTATION_STATUS))],
  });

/**
 * Validate the Add/Edit Slide form.
 *
 * Poll slides carry two extra fields, so those rules are only applied when the
 * chosen type is Poll.
 *
 * @param {object} values
 * @returns {Record<string, string>}
 */
export const validateSlide = (values) => {
  const base = runRules(values, {
    title: [required('Slide title'), maxLength('Slide title', 120)],
    body: [required('Slide body')],
    type: [required('Slide type'), oneOf('Slide type', Object.values(SLIDE_TYPE))],
    position: [required('Position'), positiveNumber('Position')],
  });

  if (values.type !== SLIDE_TYPE.poll) return base;

  const pollErrors = runRules(values, {
    question: [required('Poll question'), maxLength('Poll question', 200)],
  });

  const options = Array.isArray(values.options) ? values.options : [];
  const filled = options.map((option) => String(option).trim()).filter(Boolean);
  const duplicated = new Set(filled).size !== filled.length;

  const optionsError = (() => {
    if (filled.length < 2) return 'Add at least two answer options.';
    if (duplicated) return 'Each answer option must be different.';
    return null;
  })();

  return {
    ...base,
    ...pollErrors,
    ...(optionsError ? { options: optionsError } : {}),
  };
};

/**
 * Validate the display name an audience member enters before joining.
 *
 * @param {object} values
 * @returns {Record<string, string>}
 */
export const validateJoin = (values) =>
  runRules(values, {
    display_name: [required('Display name'), maxLength('Display name', 40)],
  });
