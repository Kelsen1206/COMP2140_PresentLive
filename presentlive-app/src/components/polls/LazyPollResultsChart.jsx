import { Suspense, lazy } from 'react';
import { Spinner } from '../ui/Spinner.jsx';

/**
 * The charting library is by far the largest dependency in the project. Loading
 * it on demand keeps it out of the first download: an audience member on a phone
 * only fetches it once they have answered a poll and a chart is actually shown.
 */
const PollResultsChart = lazy(() =>
  import('./PollResultsChart.jsx').then((module) => ({ default: module.PollResultsChart })),
);

/**
 * A poll results chart that fetches its charting code the first time one is
 * shown, with a placeholder of the same height so the layout does not jump.
 *
 * @param {{slide: object, responses: object[]}} props
 */
export const LazyPollResultsChart = (props) => (
  <Suspense
    fallback={
      <div className="chart-loading">
        <Spinner size={20} label="Loading chart" />
        <span>Loading chart...</span>
      </div>
    }
  >
    <PollResultsChart {...props} />
  </Suspense>
);
