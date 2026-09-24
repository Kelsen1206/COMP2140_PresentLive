import { ATTENDEE_STATUS, PRESENTATION_STATUS, SLIDE_TYPE } from '../../config.js';

/**
 * A small coloured label.
 *
 * @param {{children: React.ReactNode, tone?: 'neutral'|'success'|'info'|'warning'|'accent'}} props
 */
export const Badge = ({ children, tone = 'neutral' }) => (
  <span className={`badge badge--${tone}`}>{children}</span>
);

/** Which tone each stored status value is shown in. */
const TONES = {
  [PRESENTATION_STATUS.published]: 'success',
  [PRESENTATION_STATUS.draft]: 'warning',
  [ATTENDEE_STATUS.finished]: 'success',
  [ATTENDEE_STATUS.viewing]: 'info',
  [SLIDE_TYPE.poll]: 'accent',
  [SLIDE_TYPE.content]: 'neutral',
};

/**
 * Show one of the status or type values stored on a record, coloured
 * consistently wherever it appears.
 *
 * @param {{value: string}} props
 */
export const StatusBadge = ({ value }) => <Badge tone={TONES[value] ?? 'neutral'}>{value}</Badge>;
