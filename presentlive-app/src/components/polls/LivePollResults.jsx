import { ENTITIES } from '../../config.js';
import { pollResponses as pollResponsesApi } from '../../lib/api/index.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { useLiveUpdates } from '../../hooks/useLiveUpdates.js';
import { Card } from '../ui/Card.jsx';
import { LivePill } from '../ui/LivePill.jsx';
import { DataState } from '../ui/States.jsx';
import { LazyPollResultsChart } from './LazyPollResultsChart.jsx';

/**
 * How the whole room has answered one poll, shown to an audience member once
 * they have given their own answer.
 *
 * It loads every response to this slide -- not just the viewer's -- and listens
 * for new ones, so the bars keep moving as the rest of the audience votes. It is
 * only ever rendered after the viewer has answered, so seeing the results cannot
 * sway their own choice.
 *
 * @param {{slide: object}} props
 */
export const LivePollResults = ({ slide }) => {
  const { data, status, error, reload } = useAsyncData(
    ({ signal }) => pollResponsesApi.list({ slide_id: slide.id }, { signal }),
    [slide.id],
  );

  const { isConnected } = useLiveUpdates([ENTITIES.pollResponses], reload, {
    enabled: status === 'ready',
  });

  return (
    <Card
      title="How the room answered"
      description="Everyone's answers so far, including yours."
      actions={<LivePill isConnected={isConnected} />}
    >
      <DataState
        status={status}
        data={data}
        error={error}
        onRetry={reload}
        loadingLabel="Loading the results"
        errorTitle="The results could not be loaded"
      >
        {(responses) => <LazyPollResultsChart slide={slide} responses={responses} />}
      </DataState>
    </Card>
  );
};
