import {
  AI_API_KEY,
  AI_BASE_URL,
  AI_MODEL,
  ATTENDEE_STATUS,
  SLIDE_TYPE,
  isAiConfigured,
} from '../config.js';
import { toPlainText } from './presentMD.js';

/** Error thrown by every failed AI interaction, with a user-safe message. */
export class AiError extends Error {
  /**
   * @param {string} message
   * @param {{code?: string, cause?: unknown}} [meta]
   */
  constructor(message, { code = 'unknown', cause } = {}) {
    super(message);
    this.name = 'AiError';
    this.code = code;
    this.cause = cause;
  }
}

/** Longest a single generation is allowed to run before it is abandoned. */
const REQUEST_TIMEOUT_MS = 90_000;

/**
 * Map the documented failure codes of the course AI proxy onto sentences a
 * presenter can act on.
 */
const AI_ERROR_MESSAGES = {
  invalid_api_key: 'The AI key is not valid. Check VITE_AI_KEY in the .env file.',
  model_not_allowed: 'This model is not available on the course AI proxy.',
  rate_limit_requests: 'The daily AI request allowance has been used up. It resets at midnight UTC.',
  rate_limit_tokens: 'The daily AI token allowance has been used up. It resets at midnight UTC.',
  proxy_disabled: 'The course AI service has been switched off centrally.',
  course_account_out_of_credit: 'The course AI account is out of credit. Please report this to teaching staff.',
  course_account_key_rejected: 'The course AI account key was rejected. Please report this to teaching staff.',
  provider_rate_limited: 'The AI service is busy right now. Please wait a few seconds and try again.',
};

/**
 * Pull a recognisable error code out of whatever shape the proxy returned.
 *
 * @param {unknown} payload
 * @returns {string}
 */
const readErrorCode = (payload) => {
  const raw =
    payload?.error?.code ?? payload?.error?.type ?? payload?.code ?? payload?.error ?? 'unknown';
  return typeof raw === 'string' ? raw : 'unknown';
};

/**
 * Throw an AiError that describes a non-2xx response from the proxy.
 *
 * @param {Response} response
 * @returns {Promise<never>}
 */
const throwProxyError = async (response) => {
  const payload = await response.json().catch(() => null);
  const code = readErrorCode(payload);
  const fallback =
    response.status === 401
      ? AI_ERROR_MESSAGES.invalid_api_key
      : 'The AI service could not complete this request. Please try again.';
  throw new AiError(AI_ERROR_MESSAGES[code] ?? fallback, { code });
};

/**
 * Guard used by both public helpers before any network call is attempted.
 *
 * @throws {AiError} When no AI key has been configured.
 */
const assertConfigured = () => {
  if (!isAiConfigured()) {
    throw new AiError(
      'No AI key is configured. Add VITE_AI_KEY to the .env file and restart the dev server.',
      { code: 'invalid_api_key' },
    );
  }
};

/**
 * Combine a caller-supplied abort signal with an internal timeout.
 *
 * @param {AbortSignal|undefined} externalSignal
 * @returns {{signal: AbortSignal, cleanup: () => void, timedOut: () => boolean}}
 */
const withTimeout = (externalSignal) => {
  const controller = new AbortController();
  let didTimeout = false;

  const timer = setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const forwardAbort = () => controller.abort();
  externalSignal?.addEventListener('abort', forwardAbort);

  return {
    signal: controller.signal,
    timedOut: () => didTimeout,
    cleanup: () => {
      clearTimeout(timer);
      externalSignal?.removeEventListener('abort', forwardAbort);
    },
  };
};

/**
 * Send one chat completion request and return the assistant message.
 *
 * @param {{messages: object[], temperature?: number, maxTokens?: number, signal?: AbortSignal}} options
 * @returns {Promise<string>} The assistant reply as plain text.
 */
const chat = async ({ messages, temperature = 0.7, maxTokens = 1024, signal }) => {
  assertConfigured();
  const timeout = withTimeout(signal);

  try {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: timeout.signal,
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) await throwProxyError(response);

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.trim() === '') {
      throw new AiError('The AI service returned an empty response. Please try again.', {
        code: 'empty_response',
      });
    }
    return content;
  } catch (error) {
    if (error instanceof AiError) throw error;
    if (timeout.timedOut()) {
      throw new AiError('The AI service took too long to respond. Please try again.', {
        code: 'timeout',
      });
    }
    if (error?.name === 'AbortError') throw error;
    throw new AiError('Could not reach the AI service. Please check your connection.', {
      code: 'network',
      cause: error,
    });
  } finally {
    timeout.cleanup();
  }
};

/**
 * Send a chat completion request and deliver the reply token by token.
 *
 * Streaming is what makes a long summary feel responsive: text appears as the
 * model writes it instead of after a silent wait.
 *
 * @param {{messages: object[], temperature?: number, maxTokens?: number, signal?: AbortSignal, onToken: (chunk: string) => void}} options
 * @returns {Promise<string>} The complete reply once the stream closes.
 */
const streamChat = async ({ messages, temperature = 0.4, maxTokens = 1024, signal, onToken }) => {
  assertConfigured();
  const timeout = withTimeout(signal);

  try {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: timeout.signal,
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!response.ok) await throwProxyError(response);
    if (!response.body) {
      throw new AiError('The AI service returned a response the app could not read.', {
        code: 'no_stream',
      });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let full = '';

    // Server-Sent Events arrive as blocks separated by a blank line. Anything
    // without a `data:` line (such as a keep-alive comment) is skipped.
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';

      for (const block of blocks) {
        const line = block.split('\n').find((candidate) => candidate.startsWith('data: '));
        if (!line) continue;

        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        const chunk = (() => {
          try {
            return JSON.parse(data)?.choices?.[0]?.delta?.content ?? '';
          } catch {
            return '';
          }
        })();

        if (chunk) {
          full += chunk;
          onToken(chunk);
        }
      }
    }

    if (full.trim() === '') {
      throw new AiError('The AI service returned an empty response. Please try again.', {
        code: 'empty_response',
      });
    }
    return full;
  } catch (error) {
    if (error instanceof AiError) throw error;
    if (timeout.timedOut()) {
      throw new AiError('The AI service took too long to respond. Please try again.', {
        code: 'timeout',
      });
    }
    if (error?.name === 'AbortError') throw error;
    throw new AiError('Could not reach the AI service. Please check your connection.', {
      code: 'network',
      cause: error,
    });
  } finally {
    timeout.cleanup();
  }
};

/**
 * Pull a JSON value out of a model reply that may be wrapped in a code fence or
 * padded with a sentence of commentary.
 *
 * @param {string} reply
 * @returns {unknown}
 * @throws {AiError} When nothing parseable can be found.
 */
const extractJson = (reply) => {
  const withoutFence = reply.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();
  const start = withoutFence.search(/[[{]/);
  const end = Math.max(withoutFence.lastIndexOf(']'), withoutFence.lastIndexOf('}'));

  if (start === -1 || end <= start) {
    throw new AiError('The AI reply was not in the expected format. Please try again.', {
      code: 'bad_format',
    });
  }

  try {
    return JSON.parse(withoutFence.slice(start, end + 1));
  } catch (error) {
    throw new AiError('The AI reply was not in the expected format. Please try again.', {
      code: 'bad_format',
      cause: error,
    });
  }
};

/**
 * Coerce one raw object from the model into a slide draft this app can save.
 *
 * Anything missing or of the wrong type is repaired rather than rejected, so a
 * slightly imperfect reply still produces a usable deck.
 *
 * @param {unknown} raw
 * @param {number} index Zero-based position in the generated deck.
 * @returns {object|null} A slide draft, or null if the entry is unusable.
 */
const toSlideDraft = (raw, index) => {
  if (!raw || typeof raw !== 'object') return null;

  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const body = typeof raw.body === 'string' ? raw.body.trim() : '';
  if (title === '' && body === '') return null;

  const wantsPoll = String(raw.type ?? '').toLowerCase() === 'poll';
  const options = Array.isArray(raw.options)
    ? raw.options.map((option) => String(option).trim()).filter(Boolean).slice(0, 6)
    : [];
  const question = typeof raw.question === 'string' ? raw.question.trim() : '';
  const isPoll = wantsPoll && question !== '' && options.length >= 2;

  return {
    title: title || `Slide ${index + 1}`,
    body: body || `# ${title}`,
    type: isPoll ? SLIDE_TYPE.poll : SLIDE_TYPE.content,
    position: index + 1,
    question: isPoll ? question : '',
    options: isPoll ? options : [],
  };
};

const DECK_SYSTEM_PROMPT = [
  'You write slide decks for a live audience in a markdown dialect called presentMD.',
  'presentMD supports: # heading, ## subheading, - bullet, 1. numbered item, > quote,',
  '**bold**, *italic*, `code`, [text](url) and --- for a divider. Use nothing else.',
  'Every slide body must open with a "# " heading line and then have at most five short bullets.',
  'Keep each bullet under twelve words so it is readable from the back of a room.',
  'Reply with JSON only. No commentary, no code fence.',
].join(' ');

/**
 * Ask the language model for a complete starter deck on a topic.
 *
 * @param {{topic: string, audience?: string, slideCount?: number, includePoll?: boolean, signal?: AbortSignal, onProgress?: (stage: string) => void}} options
 * @returns {Promise<object[]>} Slide drafts ready to be saved through the API.
 */
export const generateDeckOutline = async ({
  topic,
  audience = 'a general audience',
  slideCount = 5,
  includePoll = true,
  signal,
  onProgress = () => {},
}) => {
  const count = Math.min(Math.max(Number(slideCount) || 5, 3), 6);

  onProgress('Sending your topic to the language model');

  const userPrompt = [
    `Write a ${count}-slide presentation about "${topic}" for ${audience}.`,
    includePoll
      ? 'Exactly one slide in the middle of the deck must be a poll slide that asks the audience an opinion question with three or four short answer options.'
      : 'Do not include any poll slides.',
    'Return a JSON array. Each element is an object with these keys:',
    '"title" (short slide title), "body" (the presentMD source for the slide),',
    '"type" ("Content" or "Poll"), and for a poll slide also "question" (the poll question)',
    'and "options" (an array of 3 or 4 short answer strings).',
  ].join(' ');

  const reply = await chat({
    messages: [
      { role: 'system', content: DECK_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    signal,
  });

  onProgress('Checking the slides the model wrote');

  const parsed = extractJson(reply);
  const rawSlides = Array.isArray(parsed) ? parsed : parsed?.slides;
  if (!Array.isArray(rawSlides)) {
    throw new AiError('The AI reply did not contain any slides. Please try again.', {
      code: 'bad_format',
    });
  }

  const drafts = rawSlides
    .map(toSlideDraft)
    .filter(Boolean)
    .slice(0, count)
    .map((draft, index) => ({ ...draft, position: index + 1 }));

  if (drafts.length === 0) {
    throw new AiError('The AI reply did not contain any usable slides. Please try again.', {
      code: 'bad_format',
    });
  }

  return drafts;
};

const SUMMARY_SYSTEM_PROMPT = [
  'You help a presenter understand how their live audience answered the polls in their deck.',
  'Write for the presenter, in the second person, in plain prose.',
  'Base every statement only on the figures you are given; never invent a number.',
  'Structure the reply as three short paragraphs: what the audience thought,',
  'where opinion was divided, and one concrete suggestion for the presenter.',
  'Do not use markdown formatting, headings or bullet points.',
].join(' ');

/**
 * Turn the collected poll responses into a prompt-friendly description.
 *
 * @param {{presentation: object, slides: object[], responses: object[], attendees: object[]}} input
 * @returns {string} A plain-text briefing for the model.
 */
const describePollResults = ({ presentation, slides, responses, attendees }) => {
  const pollSlides = slides.filter((slide) => slide.type === SLIDE_TYPE.poll);

  const perSlide = pollSlides.map((slide) => {
    const forSlide = responses.filter((response) => response.slide_id === slide.id);
    const options = Array.isArray(slide.options) ? slide.options : [];
    const tally = options
      .map((option) => {
        const votes = forSlide.filter((response) => response.option === option).length;
        return `${option}: ${votes}`;
      })
      .join(', ');
    return `Poll "${slide.question}" (slide ${slide.position}) received ${forSlide.length} answers. Tally -- ${tally}.`;
  });

  const context = toPlainText(presentation.description ?? '').slice(0, 300);

  return [
    `Presentation: ${presentation.title}.`,
    context ? `Description: ${context}.` : '',
    `Audience: ${attendees.length} people joined, ${
      attendees.filter((attendee) => attendee.status === ATTENDEE_STATUS.finished).length
    } reached the end.`,
    ...perSlide,
  ]
    .filter(Boolean)
    .join('\n');
};

/**
 * Summarise the audience poll responses for the presenter, streaming the reply.
 *
 * @param {{presentation: object, slides: object[], responses: object[], attendees: object[], signal?: AbortSignal, onToken?: (chunk: string) => void}} options
 * @returns {Promise<string>} The finished summary.
 */
export const summarisePollResults = async ({
  presentation,
  slides,
  responses,
  attendees,
  signal,
  onToken = () => {},
}) => {
  const briefing = describePollResults({ presentation, slides, responses, attendees });

  return streamChat({
    messages: [
      { role: 'system', content: SUMMARY_SYSTEM_PROMPT },
      { role: 'user', content: briefing },
    ],
    signal,
    onToken,
  });
};
