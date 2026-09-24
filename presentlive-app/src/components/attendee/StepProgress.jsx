/**
 * How far through the deck an audience member is.
 *
 * The guided flow only moves forward, so this is a genuine record of progress
 * rather than a navigation control -- the steps are deliberately not clickable.
 *
 * @param {{current: number, total: number, label?: string}} props
 */
export const StepProgress = ({ current, total, label = 'Your progress' }) => {
  const safeTotal = Math.max(total, 1);
  const clamped = Math.min(Math.max(current, 1), safeTotal);
  const percent = Math.round((clamped / safeTotal) * 100);

  return (
    <div className="step-progress">
      <div className="step-progress__text">
        <span className="step-progress__label">{label}</span>
        <span className="step-progress__count">
          Slide {clamped} of {safeTotal}
        </span>
      </div>
      <div
        className="step-progress__track"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={1}
        aria-valuemax={safeTotal}
        aria-label={`Slide ${clamped} of ${safeTotal}`}
      >
        <div className="step-progress__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};
