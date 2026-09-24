/**
 * Central application configuration.
 *
 * Every value is read from Vite environment variables (see `.env.example`) so
 * that no credential is hard-coded into a source file. A fallback is provided
 * for the public base URLs only -- never for the secrets.
 */

/**
 * The environment Vite injects at build time.
 *
 * Guarded so that the constants below can also be imported by plain Node, which
 * has no `import.meta.env`; the fallbacks then apply.
 */
const viteEnv = import.meta.env ?? {};

/** Base URL of the UQ RESTful API that stores every record in this app. */
export const API_BASE_URL =
  viteEnv.VITE_API_BASE_URL ?? 'https://comp2140-3ea651da.uqcloud.net/api';

/** Bearer token sent with every API request. */
export const API_TOKEN = viteEnv.VITE_API_TOKEN ?? '';

/** OpenAI-compatible endpoint provided by the course for LLM access. */
export const AI_BASE_URL =
  viteEnv.VITE_AI_BASE_URL ?? 'https://comp2140-3ea651da.uqcloud.net/api/_ai/v1';

/** API key for the course AI proxy. Separate from API_TOKEN by design. */
export const AI_API_KEY = viteEnv.VITE_AI_KEY ?? '';

/** Model used for every generative call. One of the models the proxy allows. */
export const AI_MODEL = viteEnv.VITE_AI_MODEL ?? 'gpt-4o-mini';

/**
 * Names of the entities defined in the API configuration panel.
 * Kept here so a rename only has to happen in one place.
 */
export const ENTITIES = {
  presentations: 'presentations',
  slides: 'slides',
  attendees: 'attendees',
  pollResponses: 'poll_responses',
};

/** Allowed values for the Presentation `status` field. */
export const PRESENTATION_STATUS = {
  draft: 'Draft',
  published: 'Published',
};

/** Allowed values for the Slide `type` field. */
export const SLIDE_TYPE = {
  content: 'Content',
  poll: 'Poll',
};

/** Allowed values for the Attendee `status` field. */
export const ATTENDEE_STATUS = {
  viewing: 'Viewing',
  finished: 'Finished',
};

/** True when the app has everything it needs to talk to the API. */
export const isApiConfigured = () => API_TOKEN.trim().length > 0;

/** True when the app has everything it needs to talk to the AI proxy. */
export const isAiConfigured = () => AI_API_KEY.trim().length > 0;
