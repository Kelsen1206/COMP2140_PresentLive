import { SLIDE_TYPE } from '../config.js';

/**
 * Turn Slide form values into the record shape the API stores.
 *
 * Poll fields are cleared on a content slide, so changing a slide from Poll to
 * Content never leaves a stale question or set of options behind on the record.
 * Shared by the Add Slide and Edit Slide screens so both write identical data.
 *
 * @param {object} values Values from the slide form.
 * @param {string} presentationId The deck the slide belongs to.
 * @returns {object} A record ready to POST or PATCH.
 */
export const toSlideRecord = (values, presentationId) => {
  const isPoll = values.type === SLIDE_TYPE.poll;

  return {
    presentation_id: presentationId,
    title: values.title.trim(),
    body: values.body,
    type: values.type,
    position: Number(values.position),
    question: isPoll ? values.question.trim() : '',
    options: isPoll ? values.options.map((option) => option.trim()).filter(Boolean) : [],
  };
};
