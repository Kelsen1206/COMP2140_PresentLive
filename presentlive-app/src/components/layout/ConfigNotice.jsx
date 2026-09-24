import { isAiConfigured, isApiConfigured } from '../../config.js';

/**
 * List the credentials that have not been supplied.
 *
 * @returns {string[]} One sentence per missing value, empty when setup is complete.
 */
const missingCredentials = () =>
  [
    isApiConfigured()
      ? ''
      : 'VITE_API_TOKEN is missing, so no data can be loaded or saved. Paste your API access token into the .env file.',
    isAiConfigured()
      ? ''
      : 'VITE_AI_KEY is missing, so the AI deck generator and poll summary are unavailable. Everything else still works.',
  ].filter(Boolean);

/**
 * Warns, once and at the top of every screen, when the app has been started
 * without the credentials it needs.
 *
 * Without this the first symptom of a missing token is a failed request on an
 * inner page, which is a confusing way to learn that a one-line setup step was
 * skipped.
 */
export const ConfigNotice = () => {
  const problems = missingCredentials();
  if (problems.length === 0) return null;

  return (
    <div className="config-notice" role="alert">
      <div className="config-notice__inner">
        <p className="config-notice__title">Finish the setup before using the app</p>
        <ul className="config-notice__list">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
        <p className="config-notice__hint">
          Copy <code>.env.example</code> to <code>.env</code>, paste your values in, then restart the
          dev server. The steps are in the project Readme.
        </p>
      </div>
    </div>
  );
};
