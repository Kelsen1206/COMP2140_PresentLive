import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/States.jsx';

/**
 * Shown for any address that does not match a route.
 *
 * A mistyped or expired share link is the most likely way to land here, so the
 * page says as much and offers a way onward rather than leaving a dead end.
 */
export const NotFoundPage = () => {
  useDocumentTitle('Page not found');

  return (
    <div className="page page--narrow">
      <EmptyState
        icon="search"
        title="We could not find that page"
        message="The address may be mistyped, or the presentation it pointed to may have been deleted. Check the link you were given, or start from the home page."
        action={
          <div className="empty-actions">
            <Button to="/" variant="primary" icon="home">
              Go to the home page
            </Button>
            <Button to="/presentations" variant="secondary" icon="slides">
              See your presentations
            </Button>
          </div>
        }
      />
    </div>
  );
};
