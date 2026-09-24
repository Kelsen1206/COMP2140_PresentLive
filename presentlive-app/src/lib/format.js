/**
 * Small display helpers shared by the presentation views.
 */

/**
 * Format an API timestamp for reading, falling back to an em dash when the
 * value is missing or unparseable.
 *
 * @param {string|number|undefined} value An ISO date string from the API.
 * @returns {string}
 */
export const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

/**
 * Format a 0..1 ratio as a whole-number percentage.
 *
 * @param {number} ratio
 * @returns {string}
 */
export const formatPercent = (ratio) => `${Math.round((Number(ratio) || 0) * 100)}%`;

/**
 * Choose the singular or plural form of a word for a count.
 *
 * @param {number} count
 * @param {string} singular
 * @param {string} [plural] Defaults to the singular plus an "s".
 * @returns {string} The count and the correctly inflected word.
 */
export const pluralise = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

/**
 * Build an absolute URL for one of this app's routes, suitable for sharing.
 *
 * @param {string} path A route path beginning with a slash.
 * @returns {string}
 */
export const absoluteUrl = (path) =>
  typeof window === 'undefined' ? path : new URL(path, window.location.origin).toString();

/**
 * Shorten a run of text for a preview, cutting on a word boundary.
 *
 * @param {string} text
 * @param {number} [limit]
 * @returns {string}
 */
export const truncate = (text, limit = 140) => {
  const value = String(text ?? '').trim();
  if (value.length <= limit) return value;
  const cut = value.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
};
