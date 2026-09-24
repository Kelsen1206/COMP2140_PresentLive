import { formatDateTime } from '../../lib/format.js';
import { Badge } from '../ui/Badge.jsx';

/**
 * The list view for the PollResponse entity: one row per answer given.
 *
 * The other screens show poll answers aggregated -- as bar charts, or as a
 * column in the audience table. This shows the records themselves, newest
 * first, which is what the presenter needs when they want to know who said what
 * and when rather than how the totals came out.
 *
 * Rows are read-only by design: an answer is final once given, which is the
 * rule the audience is told about before they vote. Responses are removed by
 * deleting the audience member or the slide they belong to.
 *
 * @param {{responses: object[], slides: object[], attendees: object[]}} props
 */
export const ResponseTable = ({ responses, slides, attendees }) => {
  /**
   * Look up the records a response points at, so each row can show names
   * instead of the identifiers stored on the record.
   *
   * @param {object} response
   * @returns {{slide: object|undefined, attendee: object|undefined}}
   */
  const relatedTo = (response) => ({
    slide: slides.find((candidate) => candidate.id === response.slide_id),
    attendee: attendees.find((candidate) => candidate.id === response.attendee_id),
  });

  // Newest first: during a live session the most recent answers are the ones
  // the presenter is actually waiting on.
  const ordered = [...responses].sort(
    (a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0),
  );

  return (
    <div className="table-scroll">
      <table className="data-table">
        <caption className="visually-hidden">
          Every poll answer recorded for this presentation, most recent first
        </caption>
        <thead>
          <tr>
            <th scope="col">Answered</th>
            <th scope="col">Audience member</th>
            <th scope="col">Slide</th>
            <th scope="col">Question</th>
            <th scope="col">Their answer</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((response) => {
            const { slide, attendee } = relatedTo(response);

            return (
              <tr key={response.id}>
                <td className="data-table__muted">{formatDateTime(response.created_at)}</td>
                <th scope="row">
                  {attendee?.display_name ?? (
                    <span className="data-table__blank">Removed audience member</span>
                  )}
                </th>
                <td>
                  {slide ? (
                    <Badge tone="neutral">Slide {slide.position}</Badge>
                  ) : (
                    <span className="data-table__blank">Deleted slide</span>
                  )}
                </td>
                <td>{slide?.question ?? <span className="data-table__blank">&mdash;</span>}</td>
                <td>
                  <strong>{response.option}</strong>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
