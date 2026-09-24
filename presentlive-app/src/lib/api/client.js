import { API_BASE_URL, API_TOKEN, isApiConfigured } from '../../config.js';

/**
 * Error thrown by every failed API interaction.
 *
 * Carries a message that is already safe to show to a user, plus the HTTP
 * status and the `details` array the API returns when field validation fails.
 */
export class ApiError extends Error {
  /**
   * @param {string} message User-friendly description of what went wrong.
   * @param {{status?: number, details?: string[], cause?: unknown}} [meta]
   */
  constructor(message, { status = 0, details = [], cause } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.cause = cause;
  }

  /** True when the request failed because of bad user input rather than a bug. */
  get isValidationError() {
    return this.status === 400 || this.status === 422;
  }
}

/**
 * Turn a plain object into a query string the API understands.
 *
 * Values that are undefined, null or an empty string are dropped so that
 * callers can pass optional filters without branching at the call site.
 *
 * @param {Record<string, string|number|boolean|undefined|null>} params
 * @returns {string} A leading-question-mark query string, or an empty string.
 */
const buildQuery = (params = {}) => {
  const pairs = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== '',
  );
  return pairs.length === 0
    ? ''
    : `?${new URLSearchParams(pairs.map(([key, value]) => [key, String(value)])).toString()}`;
};

/**
 * Translate an HTTP status into a sentence a non-technical user can act on.
 *
 * @param {number} status
 * @param {string} [serverMessage] The error field the API returned, if any.
 * @returns {string}
 */
const friendlyMessage = (status, serverMessage) => {
  const byStatus = {
    400: 'Some of the information sent was not valid. Please check the form and try again.',
    401: 'The app could not sign in to the data service. Check that the API token in your .env file is current.',
    403: 'This action is not permitted.',
    404: 'We could not find what you were looking for. It may have been deleted.',
    429: 'Too many requests were made at once. Please wait a moment and try again.',
    500: 'The data service ran into a problem. Please try again shortly.',
    502: 'The data service is temporarily unreachable. Please try again shortly.',
    503: 'The data service is temporarily unreachable. Please try again shortly.',
  };
  return (
    byStatus[status] ?? serverMessage ?? 'Something went wrong while contacting the data service.'
  );
};

/**
 * Read the body of a response without throwing on an empty payload.
 *
 * A 204 No Content (which the API returns from DELETE) has nothing to parse.
 *
 * @param {Response} response
 * @returns {Promise<unknown|null>}
 */
const readBody = async (response) => {
  if (response.status === 204) return null;
  const text = await response.text();
  if (text.trim() === '') return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new ApiError('The data service returned a response the app could not read.', {
      status: response.status,
      cause: error,
    });
  }
};

/**
 * The API returns a list as an object with a data array, and a single record on
 * its own. This unwraps the single-record case defensively so callers always
 * receive the record itself.
 *
 * @param {unknown} payload
 * @returns {unknown}
 */
const unwrapRecord = (payload) =>
  payload && typeof payload === 'object' && 'data' in payload && !('id' in payload)
    ? payload.data
    : payload;

/**
 * The single point in the application where fetch is called against the API.
 *
 * Every resource helper below, and therefore every component, routes through
 * this function -- so authentication, JSON encoding and error translation are
 * written exactly once.
 *
 * @param {string} path Path below the API root, for example `/presentations`.
 * @param {{method?: string, body?: unknown, query?: object, signal?: AbortSignal}} [options]
 * @returns {Promise<unknown>} The parsed response body, or null for a 204.
 * @throws {ApiError} For network failures and any non-2xx response.
 */
export const request = async (path, { method = 'GET', body, query, signal } = {}) => {
  if (!isApiConfigured()) {
    throw new ApiError(
      'No API token is configured. Add VITE_API_TOKEN to the .env file and restart the dev server.',
      { status: 401 },
    );
  }

  const url = `${API_BASE_URL}${path}${buildQuery(query)}`;
  const headers = { Authorization: `Bearer ${API_TOKEN}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      signal,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    // An aborted request is a normal part of React cleanup, not a failure.
    if (error?.name === 'AbortError') throw error;
    throw new ApiError(
      'Could not reach the data service. Please check your internet connection and try again.',
      { cause: error },
    );
  }

  const payload = await readBody(response);

  if (!response.ok) {
    const serverMessage = typeof payload?.error === 'string' ? payload.error : undefined;
    const details = Array.isArray(payload?.details) ? payload.details.map(String) : [];
    throw new ApiError(friendlyMessage(response.status, serverMessage), {
      status: response.status,
      details,
    });
  }

  return payload;
};

/**
 * Build a set of CRUD helpers for one API entity.
 *
 * Because the API is resource-based, every entity behaves identically -- so the
 * five operations are written once here and reused by all four entities rather
 * than being repeated in each feature module.
 *
 * @param {string} entity The entity name as defined in the API configuration.
 */
export const createResource = (entity) => ({
  /**
   * List records, optionally filtered and sorted.
   *
   * @param {object} [query] Filters such as `{ presentation_id: id, sort: 'position' }`.
   * @param {{signal?: AbortSignal}} [options]
   * @returns {Promise<object[]>}
   */
  async list(query = {}, { signal } = {}) {
    // The API pages at 50 by default; this app never needs paging, so it asks
    // for the documented maximum of 200 instead.
    const payload = await request(`/${entity}`, { query: { limit: 200, ...query }, signal });
    return Array.isArray(payload?.data) ? payload.data : [];
  },

  /**
   * Fetch a single record by id.
   *
   * @param {string} id
   * @param {{signal?: AbortSignal}} [options]
   * @returns {Promise<object>}
   */
  async get(id, { signal } = {}) {
    return unwrapRecord(await request(`/${entity}/${id}`, { signal }));
  },

  /**
   * Create a record.
   *
   * @param {object} values
   * @returns {Promise<object>} The created record, including its server-assigned id.
   */
  async create(values) {
    return unwrapRecord(await request(`/${entity}`, { method: 'POST', body: values }));
  },

  /**
   * Partially update a record.
   *
   * @param {string} id
   * @param {object} values Only the fields that changed.
   * @returns {Promise<object>}
   */
  async update(id, values) {
    return unwrapRecord(await request(`/${entity}/${id}`, { method: 'PATCH', body: values }));
  },

  /**
   * Permanently delete a record.
   *
   * @param {string} id
   * @returns {Promise<null>}
   */
  async remove(id) {
    return request(`/${entity}/${id}`, { method: 'DELETE' });
  },

  /** The entity name, used when building live-event stream URLs. */
  entity,
});
