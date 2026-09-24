import { ATTENDEE_STATUS, SLIDE_TYPE } from '../../config.js';
import { answersByAttendee } from '../../lib/statistics.js';
import { formatDateTime } from '../../lib/format.js';
import { StatusBadge } from '../ui/Badge.jsx';

/**
 * Everyone who joined the presentation, with how far they got and what they
 * answered.
 *
 * This is the far end of the round trip: names and answers entered by the
 * audience on their own devices, read back by the presenter who wrote the deck.
 *
 * @param {{attendees: object[], slides: object[], responses: object[]}} props
 */
export const AttendeeTable = ({ attendees, slides, responses }) => {
  const pollSlides = slides.filter((slide) => slide.type === SLIDE_TYPE.poll);

  return (
    <div className="table-scroll">
      <table className="data-table">
        <caption className="visually-hidden">
          Audience members, their progress through the deck, and their poll answers
        </caption>
        <thead>
          <tr>
            <th scope="col">Display name</th>
            <th scope="col">Status</th>
            <th scope="col">Progress</th>
            {pollSlides.map((slide) => (
              <th scope="col" key={slide.id}>
                {slide.question}
              </th>
            ))}
            <th scope="col">Joined</th>
          </tr>
        </thead>
        <tbody>
          {attendees.map((attendee) => {
            const answers = answersByAttendee(attendee, slides, responses);
            const reached = Number(attendee.current_position) || 0;

            return (
              <tr key={attendee.id}>
                <th scope="row">{attendee.display_name}</th>
                <td>
                  <StatusBadge value={attendee.status} />
                </td>
                <td>
                  {attendee.status === ATTENDEE_STATUS.finished
                    ? `All ${slides.length} slides`
                    : `Slide ${Math.min(Math.max(reached, 1), slides.length || 1)} of ${slides.length}`}
                </td>
                {answers.map(({ slide, option }) => (
                  <td key={slide.id}>
                    {option ?? <span className="data-table__blank">No answer</span>}
                  </td>
                ))}
                <td className="data-table__muted">{formatDateTime(attendee.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
