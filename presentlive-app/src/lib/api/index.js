import { ENTITIES } from '../../config.js';
import { createResource } from './client.js';

export { ApiError, request } from './client.js';

/** CRUD access to the Presentation entity. */
export const presentations = createResource(ENTITIES.presentations);

/** CRUD access to the Slide entity. */
export const slides = createResource(ENTITIES.slides);

/** CRUD access to the Attendee entity. */
export const attendees = createResource(ENTITIES.attendees);

/** CRUD access to the PollResponse entity. */
export const pollResponses = createResource(ENTITIES.pollResponses);

/**
 * Load every record the presenter dashboard needs for one presentation.
 *
 * The four requests are independent, so they run in parallel rather than in
 * sequence -- one round trip instead of four.
 *
 * @param {string} presentationId
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<{presentation: object, slides: object[], attendees: object[], responses: object[]}>}
 */
export const fetchPresentationWorkspace = async (presentationId, { signal } = {}) => {
  const [presentation, slideList, attendeeList, responseList] = await Promise.all([
    presentations.get(presentationId, { signal }),
    slides.list({ presentation_id: presentationId, sort: 'position' }, { signal }),
    attendees.list({ presentation_id: presentationId, sort: '-created_at' }, { signal }),
    pollResponses.list({ presentation_id: presentationId }, { signal }),
  ]);

  return {
    presentation,
    slides: slideList,
    attendees: attendeeList,
    responses: responseList,
  };
};

/**
 * Load everything an audience member needs to step through a presentation.
 *
 * @param {string} presentationId
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<{presentation: object, slides: object[]}>}
 */
export const fetchPresentationForAudience = async (presentationId, { signal } = {}) => {
  const [presentation, slideList] = await Promise.all([
    presentations.get(presentationId, { signal }),
    slides.list({ presentation_id: presentationId, sort: 'position' }, { signal }),
  ]);
  return { presentation, slides: slideList };
};

/**
 * Delete a presentation together with every record that belongs to it.
 *
 * The API has no cascading delete, so the children are removed first. Without
 * this the poll responses and attendees of a deleted deck would be orphaned and
 * would keep appearing in derived counts.
 *
 * @param {string} presentationId
 * @returns {Promise<void>}
 */
export const deletePresentationCascade = async (presentationId) => {
  const [slideList, attendeeList, responseList] = await Promise.all([
    slides.list({ presentation_id: presentationId }),
    attendees.list({ presentation_id: presentationId }),
    pollResponses.list({ presentation_id: presentationId }),
  ]);

  await Promise.all([
    ...responseList.map((record) => pollResponses.remove(record.id)),
    ...attendeeList.map((record) => attendees.remove(record.id)),
  ]);
  await Promise.all(slideList.map((record) => slides.remove(record.id)));
  await presentations.remove(presentationId);
};

/**
 * Delete a slide and any poll responses recorded against it.
 *
 * @param {string} slideId
 * @returns {Promise<void>}
 */
export const deleteSlideCascade = async (slideId) => {
  const responseList = await pollResponses.list({ slide_id: slideId });
  await Promise.all(responseList.map((record) => pollResponses.remove(record.id)));
  await slides.remove(slideId);
};

/**
 * Write a new ordering to the API, one PATCH per slide whose position changed.
 *
 * @param {object[]} orderedSlides Slides in their intended display order.
 * @returns {Promise<object[]>} The slides with their positions normalised to 1..n.
 */
export const persistSlideOrder = async (orderedSlides) => {
  const renumbered = orderedSlides.map((slide, index) => ({ ...slide, position: index + 1 }));
  const changed = renumbered.filter(
    (slide, index) => slide.position !== orderedSlides[index].position,
  );
  await Promise.all(changed.map((slide) => slides.update(slide.id, { position: slide.position })));
  return renumbered;
};
