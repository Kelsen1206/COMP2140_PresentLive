/**
 * A small spinning indicator used inside buttons and beside inline progress
 * messages. The animation itself lives in the stylesheet.
 *
 * @param {{size?: number, label?: string}} props
 */
export const Spinner = ({ size = 20, label }) => (
  <span
    className="spinner"
    style={{ width: size, height: size }}
    role={label ? 'status' : undefined}
    aria-label={label}
    aria-hidden={label ? undefined : 'true'}
  />
);
