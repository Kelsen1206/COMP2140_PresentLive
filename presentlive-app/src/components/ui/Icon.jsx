/**
 * The app's icon set, drawn inline as SVG.
 *
 * Keeping the shapes in one module means no icon font or image request, the
 * strokes inherit the surrounding text colour, and every icon is sized and
 * styled the same way wherever it appears.
 */

/** Shape of each icon, drawn on a 24x24 grid. */
const SHAPES = {
  plus: <path d="M12 5v14M5 12h14" />,
  edit: (
    <>
      <path d="M4 20h4L18.5 9.5a2.83 2.83 0 0 0-4-4L4 16v4Z" />
      <path d="M13.5 6.5l4 4" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1" />
    </>
  ),
  check: <path d="M4 12.5l5 5L20 6.5" />,
  link: (
    <>
      <path d="M10.5 13.5a4 4 0 0 0 5.66 0l2.5-2.5a4 4 0 1 0-5.66-5.66l-1.2 1.2" />
      <path d="M13.5 10.5a4 4 0 0 0-5.66 0l-2.5 2.5a4 4 0 1 0 5.66 5.66l1.2-1.2" />
    </>
  ),
  chart: (
    <>
      <path d="M3 21h18" />
      <path d="M6 21V11M12 21V4M18 21v-7" />
    </>
  ),
  users: (
    <>
      <path d="M15 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="3.2" />
      <path d="M17 11.2A3.2 3.2 0 0 0 17 5" />
      <path d="M18.5 20v-1.8a4 4 0 0 0-2.2-3.5" />
    </>
  ),
  slides: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3l1.7 4.6L18 9.3l-4.3 1.7L12 15.6l-1.7-4.6L6 9.3l4.3-1.7L12 3Z" />
      <path d="M18.5 15l.8 2.1 2.2.8-2.2.8-.8 2.1-.8-2.1-2.2-.8 2.2-.8.8-2.1Z" />
    </>
  ),
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 18l-6-6 6-6" />,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  alert: (
    <>
      <path d="M12 3.5 1.8 20.5h20.4L12 3.5Z" />
      <path d="M12 10v4M12 17.5v.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8v.01" />
    </>
  ),
  play: <path d="M7 4.5l12 7.5-12 7.5V4.5Z" />,
  present: (
    <>
      <rect x="2.5" y="4" width="19" height="11" rx="1.5" />
      <path d="M12 15v3M8 21l4-3 4 3" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  home: <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-9.5Z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.5-5.8" />
      <path d="M20 4v5h-5" />
    </>
  ),
};

/**
 * Render one icon.
 *
 * Icons are decorative by default and hidden from screen readers; pass a
 * `title` only when the icon carries meaning no nearby text conveys.
 *
 * @param {{name: keyof typeof SHAPES, size?: number, title?: string, className?: string}} props
 */
export const Icon = ({ name, size = 18, title, className = '' }) => {
  const shape = SHAPES[name];
  if (!shape) return null;

  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      aria-label={title}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {shape}
    </svg>
  );
};
