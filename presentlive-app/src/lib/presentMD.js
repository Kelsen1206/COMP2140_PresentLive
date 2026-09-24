/**
 * presentMD -- the lightweight markdown dialect slides are written in.
 *
 * This module turns a presentMD string into a plain-data syntax tree. Nothing
 * here touches the DOM and nothing produces an HTML string, so the renderer can
 * build real React elements and the app never needs dangerouslySetInnerHTML.
 *
 * Supported syntax:
 *   # / ## / ###   headings
 *   - item         bullet list
 *   1. item        numbered list
 *   > text         block quote
 *   ---            horizontal divider
 *   ```lang        fenced code block
 *   **bold**  *italic*  `code`  [text](url)  ![alt](url)
 */

/** One row per supported feature, shown to presenters in the slide editor. */
export const PRESENTMD_CHEATSHEET = [
  { syntax: '# Title', meaning: 'Large heading' },
  { syntax: '## Subtitle', meaning: 'Medium heading' },
  { syntax: '### Minor heading', meaning: 'Small heading' },
  { syntax: '- Point', meaning: 'Bullet list item' },
  { syntax: '1. Step', meaning: 'Numbered list item' },
  { syntax: '> Quote', meaning: 'Highlighted quotation' },
  { syntax: '**bold**', meaning: 'Bold text' },
  { syntax: '*italic*', meaning: 'Italic text' },
  { syntax: '`code`', meaning: 'Inline code' },
  { syntax: '[label](https://...)', meaning: 'Link' },
  { syntax: '![alt](https://...)', meaning: 'Image' },
  { syntax: '---', meaning: 'Divider line' },
];

/**
 * Matches the first inline construct in a run of text.
 * Bold is listed before italic so that `**x**` is not mistaken for `*`.
 */
const INLINE_PATTERN =
  /(!?)\[([^\]]*)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/;

/**
 * Convert one regular-expression match into an inline node.
 *
 * @param {RegExpExecArray} match
 * @returns {object} An inline syntax-tree node.
 */
const toInlineNode = (match) => {
  const [, bang, label, url, bold, italic, code] = match;
  if (url !== undefined) {
    return bang === '!'
      ? { type: 'image', alt: label, src: url }
      : { type: 'link', href: url, children: parseInline(label) };
  }
  if (bold !== undefined) return { type: 'bold', children: parseInline(bold) };
  if (italic !== undefined) return { type: 'italic', children: parseInline(italic) };
  return { type: 'code', value: code };
};

/**
 * Parse the inline formatting inside a single run of text.
 *
 * @param {string} text
 * @returns {object[]} Inline nodes in document order.
 */
export const parseInline = (text) => {
  if (!text) return [];
  const match = INLINE_PATTERN.exec(text);
  if (!match) return [{ type: 'text', value: text }];

  const before = text.slice(0, match.index);
  const after = text.slice(match.index + match[0].length);

  return [
    ...(before ? [{ type: 'text', value: before }] : []),
    toInlineNode(match),
    ...parseInline(after),
  ];
};

/**
 * Close whatever block was being accumulated and turn it into a finished node.
 *
 * @param {object|null} pending
 * @returns {object[]} Zero or one finished block.
 */
const closePending = (pending) => {
  if (!pending) return [];
  if (pending.type === 'paragraph') {
    return [{ type: 'paragraph', content: parseInline(pending.lines.join(' ')) }];
  }
  if (pending.type === 'quote') {
    return [{ type: 'quote', content: parseInline(pending.lines.join(' ')) }];
  }
  if (pending.type === 'code') {
    return [{ type: 'code', language: pending.language, value: pending.lines.join('\n') }];
  }
  return [{ type: pending.type, items: pending.items.map(parseInline) }];
};

/** Line-level patterns, tried in order. */
const HEADING = /^(#{1,3})\s+(.*)$/;
const BULLET = /^[-*+]\s+(.*)$/;
const NUMBERED = /^\d+[.)]\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const DIVIDER = /^(---+|\*\*\*+|___+)$/;
const FENCE = /^```\s*(\S*)\s*$/;

/**
 * Fold one source line into the running parse state.
 *
 * @param {{blocks: object[], pending: object|null}} state
 * @param {string} rawLine
 * @returns {{blocks: object[], pending: object|null}} The next state.
 */
const consumeLine = (state, rawLine) => {
  const { blocks, pending } = state;
  const line = rawLine.replace(/\s+$/, '');

  // Inside a fenced block every line is literal until the closing fence.
  if (pending?.type === 'code') {
    return FENCE.test(line.trim())
      ? { blocks: [...blocks, ...closePending(pending)], pending: null }
      : { blocks, pending: { ...pending, lines: [...pending.lines, rawLine] } };
  }

  const fence = FENCE.exec(line.trim());
  if (fence) {
    return {
      blocks: [...blocks, ...closePending(pending)],
      pending: { type: 'code', language: fence[1] || 'text', lines: [] },
    };
  }

  if (line.trim() === '') {
    return { blocks: [...blocks, ...closePending(pending)], pending: null };
  }

  if (DIVIDER.test(line.trim())) {
    return { blocks: [...blocks, ...closePending(pending), { type: 'divider' }], pending: null };
  }

  const heading = HEADING.exec(line);
  if (heading) {
    const node = { type: 'heading', level: heading[1].length, content: parseInline(heading[2]) };
    return { blocks: [...blocks, ...closePending(pending), node], pending: null };
  }

  const bullet = BULLET.exec(line);
  if (bullet) {
    return pending?.type === 'bulletList'
      ? { blocks, pending: { ...pending, items: [...pending.items, bullet[1]] } }
      : {
          blocks: [...blocks, ...closePending(pending)],
          pending: { type: 'bulletList', items: [bullet[1]] },
        };
  }

  const numbered = NUMBERED.exec(line);
  if (numbered) {
    return pending?.type === 'numberList'
      ? { blocks, pending: { ...pending, items: [...pending.items, numbered[1]] } }
      : {
          blocks: [...blocks, ...closePending(pending)],
          pending: { type: 'numberList', items: [numbered[1]] },
        };
  }

  const quote = QUOTE.exec(line);
  if (quote) {
    return pending?.type === 'quote'
      ? { blocks, pending: { ...pending, lines: [...pending.lines, quote[1]] } }
      : {
          blocks: [...blocks, ...closePending(pending)],
          pending: { type: 'quote', lines: [quote[1]] },
        };
  }

  return pending?.type === 'paragraph'
    ? { blocks, pending: { ...pending, lines: [...pending.lines, line] } }
    : {
        blocks: [...blocks, ...closePending(pending)],
        pending: { type: 'paragraph', lines: [line] },
      };
};

/**
 * Parse a full presentMD document into block-level nodes.
 *
 * @param {string} source The raw slide body.
 * @returns {object[]} Block nodes in document order.
 */
export const parsePresentMD = (source) => {
  if (typeof source !== 'string' || source.trim() === '') return [];
  const finalState = source.split(/\r?\n/).reduce(consumeLine, { blocks: [], pending: null });
  return [...finalState.blocks, ...closePending(finalState.pending)];
};

/**
 * Strip presentMD formatting down to readable prose.
 *
 * Used when slide content is sent to the language model, where markup would
 * only waste tokens and confuse the prompt.
 *
 * @param {string} source
 * @returns {string}
 */
export const toPlainText = (source) =>
  (typeof source === 'string' ? source : '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#]+/g, ' ')
    .replace(/^\s*\d+[.)]\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
