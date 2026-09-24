import { SLIDE_TYPE } from '../../config.js';
import { Badge } from '../ui/Badge.jsx';
import { SlideRenderer } from './SlideRenderer.jsx';

/**
 * The slide surface itself -- the rendered presentMD on a projector-like panel.
 *
 * The same component is used for the presenter's live preview while editing and
 * for what the audience sees on their own device, so the two can never drift
 * apart.
 *
 * @param {{
 *   slide: {title?: string, body?: string, type?: string, question?: string, position?: number},
 *   footer?: React.ReactNode,
 *   showPollQuestion?: boolean,
 *   compact?: boolean,
 * }} props
 */
export const SlideStage = ({ slide, footer, showPollQuestion = false, compact = false }) => (
  <article className={`slide-stage ${compact ? 'slide-stage--compact' : ''}`.trim()}>
    <div className="slide-stage__surface">
      <SlideRenderer source={slide?.body} />

      {showPollQuestion && slide?.type === SLIDE_TYPE.poll && slide?.question ? (
        <p className="slide-stage__question">{slide.question}</p>
      ) : null}
    </div>

    {footer ? <div className="slide-stage__footer">{footer}</div> : null}
  </article>
);

/**
 * A caption line describing a slide, used under previews and in list rows.
 *
 * @param {{slide: object, total?: number}} props
 */
export const SlideCaption = ({ slide, total }) => (
  <p className="slide-caption">
    <span className="slide-caption__position">
      Slide {slide.position}
      {total ? ` of ${total}` : ''}
    </span>
    <span className="slide-caption__title">{slide.title}</span>
    <Badge tone={slide.type === SLIDE_TYPE.poll ? 'accent' : 'neutral'}>{slide.type}</Badge>
  </p>
);
