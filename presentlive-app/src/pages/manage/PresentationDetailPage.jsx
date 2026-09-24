import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PRESENTATION_STATUS, SLIDE_TYPE } from '../../config.js';
import {
  deleteSlideCascade,
  fetchPresentationWorkspace,
  persistSlideOrder,
} from '../../lib/api/index.js';
import { summarisePresentation } from '../../lib/statistics.js';
import { formatPercent, pluralise } from '../../lib/format.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { useMutation } from '../../hooks/useMutation.js';
import { useLiveUpdates } from '../../hooks/useLiveUpdates.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useToast } from '../../context/toastContext.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { StatusBadge } from '../../components/ui/Badge.jsx';
import { StatGrid, StatTile } from '../../components/ui/StatTile.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { DataState, EmptyState } from '../../components/ui/States.jsx';
import { Icon } from '../../components/ui/Icon.jsx';
import { LivePill } from '../../components/ui/LivePill.jsx';
import { ShareLinks } from '../../components/presentations/ShareLinks.jsx';
import { SlideList } from '../../components/slides/SlideList.jsx';
import { LazyPollResultsChart } from '../../components/polls/LazyPollResultsChart.jsx';
import { DeckGeneratorPanel } from '../../components/ai/DeckGeneratorPanel.jsx';
import { PollSummaryPanel } from '../../components/ai/PollSummaryPanel.jsx';

/**
 * Swap one slide with its neighbour.
 *
 * @param {object[]} slides Slides in display order.
 * @param {object} slide The slide being moved.
 * @param {-1|1} direction Up the list, or down it.
 * @returns {object[]} The reordered list, or the original if the move is a no-op.
 */
const moveWithin = (slides, slide, direction) => {
  const index = slides.findIndex((candidate) => candidate.id === slide.id);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= slides.length) return slides;

  const reordered = [...slides];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  return reordered;
};

/**
 * The deck workspace: everything the presenter does with one presentation.
 *
 * It holds the slide list, the two share links, the AI tools, and the results
 * the audience sent back. Poll answers and arrivals stream in over Server-Sent
 * Events, so the figures update while a session is running without the
 * presenter touching anything.
 */
export const PresentationDetailPage = () => {
  const { presentationId } = useParams();
  const { notifySuccess, notifyError } = useToast();
  const [pendingSlideDelete, setPendingSlideDelete] = useState(null);

  const { data, status, error, reload, setData } = useAsyncData(
    ({ signal }) => fetchPresentationWorkspace(presentationId, { signal }),
    [presentationId],
  );

  useDocumentTitle(data?.presentation?.title);

  // Refresh when the API reports that someone joined or answered a poll.
  const { isConnected } = useLiveUpdates(['attendees', 'poll_responses'], reload, {
    enabled: status === 'ready',
  });

  const reorder = useMutation(persistSlideOrder);
  const slideDeletion = useMutation(deleteSlideCascade);

  /**
   * Move a slide and write the new order back to the API.
   *
   * The list is reordered on screen first so the click feels instant, then the
   * changed positions are saved; if the save fails the screen is reloaded from
   * the API so it never disagrees with what is stored.
   */
  const handleMove = useCallback(
    async (slide, direction) => {
      const reordered = moveWithin(data.slides, slide, direction);
      if (reordered === data.slides) return;

      const renumbered = reordered.map((item, index) => ({ ...item, position: index + 1 }));
      setData((current) => ({ ...current, slides: renumbered }));

      const result = await reorder.run(reordered);
      if (!result.ok) {
        notifyError('The new slide order could not be saved.');
        reload();
      }
    },
    [data, setData, reorder, notifyError, reload],
  );

  /** Delete a slide together with any answers recorded against it. */
  const confirmSlideDelete = useCallback(async () => {
    const target = pendingSlideDelete;
    if (!target) return;

    const result = await slideDeletion.run(target.id);
    setPendingSlideDelete(null);

    if (result.ok) {
      notifySuccess(`Slide "${target.title}" was deleted.`);
      reload();
    } else {
      notifyError(result.error?.message ?? 'That slide could not be deleted.');
    }
  }, [pendingSlideDelete, slideDeletion, notifySuccess, notifyError, reload]);

  /** Keep the stored AI summary on screen after it is written. */
  const handleSummarySaved = useCallback(
    (summary) => {
      setData((current) => ({
        ...current,
        presentation: { ...current.presentation, ai_summary: summary },
      }));
    },
    [setData],
  );

  return (
    <div className="page">
      <DataState
        status={status}
        data={data}
        error={error}
        onRetry={reload}
        loadingLabel="Loading the deck"
        errorTitle="This presentation could not be loaded"
      >
        {({ presentation, slides, attendees, responses }) => {
          const stats = summarisePresentation({ slides, attendees, responses });
          const pollSlides = slides.filter((slide) => slide.type === SLIDE_TYPE.poll);
          const isPublished = presentation.status === PRESENTATION_STATUS.published;

          return (
            <>
              <PageHeader
                backTo="/presentations"
                backLabel="All presentations"
                eyebrow={
                  <span className="page-header__eyebrow-row">
                    <StatusBadge value={presentation.status} />
                    <span>{presentation.presenter_name}</span>
                  </span>
                }
                title={presentation.title}
                description={presentation.description}
                actions={
                  <>
                    <Button
                      to={`/presentations/${presentationId}/slides/new`}
                      variant="primary"
                      icon="plus"
                    >
                      Add slide
                    </Button>
                    <Button
                      to={`/presentations/${presentationId}/edit`}
                      variant="secondary"
                      icon="edit"
                    >
                      Edit details
                    </Button>
                    <Button to={`/present/${presentationId}`} variant="ghost" icon="play">
                      Preview
                    </Button>
                  </>
                }
              />

              <StatGrid>
                <StatTile label="Slides" value={stats.slideCount} icon="slides" hint={`${stats.pollCount} poll`} />
                <StatTile
                  label="Audience"
                  value={stats.attendeeCount}
                  icon="users"
                  hint={`${stats.viewingCount} still viewing`}
                  to={`/presentations/${presentationId}/audience`}
                />
                <StatTile
                  label="Finished"
                  value={stats.finishedCount}
                  icon="check"
                  hint={formatPercent(stats.completionRate)}
                  to={`/presentations/${presentationId}/audience`}
                />
                <StatTile
                  label="Poll answers"
                  value={stats.responseCount}
                  icon="chart"
                  hint={isConnected ? 'Updating live' : 'Refresh to update'}
                  to={`/presentations/${presentationId}/audience`}
                />
              </StatGrid>

              <div className="workspace">
                <div className="workspace__main">
                  <Card
                    title="Slides"
                    description="The order here is the order your audience sees."
                    actions={
                      <Button
                        to={`/presentations/${presentationId}/slides/new`}
                        size="sm"
                        icon="plus"
                      >
                        Add slide
                      </Button>
                    }
                  >
                    {slides.length === 0 ? (
                      <EmptyState
                        icon="slides"
                        title="This deck has no slides yet"
                        message="Write one yourself, or let the deck generator draft a few for you to edit."
                        action={
                          <Button
                            to={`/presentations/${presentationId}/slides/new`}
                            variant="primary"
                            icon="plus"
                          >
                            Add the first slide
                          </Button>
                        }
                      />
                    ) : (
                      <SlideList
                        slides={slides}
                        presentationId={presentationId}
                        responses={responses}
                        isBusy={reorder.isPending}
                        onMove={handleMove}
                        onDelete={setPendingSlideDelete}
                      />
                    )}
                  </Card>

                  <Card
                    title="Poll results"
                    description="What the room chose, updating as answers arrive."
                    actions={<LivePill isConnected={isConnected} />}
                  >
                    {pollSlides.length === 0 ? (
                      <EmptyState
                        icon="chart"
                        title="No poll slides in this deck"
                        message="Add a slide and set its type to Poll to ask your audience a question."
                        action={
                          <Button
                            to={`/presentations/${presentationId}/slides/new`}
                            variant="secondary"
                            icon="plus"
                          >
                            Add a poll slide
                          </Button>
                        }
                      />
                    ) : (
                      <div className="poll-results">
                        {pollSlides.map((slide) => (
                          <section className="poll-results__item" key={slide.id}>
                            <h3 className="poll-results__question">
                              <span className="poll-results__position">Slide {slide.position}</span>
                              {slide.question}
                            </h3>
                            <LazyPollResultsChart slide={slide} responses={responses} />
                          </section>
                        ))}
                      </div>
                    )}
                  </Card>

                  <PollSummaryPanel
                    presentation={presentation}
                    slides={slides}
                    responses={responses}
                    attendees={attendees}
                    onSaved={handleSummarySaved}
                  />
                </div>

                <aside className="workspace__side">
                  <Card title="Share this deck" description="Two links, no sign-in required.">
                    <ShareLinks presentation={presentation} />
                  </Card>

                  <DeckGeneratorPanel
                    presentationId={presentationId}
                    presentation={presentation}
                    existingSlides={slides}
                    onSlidesAdded={reload}
                  />

                  <Card
                    title="Audience"
                    description="Who joined, and how far they got."
                    actions={
                      <Button
                        to={`/presentations/${presentationId}/audience`}
                        size="sm"
                        variant="ghost"
                        iconAfter="arrowRight"
                      >
                        View all
                      </Button>
                    }
                  >
                    {attendees.length === 0 ? (
                      <p className="muted">
                        {isPublished
                          ? 'Nobody has joined yet. Share the presentation link to get started.'
                          : 'This deck is a draft, so nobody can join yet. Publish it from the edit screen.'}
                      </p>
                    ) : (
                      <ul className="attendee-preview">
                        {attendees.slice(0, 5).map((attendee) => (
                          <li key={attendee.id} className="attendee-preview__row">
                            <span className="attendee-preview__name">{attendee.display_name}</span>
                            <StatusBadge value={attendee.status} />
                          </li>
                        ))}
                        {attendees.length > 5 ? (
                          <li className="attendee-preview__more">
                            <Icon name="users" size={14} />
                            {pluralise(attendees.length - 5, 'other person', 'other people')} joined
                          </li>
                        ) : null}
                      </ul>
                    )}
                  </Card>
                </aside>
              </div>

              <ConfirmDialog
                open={pendingSlideDelete !== null}
                title="Delete this slide?"
                message={
                  <>
                    <p>
                      <strong>{pendingSlideDelete?.title}</strong> will be removed from the deck.
                    </p>
                    {pendingSlideDelete?.type === SLIDE_TYPE.poll ? (
                      <p>Any answers your audience gave to this poll will be deleted with it.</p>
                    ) : null}
                  </>
                }
                confirmLabel="Delete slide"
                isPending={slideDeletion.isPending}
                onConfirm={confirmSlideDelete}
                onCancel={() => setPendingSlideDelete(null)}
              />
            </>
          );
        }}
      </DataState>
    </div>
  );
};
