import { useCallback, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ATTENDEE_STATUS, PRESENTATION_STATUS, SLIDE_TYPE } from '../../config.js';
import {
  attendees as attendeesApi,
  fetchPresentationForAudience,
  pollResponses as pollResponsesApi,
} from '../../lib/api/index.js';
import { findResponse } from '../../lib/statistics.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { useMutation } from '../../hooks/useMutation.js';
import { useAttendeeSession } from '../../hooks/useAttendeeSession.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { Button } from '../../components/ui/Button.jsx';
import { Callout } from '../../components/ui/Callout.jsx';
import { DataState, EmptyState, ErrorState } from '../../components/ui/States.jsx';
import { SlideStage } from '../../components/slides/SlideStage.jsx';
import { StepProgress } from '../../components/attendee/StepProgress.jsx';
import { PollVoteForm } from '../../components/polls/PollVoteForm.jsx';
import { LivePollResults } from '../../components/polls/LivePollResults.jsx';

/**
 * Keep a stored position inside the range of slides that actually exist.
 *
 * A slide can be deleted while someone is partway through the deck, so the
 * saved position is treated as a hint rather than a guarantee.
 *
 * @param {number} position
 * @param {number} total
 * @returns {number}
 */
const clampPosition = (position, total) =>
  Math.min(Math.max(Number(position) || 1, 1), Math.max(total, 1));

/**
 * One step of the guided audience flow: a single slide on its own page.
 *
 * Progression is controlled entirely by the Attendee record held in the API,
 * not by the URL. Anyone who edits the address bar, uses the browser back
 * button, or reopens the link later is sent straight back to the slide their
 * record says they are on -- so a step cannot be skipped and a finished step
 * cannot be revisited.
 */
export const SlidePage = () => {
  const { presentationId, position } = useParams();
  const navigate = useNavigate();
  const { attendeeId } = useAttendeeSession(presentationId);
  const [advanceError, setAdvanceError] = useState(null);

  const { data, status, error, reload, setData } = useAsyncData(
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

  useDocumentTitle(data ? `${data.presentation.title} - slide ${position}` : 'Presentation');

  const vote = useMutation(pollResponsesApi.create);
  const advance = useMutation(
    useCallback((values) => attendeesApi.update(attendeeId, values), [attendeeId]),
  );

  /**
   * Record this attendee's answer to the current poll slide.
   *
   * @param {object} slide
   * @param {string} option
   */
  const handleVote = useCallback(
    async (slide, option) => {
      const result = await vote.run({
        presentation_id: presentationId,
        slide_id: slide.id,
        attendee_id: attendeeId,
        option,
      });

      if (result.ok) {
        setData((current) => ({ ...current, responses: [...current.responses, result.data] }));
      }
    },
    [vote, presentationId, attendeeId, setData],
  );

  /**
   * Move to the next slide, or end the session on the last one.
   *
   * The new position is written to the API before navigating, so progress
   * survives a closed tab and shows up on the presenter's dashboard.
   *
   * @param {number} current The position just completed.
   * @param {number} total Number of slides in the deck.
   */
  const handleAdvance = useCallback(
    async (current, total) => {
      setAdvanceError(null);
      const isLast = current >= total;

      const result = await advance.run(
        isLast
          ? { status: ATTENDEE_STATUS.finished, current_position: total }
          : { current_position: current + 1 },
      );

      if (!result.ok) {
        setAdvanceError(result.error);
        return;
      }

      // Moving between slides only changes the URL parameter, so this page stays
      // mounted and does not refetch. The local copy of the attendee must be
      // brought up to date with the saved record first -- otherwise the guard
      // below still sees the old position and sends the viewer straight back.
      setData((currentData) => ({
        ...currentData,
        attendee: { ...currentData.attendee, ...result.data },
      }));

      navigate(isLast ? `/present/${presentationId}/done` : `/present/${presentationId}/slide/${current + 1}`);
    },
    [advance, navigate, presentationId, setData],
  );

  // Someone who has not entered a display name has no record to progress, so
  // they are sent to the welcome screen to create one.
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
        loadingLabel="Loading the slide"
        errorTitle="This slide could not be loaded"
      >
        {({ presentation, slides, attendee, responses }) => {
          if (presentation.status !== PRESENTATION_STATUS.published) {
            return (
              <EmptyState
                icon="alert"
                title="This presentation has been unpublished"
                message="The presenter has taken it offline. Your progress has been saved."
              />
            );
          }

          if (slides.length === 0) {
            return (
              <EmptyState
                icon="slides"
                title="There are no slides to show"
                message="Every slide in this deck has been removed."
              />
            );
          }

          if (attendee.status === ATTENDEE_STATUS.finished) {
            return <Navigate to={`/present/${presentationId}/done`} replace />;
          }

          const expected = clampPosition(attendee.current_position, slides.length);
          const requested = Number(position);

          // The record is the single source of truth for which step is open.
          if (requested !== expected) {
            return <Navigate to={`/present/${presentationId}/slide/${expected}`} replace />;
          }

          const slide = slides[expected - 1];
          const isPoll = slide.type === SLIDE_TYPE.poll;
          const existingAnswer = findResponse(slide.id, attendee.id, responses)?.option ?? null;
          const isLast = expected >= slides.length;
          const canAdvance = !isPoll || existingAnswer !== null;

          return (
            <div className="viewer">
              <header className="viewer__header">
                <p className="viewer__deck">{presentation.title}</p>
                <p className="viewer__name">Viewing as {attendee.display_name}</p>
              </header>

              <StepProgress current={expected} total={slides.length} />

              <SlideStage slide={slide} />

              {isPoll ? (
                <div className="viewer__poll">
                  {/* Keyed by slide so consecutive polls never share a selection. */}
                  <PollVoteForm
                    key={slide.id}
                    slide={slide}
                    existingAnswer={existingAnswer}
                    isSubmitting={vote.isPending}
                    error={vote.error}
                    onSubmit={(option) => handleVote(slide, option)}
                  />
                  {existingAnswer ? <LivePollResults slide={slide} /> : null}
                </div>
              ) : null}

              {advanceError ? (
                <ErrorState error={advanceError} title="Your progress could not be saved" />
              ) : null}

              <div className="viewer__controls">
                <Button
                  onClick={() => handleAdvance(expected, slides.length)}
                  variant="primary"
                  size="lg"
                  iconAfter={isLast ? 'check' : 'arrowRight'}
                  disabled={!canAdvance}
                  isPending={advance.isPending}
                  pendingLabel="Saving your progress"
                  fullWidth
                >
                  {isLast ? 'Finish presentation' : 'Next slide'}
                </Button>

                {isPoll && !canAdvance ? (
                  <p className="viewer__hint">Answer the poll above to continue.</p>
                ) : (
                  <p className="viewer__hint">
                    {isLast
                      ? 'This is the last slide.'
                      : 'Once you move on you cannot come back to this slide.'}
                  </p>
                )}
              </div>

              {expected === 1 ? (
                <Callout tone="info">
                  Your progress is saved as you go, so you can close this tab and open the link again
                  to pick up from the same slide.
                </Callout>
              ) : null}
            </div>
          );
        }}
      </DataState>
    </div>
  );
};
