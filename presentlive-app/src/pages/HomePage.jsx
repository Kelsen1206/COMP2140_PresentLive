import { presentations as presentationsApi } from '../lib/api/index.js';
import { formatDateTime } from '../lib/format.js';
import { useAsyncData } from '../hooks/useAsyncData.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { DataState } from '../components/ui/States.jsx';
import { StatusBadge } from '../components/ui/Badge.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { Link } from 'react-router-dom';

/** The three things the app does, in the order a new visitor meets them. */
const CAPABILITIES = [
  {
    icon: 'slides',
    title: 'Write the deck',
    body: 'Slides are written in presentMD, a small markdown dialect. A live preview shows exactly what the room will see, and the deck generator can draft a starting point from a topic.',
  },
  {
    icon: 'link',
    title: 'Share a link',
    body: 'Every deck has a presentation link for the audience and an edit link for collaborators. Both are plain URLs, so they work on any device with no installs and no accounts.',
  },
  {
    icon: 'chart',
    title: 'Hear the answer',
    body: 'Audience members step through the deck on their own screen and answer polls as they appear. Results arrive on your dashboard live, as charts and as a written summary.',
  },
];

/**
 * The front door of the application.
 *
 * Two kinds of people arrive here: presenters, who need somewhere obvious to
 * start building, and audience members, who usually arrive on a link instead
 * and need to be told so. Both are addressed before anything else on the page.
 */
export const HomePage = () => {
  useDocumentTitle();

  const { data, status, error, reload } = useAsyncData(
    ({ signal }) => presentationsApi.list({ sort: '-updated_at', limit: 3 }, { signal }),
    [],
  );

  const recent = Array.isArray(data) ? data : [];

  // A first-time visitor with no decks should meet the hero and the walkthrough,
  // not an empty panel -- so the section is hidden once it is known to be empty,
  // but kept while loading or after a failure so neither goes unreported.
  const showRecent = status !== 'ready' || recent.length > 0;

  return (
    <div className="page">
      <section className="hero">
        <div className="hero__text">
          <p className="hero__eyebrow">Interactive presentations, in the browser</p>
          <h1 className="hero__title">Decks that talk back.</h1>
          <p className="hero__lead">
            Write a slide deck, send your audience a link, and watch their answers arrive while you
            speak. No installs, no accounts, nothing to set up in the room.
          </p>
          <div className="hero__actions">
            <Button to="/presentations/new" variant="primary" size="lg" icon="plus">
              Create a presentation
            </Button>
            <Button to="/presentations" variant="secondary" size="lg" icon="slides">
              Open your decks
            </Button>
          </div>
          <p className="hero__note">
            <Icon name="info" size={15} />
            Here to watch a presentation? Open the link the presenter sent you. It takes you straight
            in.
          </p>
        </div>

        <div className="hero__panel" aria-hidden="true">
          <div className="hero__slide">
            <p className="hero__slide-heading">Designing for the back row</p>
            <ul className="hero__slide-list">
              <li>One idea per slide</li>
              <li>Words big enough to read standing up</li>
              <li>Ask, do not tell</li>
            </ul>
          </div>
          <div className="hero__poll">
            <p className="hero__poll-question">Which slide loses a room fastest?</p>
            <div className="hero__poll-bars">
              <span style={{ width: '72%' }}>Wall of text</span>
              <span style={{ width: '46%' }}>Tiny charts</span>
              <span style={{ width: '24%' }}>No point</span>
            </div>
          </div>
        </div>
      </section>

      <section className="capabilities" aria-label="What PresentLive does">
        {CAPABILITIES.map((item) => (
          <article className="capability" key={item.title}>
            <span className="capability__icon">
              <Icon name={item.icon} size={20} />
            </span>
            <h2 className="capability__title">{item.title}</h2>
            <p className="capability__body">{item.body}</p>
          </article>
        ))}
      </section>

      {showRecent ? (
        <Card
          title="Pick up where you left off"
          description="Your three most recently updated decks."
          actions={
            <Button to="/presentations" size="sm" variant="ghost" iconAfter="arrowRight">
              All presentations
            </Button>
          }
        >
          <DataState
            status={status}
            data={recent}
            error={error}
            onRetry={reload}
            loadingLabel="Loading your presentations"
            errorTitle="Your recent presentations could not be loaded"
          >
            {(presentations) => (
              <ul className="recent-list">
                {presentations.map((presentation) => (
                  <li key={presentation.id} className="recent-list__row">
                    <Link to={`/presentations/${presentation.id}`} className="recent-list__link">
                      <span className="recent-list__title">{presentation.title}</span>
                      <span className="recent-list__meta">
                        Updated {formatDateTime(presentation.updated_at)}
                      </span>
                    </Link>
                    <StatusBadge value={presentation.status} />
                  </li>
                ))}
              </ul>
            )}
          </DataState>
        </Card>
      ) : null}

      <section className="cta">
        <h2 className="cta__title">New here?</h2>
        <p className="cta__body">
          The walkthrough explains both sides of the app: building a deck as a presenter, and
          stepping through one as an audience member.
        </p>
        <Button to="/help" variant="secondary" iconAfter="arrowRight">
          Read how it works
        </Button>
      </section>
    </div>
  );
};
