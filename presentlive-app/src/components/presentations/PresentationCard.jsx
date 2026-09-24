import { Link } from 'react-router-dom';
import { formatDateTime, truncate } from '../../lib/format.js';
import { StatusBadge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { Icon } from '../ui/Icon.jsx';

/**
 * One presentation in the management list.
 *
 * The three figures along the bottom are derived from the related slides,
 * attendees and responses rather than stored on the record, and each links
 * through to the screen that explains it.
 *
 * @param {{
 *   presentation: object,
 *   stats: {slideCount: number, pollCount: number, attendeeCount: number,
 *           finishedCount: number, responseCount: number},
 *   onDelete: (presentation: object) => void,
 * }} props
 */
export const PresentationCard = ({ presentation, stats, onDelete }) => (
  <li className="presentation-card">
    <div className="presentation-card__top">
      <div className="presentation-card__heading">
        <h2 className="presentation-card__title">
          <Link to={`/presentations/${presentation.id}`}>{presentation.title}</Link>
        </h2>
        <p className="presentation-card__presenter">
          <Icon name="users" size={14} />
          <span>{presentation.presenter_name}</span>
        </p>
      </div>
      <StatusBadge value={presentation.status} />
    </div>

    <p className="presentation-card__description">{truncate(presentation.description, 160)}</p>

    <dl className="presentation-card__stats">
      <div>
        <dt>Slides</dt>
        <dd>
          {stats.slideCount}
          {stats.pollCount > 0 ? (
            <span className="presentation-card__sub">{stats.pollCount} poll</span>
          ) : null}
        </dd>
      </div>
      <div>
        <dt>Audience</dt>
        <dd>
          {stats.attendeeCount}
          {stats.attendeeCount > 0 ? (
            <span className="presentation-card__sub">{stats.finishedCount} finished</span>
          ) : null}
        </dd>
      </div>
      <div>
        <dt>Answers</dt>
        <dd>{stats.responseCount}</dd>
      </div>
    </dl>

    <p className="presentation-card__meta">Last updated {formatDateTime(presentation.updated_at)}</p>

    <div className="presentation-card__actions">
      <Button to={`/presentations/${presentation.id}`} variant="primary" size="sm" icon="slides">
        Open deck
      </Button>
      <Button
        to={`/presentations/${presentation.id}/edit`}
        variant="ghost"
        size="sm"
        icon="edit"
      >
        Edit details
      </Button>
      <Button onClick={() => onDelete(presentation)} variant="ghost" size="sm" icon="trash">
        Delete
      </Button>
    </div>
  </li>
);

/**
 * The grid the presentation cards are laid out in.
 *
 * @param {{children: React.ReactNode}} props
 */
export const PresentationGrid = ({ children }) => (
  <ul className="presentation-grid">{children}</ul>
);
