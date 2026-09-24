import { Fragment } from 'react';
import { parsePresentMD } from '../../lib/presentMD.js';

/**
 * Render the inline nodes inside one block.
 *
 * The parser produces plain data, so the tree is turned into real React
 * elements here. Nothing is ever inserted as raw HTML, which means a slide body
 * cannot inject markup into the page.
 *
 * @param {object[]} nodes
 * @returns {React.ReactNode}
 */
const renderInline = (nodes) =>
  nodes.map((node, index) => {
    const key = `${node.type}-${index}`;

    if (node.type === 'text') return <Fragment key={key}>{node.value}</Fragment>;
    if (node.type === 'bold') return <strong key={key}>{renderInline(node.children)}</strong>;
    if (node.type === 'italic') return <em key={key}>{renderInline(node.children)}</em>;
    if (node.type === 'code') return <code key={key}>{node.value}</code>;
    if (node.type === 'image')
      return <img key={key} className="slide-image" src={node.src} alt={node.alt} loading="lazy" />;
    if (node.type === 'link')
      return (
        <a key={key} href={node.href} target="_blank" rel="noreferrer">
          {renderInline(node.children)}
        </a>
      );

    return null;
  });

/**
 * Render one block-level node.
 *
 * @param {object} block
 * @param {number} index
 * @returns {React.ReactNode}
 */
const renderBlock = (block, index) => {
  const key = `${block.type}-${index}`;

  if (block.type === 'heading') {
    const Heading = `h${Math.min(block.level + 1, 4)}`;
    return (
      <Heading key={key} className={`slide-heading slide-heading--${block.level}`}>
        {renderInline(block.content)}
      </Heading>
    );
  }

  if (block.type === 'paragraph') return <p key={key}>{renderInline(block.content)}</p>;

  if (block.type === 'bulletList')
    return (
      <ul key={key} className="slide-list">
        {block.items.map((item, itemIndex) => (
          <li key={`item-${itemIndex}`}>{renderInline(item)}</li>
        ))}
      </ul>
    );

  if (block.type === 'numberList')
    return (
      <ol key={key} className="slide-list">
        {block.items.map((item, itemIndex) => (
          <li key={`item-${itemIndex}`}>{renderInline(item)}</li>
        ))}
      </ol>
    );

  if (block.type === 'quote')
    return (
      <blockquote key={key} className="slide-quote">
        {renderInline(block.content)}
      </blockquote>
    );

  if (block.type === 'code')
    return (
      <pre key={key} className="slide-code">
        <code>{block.value}</code>
      </pre>
    );

  if (block.type === 'divider') return <hr key={key} className="slide-divider" />;

  return null;
};

/**
 * Render a slide body written in presentMD.
 *
 * @param {{source: string, emptyMessage?: string}} props
 */
export const SlideRenderer = ({ source, emptyMessage = 'This slide has no content yet.' }) => {
  const blocks = parsePresentMD(source);

  if (blocks.length === 0) {
    return <p className="slide-empty">{emptyMessage}</p>;
  }

  return <div className="slide-content">{blocks.map(renderBlock)}</div>;
};
