import { SLIDE_TYPE } from '../../config.js';
import { countResponsesForSlide } from '../../lib/statistics.js';
import { toPlainText } from '../../lib/presentMD.js';
import { truncate, pluralise } from '../../lib/format.js';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * One row of the slide list.
 *
 * @param {{
 *   slide: object,
 *   index: number,
 *   total: number,
 *   presentationId: string,
 *   responses: object[],
 *   isBusy: boolean,
 *   onMove: (slide: object, direction: -1|1) => void,
 *   onDelete: (slide: object) => void,
 * }} props
 */
const SlideRow = ({ slide, index, total, presentationId, responses, isBusy, onMove, onDelete }) => {
  const answerCount = countResponsesForSlide(slide, responses);
  const preview = truncate(toPlainText(slide.body), 110);

  return (
    <li className="slide-row">
      <div className="slide-row__order">
        <button
          type="button"
          className="slide-row__move"
          onClick={() => onMove(slide, -1)}
          disabled={index === 0 || isBusy}
          aria-label={`Move ${slide.title} earlier`}
        >
          <Icon name="arrowUp" size={15} />
        </button>
        <span className="slide-row__position">{slide.position}</span>
        <button
          type="button"
          className="slide-row__move"
          onClick={() => onMove(slide, 1)}
          disabled={index === total - 1 || isBusy}
          aria-label={`Move ${slide.title} later`}
        >
          <Icon name="arrowDown" size={15} />
        </button>
      </div>

      <div className="slide-row__main">
        <div className="slide-row__heading">
          <h3 className="slide-row__title">{slide.title}</h3>
          <Badge tone={slide.type === SLIDE_TYPE.poll ? 'accent' : 'neutral'}>{slide.type}</Badge>
        </div>

        {preview ? <p className="slide-row__preview">{preview}</p> : null}

        {slide.type === SLIDE_TYPE.poll ? (
          <p className="slide-row__poll">
            <Icon name="chart" size={14} />
            <span>{slide.question}</span>
            <span className="slide-row__count">{pluralise(answerCount, 'answer')}</span>
          </p>
        ) : null}
      </div>

      <div className="slide-row__actions">
        <Button
          to={`/presentations/${presentationId}/slides/${slide.id}/edit`}
          icon="edit"
          size="sm"
          variant="ghost"
        >
          Edit
        </Button>
        <Button
          onClick={() => onDelete(slide)}
          icon="trash"
          size="sm"
          variant="ghost"
          disabled={isBusy}
        >
          Delete
        </Button>
      </div>
    </li>
  );
};

/**
 * The ordered list of slides in a deck, with controls to reorder, edit and
 * remove each one.
 *
 * @param {{
 *   slides: object[],
 *   presentationId: string,
 *   responses?: object[],
 *   isBusy?: boolean,
 *   onMove: (slide: object, direction: -1|1) => void,
 *   onDelete: (slide: object) => void,
 * }} props
 */
export const SlideList = ({
  slides,
  presentationId,
  responses = [],
  isBusy = false,
  onMove,
  onDelete,
}) => (
  <ol className="slide-list-rows">
    {slides.map((slide, index) => (
      <SlideRow
        key={slide.id}
        slide={slide}
        index={index}
        total={slides.length}
        presentationId={presentationId}
        responses={responses}
        isBusy={isBusy}
        onMove={onMove}
        onDelete={onDelete}
      />
    ))}
  </ol>
);
