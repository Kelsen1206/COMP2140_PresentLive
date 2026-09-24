import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ATTENDEE_STATUS, PRESENTATION_STATUS, SLIDE_TYPE } from '../../config.js';
import { attendees as attendeesApi, fetchPresentationForAudience } from '../../lib/api/index.js';
import { pluralise } from '../../lib/format.js';
import { validateJoin } from '../../lib/validation.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { useForm } from '../../hooks/useForm.js';
import { useMutation } from '../../hooks/useMutation.js';
import { useAttendeeSession } from '../../hooks/useAttendeeSession.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Callout } from '../../components/ui/Callout.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { DataState, EmptyState } from '../../components/ui/States.jsx';
import { FormShell } from '../../components/forms/FormShell.jsx';
import { TextField } from '../../components/forms/Fields.jsx';

/**
 * The welcome screen an audience member lands on.
 *
 * This is the far end of the presentation link. Everything on the page is
 * loaded from the id in the URL, so it works in a browser that has never opened
 * the app before, with no sign-in of any kind. It states what the deck is, who
 * is presenting, how long it will take and the two rules of the flow, then asks
 * for the one piece of information the presenter needs: a display name.
 */
export const JoinPage = () => {
  const { presentationId } = useParams();
  const navigate = useNavigate();
  const { attendeeId, rememberAttendee, forgetAttendee } = useAttendeeSession(presentationId);

  const { data, status, error, reload } = useAsyncData(
    ({ signal }) => fetchPresentationForAudience(presentationId, { signal }),
    [presentationId],
  );

  useDocumentTitle(data ? `Join ${data.presentation.title}` : 'Join a presentation');

  const join = useMutation(attendeesApi.create);

  /**
   * Create the Attendee record and step into the first slide.
   *
   * @param {object} values
   */
  const handleJoin = useCallback(
    async (values) => {
      const result = await join.run({
        presentation_id: presentationId,
        display_name: values.display_name.trim(),
        status: ATTENDEE_STATUS.viewing,
        current_position: 1,
      });

      if (!result.ok) return;

      rememberAttendee(result.data.id);
      navigate(`/present/${presentationId}/slide/1`);
    },
    [join, presentationId, rememberAttendee, navigate],
  );

  const form = useForm({
    initialValues: { display_name: '' },
    validate: validateJoin,
    onSubmit: handleJoin,
  });

  return (
    <div className="page page--narrow">
      <DataState
        status={status}
        data={data}
        error={error}
        onRetry={reload}
        loadingLabel="Opening the presentation"
        errorTitle="This presentation could not be opened"
      >
        {({ presentation, slides }) => {
          const pollCount = slides.filter((slide) => slide.type === SLIDE_TYPE.poll).length;

          if (presentation.status !== PRESENTATION_STATUS.published) {
            return (
              <EmptyState
                icon="alert"
                title="This presentation is not ready yet"
                message={`${presentation.presenter_name} is still working on "${presentation.title}". Try this link again once they have published it.`}
              />
            );
          }

          if (slides.length === 0) {
            return (
              <EmptyState
                icon="slides"
                title="There are no slides yet"
                message={`"${presentation.title}" has been published but has no slides. Check back shortly.`}
              />
            );
          }

          return (
            <div className="join">
              <header className="join__header">
                <p className="join__eyebrow">You have been invited to</p>
                <h1 className="join__title">{presentation.title}</h1>
                <p className="join__presenter">
                  <Icon name="users" size={16} />
                  Presented by {presentation.presenter_name}
                </p>
              </header>

              <Card>
                <p className="join__description">{presentation.description}</p>

                <ul className="join__facts">
                  <li>
                    <Icon name="slides" size={16} />
                    <span>{pluralise(slides.length, 'slide')}</span>
                  </li>
                  <li>
                    <Icon name="chart" size={16} />
                    <span>
                      {pollCount === 0
                        ? 'No polls'
                        : `${pluralise(pollCount, 'poll')} to answer along the way`}
                    </span>
                  </li>
                </ul>

                <Callout tone="info" title="How this works">
                  <ul className="join__rules">
                    <li>You move through the deck one slide at a time, at your own pace.</li>
                    <li>Like a live talk, you cannot go back to a slide you have passed.</li>
                    <li>A poll answer is final once you submit it.</li>
                  </ul>
                </Callout>

                {attendeeId ? (
                  <div className="join__resume">
                    <p>You have already joined this presentation on this device.</p>
                    <div className="join__resume-actions">
                      <Button
                        to={`/present/${presentationId}/slide/1`}
                        variant="primary"
                        iconAfter="arrowRight"
                      >
                        Continue where you left off
                      </Button>
                      <Button onClick={forgetAttendee} variant="ghost">
                        Join as someone else
                      </Button>
                    </div>
                  </div>
                ) : (
                  <FormShell
                    form={form}
                    submitLabel="Start the presentation"
                    pendingLabel="Joining"
                    error={join.error}
                  >
                    <TextField
                      form={form}
                      name="display_name"
                      label="Your display name"
                      placeholder="Sam"
                      autoFocus
                      hint="The presenter sees this beside your answers. A first name is plenty."
                    />
                  </FormShell>
                )}
              </Card>
            </div>
          );
        }}
      </DataState>
    </div>
  );
};
