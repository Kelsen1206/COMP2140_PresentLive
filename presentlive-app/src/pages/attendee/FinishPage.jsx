import { Navigate, useParams } from 'react-router-dom';
import { SLIDE_TYPE } from '../../config.js';
import {
  attendees as attendeesApi,
  fetchPresentationForAudience,
  pollResponses as pollResponsesApi,
} from '../../lib/api/index.js';
import { answersByAttendee } from '../../lib/statistics.js';
import { pluralise } from '../../lib/format.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { useAttendeeSession } from '../../hooks/useAttendeeSession.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { DataState } from '../../components/ui/States.jsx';

/**
 * The end of the guided flow.
 *
 * It thanks the audience member, confirms what was recorded, and shows their
 * own answers back to them -- so nothing they typed disappears into the app
 * without being acknowledged. There is no way back into the deck from here,
 * which is what ends the flow cleanly rather than leaving them stranded.
 */
export const FinishPage = () => {
  const { presentationId } = useParams();
  const { attendeeId, forgetAttendee } = useAttendeeSession(presentationId);

  const { data, status, error, reload } = useAsyncData(
    async ({ signal }) => {
      if (!attendeeId) return null;

      const [deck, attendee, responses] = await Promise.all([
        fetchPresentationForAudience(presentationId, { signal }),
        attendeesApi.get(attendeeId, { signal }),
        pollResponsesApi.list({ attendee_id: attendeeId }, { signal }),
      ]);

      return { ...deck, attendee, responses };
    },
    [presentationId, attendeeId],
  );

  useDocumentTitle(data ? `Thank you - ${data.presentation.title}` : 'Thank you');

  if (!attendeeId) {
    return <Navigate to={`/present/${presentationId}`} replace />;
  }

  return (
    <div className="page page--narrow">
      <DataState
        status={status}
        data={data}
        error={error}
        onRetry={reload}
        loadingLabel="Wrapping up"
        errorTitle="This page could not be loaded"
      >
        {({ presentation, slides, attendee, responses }) => {
          const answers = answersByAttendee(attendee, slides, responses).filter(
            (entry) => entry.option !== null,
          );
          const pollCount = slides.filter((slide) => slide.type === SLIDE_TYPE.poll).length;

          return (
            <div className="finish">
              <div className="finish__badge" aria-hidden="true">
                <Icon name="check" size={32} />
              </div>

              <h1 className="finish__title">Thanks, {attendee.display_name}</h1>
              <p className="finish__subtitle">
                You reached the end of <strong>{presentation.title}</strong> by{' '}
                {presentation.presenter_name}.
              </p>

              <Card title="What was recorded">
                <p className="finish__recorded">
                  You worked through {pluralise(slides.length, 'slide')}
                  {pollCount > 0 ? ` and answered ${answers.length} of the ${pollCount} polls` : ''}.{' '}
                  {presentation.presenter_name} can see your display name and your answers.
                </p>

                {answers.length > 0 ? (
                  <dl className="finish__answers">
                    {answers.map(({ slide, option }) => (
                      <div className="finish__answer" key={slide.id}>
                        <dt>{slide.question}</dt>
                        <dd>{option}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <p className="muted">There were no polls to answer in this deck.</p>
                )}
              </Card>

              <div className="finish__actions">
                <Button to="/" variant="secondary" icon="home">
                  Go to the PresentLive home page
                </Button>
                <Button to="/presentations/new" variant="ghost" icon="plus">
                  Make a presentation of your own
                </Button>
              </div>

              <p className="finish__reset">
                Sharing this device with someone else?{' '}
                <button type="button" className="link-button" onClick={forgetAttendee}>
                  Clear your session
                </button>{' '}
                so they can join as themselves.
              </p>
            </div>
          );
        }}
      </DataState>
    </div>
  );
};
