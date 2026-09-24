import { useCallback, useMemo, useState } from 'react';
import { isValid } from '../lib/validation.js';

/**
 * Drive a controlled form: values, per-field validation messages, and
 * submission.
 *
 * Every Add and Edit form in the app is built on this hook, so the rules about
 * when a message appears are written once. A field's error is only shown after
 * the user has left that field or tried to submit, which keeps a fresh form
 * from turning red before anything has been typed.
 *
 * @template {Record<string, unknown>} T
 * @param {{
 *   initialValues: T,
 *   validate?: (values: T) => Record<string, string>,
 *   onSubmit: (values: T) => Promise<unknown>|unknown,
 * }} options
 * @returns {{
 *   values: T,
 *   errors: Record<string, string>,
 *   visibleErrors: Record<string, string>,
 *   setField: (name: keyof T, value: unknown) => void,
 *   setValues: (updater: T|((current: T) => T)) => void,
 *   touchField: (name: keyof T) => void,
 *   handleSubmit: (event: React.FormEvent) => Promise<void>,
 *   isSubmitting: boolean,
 *   hasErrors: boolean,
 *   submitAttempted: boolean,
 *   reset: (nextValues?: T) => void,
 * }}
 */
export const useForm = ({ initialValues, validate = () => ({}), onSubmit }) => {
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const errors = useMemo(() => validate(values), [values, validate]);

  /** Errors the user should be able to see right now. */
  const visibleErrors = useMemo(
    () =>
      Object.entries(errors).reduce(
        (shown, [field, message]) =>
          submitAttempted || touched[field] ? { ...shown, [field]: message } : shown,
        {},
      ),
    [errors, touched, submitAttempted],
  );

  /** Update one field, which is what every input's onChange calls. */
  const setField = useCallback((name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
  }, []);

  /** Mark a field as visited so its message may be shown. */
  const touchField = useCallback((name) => {
    setTouched((current) => ({ ...current, [name]: true }));
  }, []);

  /**
   * Validate and, if the form is clean, hand the values to the caller.
   *
   * @param {React.FormEvent} event
   */
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setSubmitAttempted(true);

      if (!isValid(validate(values))) return;

      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit],
  );

  /** Return the form to a clean state, optionally with new values. */
  const reset = useCallback(
    (nextValues = initialValues) => {
      setValues(nextValues);
      setTouched({});
      setSubmitAttempted(false);
    },
    [initialValues],
  );

  return {
    values,
    errors,
    visibleErrors,
    setField,
    setValues,
    touchField,
    handleSubmit,
    isSubmitting,
    hasErrors: !isValid(errors),
    submitAttempted,
    reset,
  };
};
