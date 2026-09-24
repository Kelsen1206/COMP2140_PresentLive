import { ATTENDEE_STATUS, SLIDE_TYPE } from '../config.js';

/**
 * Derived information about a presentation.
 *
 * Nothing here is stored in the API: every figure is computed from the related
 * records the app already holds, which is what keeps the counts on the
 * dashboard truthful as soon as an audience member answers a poll.
 */

/**
 * Count the slides, audience members and answers that belong to one deck.
 *
 * @param {{slides?: object[], attendees?: object[], responses?: object[]}} input
 * @returns {{slideCount: number, pollCount: number, attendeeCount: number,
 *            viewingCount: number, finishedCount: number, responseCount: number,
 *            completionRate: number}}
 */
export const summarisePresentation = ({ slides = [], attendees = [], responses = [] }) => {
  const pollCount = slides.filter((slide) => slide.type === SLIDE_TYPE.poll).length;
  const finishedCount = attendees.filter(
    (attendee) => attendee.status === ATTENDEE_STATUS.finished,
  ).length;

  return {
    slideCount: slides.length,
    pollCount,
    attendeeCount: attendees.length,
    viewingCount: attendees.length - finishedCount,
    finishedCount,
    responseCount: responses.length,
    completionRate: attendees.length === 0 ? 0 : finishedCount / attendees.length,
  };
};

/**
 * Tally the answers to one poll slide, one row per offered option.
 *
 * Options with no votes are kept so the chart shows the full set of choices
 * rather than silently hiding the unpopular ones.
 *
 * @param {object} slide A slide whose type is Poll.
 * @param {object[]} responses Every poll response for the presentation.
 * @returns {{option: string, votes: number, share: number}[]}
 */
export const tallyPollSlide = (slide, responses = []) => {
  const options = Array.isArray(slide?.options) ? slide.options : [];
  const forSlide = responses.filter((response) => response.slide_id === slide?.id);

  return options.map((option) => {
    const votes = forSlide.filter((response) => response.option === option).length;
    return {
      option,
      votes,
      share: forSlide.length === 0 ? 0 : votes / forSlide.length,
    };
  });
};

/**
 * Total answers recorded against one slide.
 *
 * @param {object} slide
 * @param {object[]} responses
 * @returns {number}
 */
export const countResponsesForSlide = (slide, responses = []) =>
  responses.filter((response) => response.slide_id === slide?.id).length;

/**
 * Pair every poll slide with the option one attendee chose, if they answered.
 *
 * @param {object} attendee
 * @param {object[]} slides Slides of the presentation, in position order.
 * @param {object[]} responses Every poll response for the presentation.
 * @returns {{slide: object, option: string|null}[]}
 */
export const answersByAttendee = (attendee, slides = [], responses = []) =>
  slides
    .filter((slide) => slide.type === SLIDE_TYPE.poll)
    .map((slide) => {
      const match = responses.find(
        (response) => response.slide_id === slide.id && response.attendee_id === attendee?.id,
      );
      return { slide, option: match?.option ?? null };
    });

/**
 * Find the answer one attendee gave to one poll slide.
 *
 * @param {string} slideId
 * @param {string} attendeeId
 * @param {object[]} responses
 * @returns {object|undefined} The response record, if one exists.
 */
export const findResponse = (slideId, attendeeId, responses = []) =>
  responses.find(
    (response) => response.slide_id === slideId && response.attendee_id === attendeeId,
  );

/**
 * The next free position number for a new slide in a deck.
 *
 * @param {object[]} slides
 * @returns {number}
 */
export const nextSlidePosition = (slides = []) =>
  slides.reduce((highest, slide) => Math.max(highest, Number(slide.position) || 0), 0) + 1;
