import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { tallyPollSlide } from '../../lib/statistics.js';
import { formatPercent, pluralise } from '../../lib/format.js';

/**
 * Colours used for the bars, in order. Chosen to stay distinguishable when
 * printed in greyscale and to keep white label text readable on every one.
 */
const BAR_COLOURS = ['#4338ca', '#0f766e', '#b45309', '#9333ea', '#be123c', '#0369a1'];

/**
 * The panel shown when the pointer rests on a bar.
 *
 * @param {{active?: boolean, payload?: {payload: {option: string, votes: number, share: number}}[]}} props
 */
const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__option">{row.option}</p>
      <p className="chart-tooltip__value">
        {pluralise(row.votes, 'answer')} &middot; {formatPercent(row.share)}
      </p>
    </div>
  );
};

/**
 * A horizontal bar chart of how one poll slide was answered.
 *
 * Horizontal bars are used because the answer options are words rather than
 * dates or numbers, so they read straight across without rotated labels, and
 * the chart grows downward as options are added rather than getting cramped.
 *
 * @param {{slide: object, responses: object[]}} props
 */
export const PollResultsChart = ({ slide, responses }) => {
  const rows = tallyPollSlide(slide, responses);
  const total = rows.reduce((sum, row) => sum + row.votes, 0);

  if (total === 0) {
    return (
      <p className="chart-empty">
        No one has answered this poll yet. Answers appear here as soon as your audience reaches this
        slide.
      </p>
    );
  }

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height={Math.max(rows.length * 52, 140)}>
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 4 }}>
          <XAxis type="number" allowDecimals={false} hide />
          <YAxis
            type="category"
            dataKey="option"
            width={140}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#334155', fontSize: 13 }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(15, 23, 42, 0.05)' }} />
          <Bar dataKey="votes" radius={[0, 6, 6, 0]} barSize={26} isAnimationActive={false}>
            {rows.map((row, index) => (
              <Cell key={row.option} fill={BAR_COLOURS[index % BAR_COLOURS.length]} />
            ))}
            <LabelList
              dataKey="votes"
              position="right"
              formatter={(value) => `${value}`}
              style={{ fill: '#334155', fontSize: 13, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <p className="chart__caption">{pluralise(total, 'answer')} recorded</p>
    </div>
  );
};
