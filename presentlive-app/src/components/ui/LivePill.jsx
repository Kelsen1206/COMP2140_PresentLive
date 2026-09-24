/**
 * A small "Live" marker shown while a Server-Sent Events stream is connected,
 * so the viewer knows the figures beside it will update on their own.
 *
 * Renders nothing when disconnected, rather than a misleading "offline" label:
 * the data on screen is still correct, it just will not refresh by itself.
 *
 * @param {{isConnected: boolean}} props
 */
export const LivePill = ({ isConnected }) =>
  isConnected ? (
    <span className="live-pill">
      <span className="live-pill__dot" aria-hidden="true" />
      Live
    </span>
  ) : null;
