import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ATTENDEE_STATUS } from '../../config.js';
import {
  attendees as attendeesApi,
  fetchPresentationWorkspace,
  pollResponses as pollResponsesApi,
} from '../../lib/api/index.js';
import { summarisePresentation } from '../../lib/statistics.js';
import { formatPercent } from '../../lib/format.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { useMutation } from '../../hooks/useMutation.js';
import { useLiveUpdates } from '../../hooks/useLiveUpdates.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useToast } from '../../context/toastContext.js';
import { PageHeader } from '../../components/ui/PageHeader.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { StatGrid, StatTile } from '../../components/ui/StatTile.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { DataState, EmptyState } from '../../components/ui/States.jsx';
import { AttendeeTable } from '../../components/attendee/AttendeeTable.jsx';
import { ResponseTable } from '../../components/polls/ResponseTable.jsx';

/**
 * Remove one audience member and every answer they gave.
 *
 * @param {string} attendeeId
 * @returns {Promise<void>}
 */
const removeAttendee = async (attendeeId) => {
  const responses = await pollResponsesApi.list({ attendee_id: attendeeId });
  await Promise.all(responses.map((response) => pollResponsesApi.remove(response.id)));
  await attendeesApi.remove(attendeeId);
};

/**
 * The list view for the Attendee entity: who joined this presentation, how far
 * they got, and what each of them answered.
 *
 * Nothing on this screen was typed by the presenter -- every row came from an
 * audience member on their own device and is being read back here, which is the
 * round trip the deck is built around.
 */
export const AudiencePage = () => {
  const { presentationId } = useParams();
  const { notifySuccess, notifyError } = useToast();
  const [pendingDelete, setPendingDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const { data, status, error, reload } = useAsyncData(
    ({ signal }) => fetchPresentationWorkspace(presentationId, { signal }),
    [presentationId],
  );

  useDocumentTitle(data ? `Audience of ${data.presentation.title}` : 'Audience');

  const { isConnected } = useLiveUpdates(['attendees', 'poll_responses'], reload, {
    enabled: status === 'ready',
  });

  const deletion = useMutation(removeAttendee);

  /** Delete the selected audience member after confirmation. */
  const confirmDelete = useCallback(async () => {
    const target = pendingDelete;
    if (!target) return;

    const result = await deletion.run(target.id);
    setPendingDelete(null);

    if (result.ok) {
      notifySuccess(`${target.display_name} and their answers were removed.`);
      reload();
    } else {
      notifyError(result.error?.message ?? 'That audience member could not be removed.');
    }
  }, [pendingDelete, deletion, notifySuccess, notifyError, reload]);

  return (
    <div className="page">
      <DataState
        status={status}
        data={data}
        error={error}
        onRetry={reload}
        loadingLabel="Loading the audience"
        errorTitle="The audience could not be loaded"
      >
        {({ presentation, slides, attendees, responses }) => {
          const stats = summarisePresentation({ slides, attendees, responses });
          const visible =
            statusFilter === 'all'
              ? attendees
              : attendees.filter((attendee) => attendee.status === statusFilter);

          return (
            <>
              <PageHeader
                backTo={`/presentations/${presentationId}`}
                backLabel="Back to deck"
                eyebrow="Audience"
                title={`Who joined "${presentation.title}"`}
                description="Each row is one person who opened your presentation link, with the answers they gave."
                actions={
                  <Button onClick={reload} icon="refresh" variant="secondary">
                    Refresh
                  </Button>
                }
              />

              <StatGrid>
                <StatTile label="Joined" value={stats.attendeeCount} icon="users" />
                <StatTile
                  label="Still viewing"
                  value={stats.viewingCount}
                  icon="eye"
                  hint={isConnected ? 'Updating live' : undefined}
                />
                <StatTile
                  label="Finished"
                  value={stats.finishedCount}
                  icon="check"
                  hint={formatPercent(stats.completionRate)}
                />
                <StatTile label="Answers given" value={stats.responseCount} icon="chart" />
              </StatGrid>

              <Card
                title="Audience members"
                description="Sorted with the most recent arrival first."
                actions={
                  <div className="filter-bar filter-bar--compact" role="group" aria-label="Filter by status">
                    {['all', ATTENDEE_STATUS.viewing, ATTENDEE_STATUS.finished].map((value) => (
                      <button
                        key={value}
                        type="button"
                        className={`filter-bar__button ${statusFilter === value ? 'is-active' : ''}`.trim()}
                        onClick={() => setStatusFilter(value)}
                        aria-pressed={statusFilter === value}
                      >
                        {value === 'all' ? 'All' : value}
                      </button>
                    ))}
                  </div>
                }
              >
                {attendees.length === 0 ? (
                  <EmptyState
                    icon="users"
                    title="Nobody has joined yet"
                    message="Share the presentation link from the deck screen. People appear here the moment they enter a display name."
                    action={
                      <Button to={`/presentations/${presentationId}`} variant="primary" icon="link">
                        Get the presentation link
                      </Button>
                    }
                  />
                ) : visible.length === 0 ? (
                  <EmptyState
                    icon="search"
                    title={`No one is ${String(statusFilter).toLowerCase()}`}
                    message="Change the filter to see the rest of your audience."
                    action={
                      <Button onClick={() => setStatusFilter('all')} variant="secondary">
                        Show everyone
                      </Button>
                    }
                  />
                ) : (
                  <>
                    <AttendeeTable attendees={visible} slides={slides} responses={responses} />
                    <ul className="attendee-actions">
                      {visible.map((attendee) => (
                        <li key={attendee.id}>
                          <Button
                            onClick={() => setPendingDelete(attendee)}
                            icon="trash"
                            size="sm"
                            variant="ghost"
                          >
                            Remove {attendee.display_name}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Card>

              <Card
                title="Poll answers"
                description="Every individual answer recorded for this deck, most recent first."
              >
                {responses.length === 0 ? (
                  <EmptyState
                    icon="chart"
                    title="No answers recorded yet"
                    message="Each time someone in your audience answers a poll, the answer appears here as its own row."
                  />
                ) : (
                  <ResponseTable
                    responses={responses}
                    slides={slides}
                    attendees={attendees}
                  />
                )}
              </Card>

              <ConfirmDialog
                open={pendingDelete !== null}
                title="Remove this audience member?"
                message={
                  <p>
                    <strong>{pendingDelete?.display_name}</strong> and every answer they gave will be
                    deleted. Your poll charts will change to match.
                  </p>
                }
                confirmLabel="Remove"
                isPending={deletion.isPending}
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
              />
            </>
          );
        }}
      </DataState>
    </div>
  );
};
