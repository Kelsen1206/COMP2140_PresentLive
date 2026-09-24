import { useCallback, useMemo, useState } from 'react';
import { PRESENTATION_STATUS } from '../../config.js';
import {
  attendees as attendeesApi,
  deletePresentationCascade,
  pollResponses as pollResponsesApi,
  presentations as presentationsApi,
  slides as slidesApi,
} from '../../lib/api/index.js';
import { summarisePresentation } from '../../lib/statistics.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { useMutation } from '../../hooks/useMutation.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useToast } from '../../context/toastContext.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { DataState, EmptyState } from '../../components/ui/States.jsx';
import {
  PresentationCard,
  PresentationGrid,
} from '../../components/presentations/PresentationCard.jsx';

/** The status filters offered above the list. */
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: PRESENTATION_STATUS.published, label: 'Published' },
  { value: PRESENTATION_STATUS.draft, label: 'Drafts' },
];

/**
 * Load every presentation together with the related records the counts on each
 * card are derived from.
 *
 * @param {{signal: AbortSignal}} options
 * @returns {Promise<{presentations: object[], slides: object[], attendees: object[], responses: object[]}>}
 */
const loadEverything = async ({ signal }) => {
  const [presentationList, slideList, attendeeList, responseList] = await Promise.all([
    presentationsApi.list({ sort: '-updated_at' }, { signal }),
    slidesApi.list({}, { signal }),
    attendeesApi.list({}, { signal }),
    pollResponsesApi.list({}, { signal }),
  ]);

  return {
    presentations: presentationList,
    slides: slideList,
    attendees: attendeeList,
    responses: responseList,
  };
};

/**
 * The presenter's home base: every deck they have made, with the state of each
 * one at a glance and the entry point for creating a new one.
 */
export const PresentationListPage = () => {
  useDocumentTitle('Presentations');

  const { data, status, error, reload } = useAsyncData(loadEverything, []);
  const [filter, setFilter] = useState('all');
  const [pendingDelete, setPendingDelete] = useState(null);
  const { notifySuccess, notifyError } = useToast();

  const deletion = useMutation(deletePresentationCascade);

  /** Attach the derived counts to each presentation once, not per render pass. */
  const rows = useMemo(() => {
    if (!data) return [];

    return data.presentations.map((presentation) => ({
      presentation,
      stats: summarisePresentation({
        slides: data.slides.filter((slide) => slide.presentation_id === presentation.id),
        attendees: data.attendees.filter(
          (attendee) => attendee.presentation_id === presentation.id,
        ),
        responses: data.responses.filter(
          (response) => response.presentation_id === presentation.id,
        ),
      }),
    }));
  }, [data]);

  const visibleRows = useMemo(
    () => (filter === 'all' ? rows : rows.filter((row) => row.presentation.status === filter)),
    [rows, filter],
  );

  /** Remove the deck and everything attached to it, then refresh the list. */
  const confirmDelete = useCallback(async () => {
    const target = pendingDelete;
    if (!target) return;

    const result = await deletion.run(target.id);
    setPendingDelete(null);

    if (result.ok) {
      notifySuccess(`"${target.title}" and all of its slides were deleted.`);
      reload();
    } else {
      notifyError(result.error?.message ?? 'That presentation could not be deleted.');
    }
  }, [pendingDelete, deletion, notifySuccess, notifyError, reload]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Presenter workspace"
        title="Your presentations"
        description="Write a deck, share the link, and see what your audience made of it."
        actions={
          <Button to="/presentations/new" variant="primary" icon="plus">
            New presentation
          </Button>
        }
      />

      <DataState
        status={status}
        data={rows}
        error={error}
        onRetry={reload}
        loadingLabel="Loading your presentations"
        errorTitle="Your presentations could not be loaded"
        empty={
          <EmptyState
            icon="slides"
            title="No presentations yet"
            message="Create your first deck, add a few slides, then share the link with your audience."
            action={
              <Button to="/presentations/new" variant="primary" icon="plus">
                Create a presentation
              </Button>
            }
          />
        }
      >
        {() => (
          <>
            <div className="filter-bar" role="group" aria-label="Filter by status">
              {FILTERS.map((option) => {
                const count =
                  option.value === 'all'
                    ? rows.length
                    : rows.filter((row) => row.presentation.status === option.value).length;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`filter-bar__button ${filter === option.value ? 'is-active' : ''}`.trim()}
                    onClick={() => setFilter(option.value)}
                    aria-pressed={filter === option.value}
                  >
                    {option.label}
                    <span className="filter-bar__count">{count}</span>
                  </button>
                );
              })}
            </div>

            {visibleRows.length === 0 ? (
              <EmptyState
                icon="search"
                title={`No ${filter.toLowerCase()} presentations`}
                message="Change the filter above to see your other decks."
                action={
                  <Button onClick={() => setFilter('all')} variant="secondary">
                    Show all
                  </Button>
                }
              />
            ) : (
              <PresentationGrid>
                {visibleRows.map(({ presentation, stats }) => (
                  <PresentationCard
                    key={presentation.id}
                    presentation={presentation}
                    stats={stats}
                    onDelete={setPendingDelete}
                  />
                ))}
              </PresentationGrid>
            )}
          </>
        )}
      </DataState>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this presentation?"
        message={
          <>
            <p>
              <strong>{pendingDelete?.title}</strong> will be deleted, along with every slide, the
              record of who joined, and every answer they gave.
            </p>
            <p>This cannot be undone.</p>
          </>
        }
        confirmLabel="Delete presentation"
        isPending={deletion.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};
