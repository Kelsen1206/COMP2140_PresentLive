import { useEffect, useRef } from 'react';

/**
 * Keep the most recent version of a value in a ref.
 *
 * Callbacks passed to a hook are usually new function objects on every render.
 * Holding them in a ref lets an effect call the current one without listing it
 * as a dependency, which would otherwise tear down and rebuild the effect --
 * refetching data or reopening a network stream -- on every single render.
 *
 * The ref is updated in an effect rather than during render, so nothing is
 * written while React is still deciding what to draw.
 *
 * @template T
 * @param {T} value
 * @returns {{current: T}}
 */
export const useLatestRef = (value) => {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
};
