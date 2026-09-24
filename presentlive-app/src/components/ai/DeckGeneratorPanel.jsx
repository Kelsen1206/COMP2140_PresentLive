import { useEffect, useRef, useState } from 'react';
import { SLIDE_TYPE, isAiConfigured } from '../../config.js';
import { generateDeckOutline } from '../../lib/ai.js';
import { slides as slidesApi } from '../../lib/api/index.js';
import { nextSlidePosition } from '../../lib/statistics.js';
import { useToast } from '../../context/toastContext.js';
import { Button } from '../ui/Button.jsx';
import { Callout } from '../ui/Callout.jsx';
import { Card } from '../ui/Card.jsx';
import { Icon } from '../ui/Icon.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { ErrorState } from '../ui/States.jsx';
import { SlideStage } from '../slides/SlideStage.jsx';

/** How many slides the presenter may ask for. */
const SLIDE_COUNT_CHOICES = [3, 4, 5, 6];

/**
 * Write one generated slide to the API.
 *
 * @param {object} draft A slide draft produced by the language model.
 * @param {string} presentationId
 * @param {number} position Position within the existing deck.
 * @returns {Promise<object>}
 */
const saveDraft = (draft, presentationId, position) =>
  slidesApi.create({
    presentation_id: presentationId,
    title: draft.title,
    body: draft.body,
    type: draft.type,
    position,
    question: draft.question ?? '',
    options: Array.isArray(draft.options) ? draft.options : [],
  });

/**
 * Generate a starter deck from a topic using the course language model.
 *
 * The request can take the better part of a minute, so the panel reports which
 * stage it has reached, offers a cancel button throughout, and shows the slides
 * for approval before anything is written to the API. Nothing is saved without
 * the presenter looking at it first.
 *
 * @param {{
 *   presentationId: string,
 *   presentation: object,
 *   existingSlides: object[],
 *   onSlidesAdded: () => void,
 * }} props
 */
export const DeckGeneratorPanel = ({
  presentationId,
  presentation,
  existingSlides,
  onSlidesAdded,
}) => {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('');
  const [slideCount, setSlideCount] = useState(5);
  const [includePoll, setIncludePoll] = useState(true);

  const [phase, setPhase] = useState('idle');
  const [stage, setStage] = useState('');
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState(null);
  const [savedCount, setSavedCount] = useState(0);

  const abortRef = useRef(null);
  const { notifySuccess, notifyError } = useToast();

  // Abandon an in-flight generation if the presenter navigates away.
  useEffect(() => () => abortRef.current?.abort(), []);

  const isBusy = phase === 'generating' || phase === 'saving';

  /** Ask the model for a deck outline. */
  const handleGenerate = async () => {
    if (topic.trim() === '') {
      setError(new Error('Enter a topic so the model knows what to write about.'));
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setPhase('generating');
    setError(null);
    setDrafts([]);
    setStage('Sending your topic to the language model');

    try {
      const generated = await generateDeckOutline({
        topic: topic.trim(),
        audience: audience.trim() || 'a general audience',
        slideCount,
        includePoll,
        signal: controller.signal,
        onProgress: setStage,
      });
      setDrafts(generated);
      setPhase('review');
    } catch (caught) {
      if (caught?.name === 'AbortError') {
        setPhase('idle');
        setStage('');
        return;
      }
      setError(caught);
      setPhase('idle');
    } finally {
      abortRef.current = null;
    }
  };

  /** Stop a generation that is taking too long. */
  const handleCancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase('idle');
    setStage('');
  };

  /** Write the approved drafts to the API, one after another. */
  const handleAccept = async () => {
    setPhase('saving');
    setError(null);
    setSavedCount(0);

    const startPosition = nextSlidePosition(existingSlides);

    try {
      // Saved in sequence rather than in parallel so the progress count is
      // truthful and the slides keep the order the model wrote them in.
      for (const [index, draft] of drafts.entries()) {
        await saveDraft(draft, presentationId, startPosition + index);
        setSavedCount(index + 1);
      }

      notifySuccess(
        `${drafts.length} slide${drafts.length === 1 ? '' : 's'} added to ${presentation.title}.`,
      );
      setDrafts([]);
      setTopic('');
      setAudience('');
      setPhase('idle');
      onSlidesAdded();
    } catch (caught) {
      setError(caught);
      setPhase('review');
      notifyError('Some slides could not be saved. The ones already added have been kept.');
    }
  };

  /** Throw the generated slides away without saving them. */
  const handleDiscard = () => {
    setDrafts([]);
    setPhase('idle');
    setError(null);
  };

  if (!isAiConfigured()) {
    return (
      <Card title="Generate a starter deck" description="Powered by the course language model.">
        <Callout tone="warning" title="AI key not configured">
          Add <code>VITE_AI_KEY</code> to the <code>.env</code> file and restart the dev server to
          use this feature. Everything else in the app works without it.
        </Callout>
      </Card>
    );
  }

  return (
    <Card
      title={
        <span className="card__title-with-icon">
          <Icon name="sparkles" size={18} />
          Generate a starter deck
        </span>
      }
      description="Describe your topic and the model writes the slides in presentMD. You review them before anything is saved."
    >
      {phase === 'idle' || phase === 'generating' ? (
        <div className="generator">
          <div className="field">
            <label className="field__label" htmlFor="ai-topic">
              Topic
            </label>
            <input
              id="ai-topic"
              className="input"
              type="text"
              value={topic}
              disabled={isBusy}
              placeholder="How rising sea levels affect coastal cities"
              onChange={(event) => setTopic(event.target.value)}
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="ai-audience">
              Audience <span className="field__optional">(optional)</span>
            </label>
            <input
              id="ai-audience"
              className="input"
              type="text"
              value={audience}
              disabled={isBusy}
              placeholder="first-year engineering students"
              onChange={(event) => setAudience(event.target.value)}
            />
          </div>

          <div className="generator__row">
            <div className="field">
              <label className="field__label" htmlFor="ai-count">
                Number of slides
              </label>
              <select
                id="ai-count"
                className="input select"
                value={slideCount}
                disabled={isBusy}
                onChange={(event) => setSlideCount(Number(event.target.value))}
              >
                {SLIDE_COUNT_CHOICES.map((count) => (
                  <option key={count} value={count}>
                    {count} slides
                  </option>
                ))}
              </select>
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={includePoll}
                disabled={isBusy}
                onChange={(event) => setIncludePoll(event.target.checked)}
              />
              <span>Include an audience poll slide</span>
            </label>
          </div>

          {phase === 'generating' ? (
            <div className="generator__progress" role="status" aria-live="polite">
              <Spinner size={18} />
              <span>{stage}...</span>
              <Button onClick={handleCancel} variant="ghost" size="sm">
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={handleGenerate} variant="primary" icon="sparkles">
              Generate slides
            </Button>
          )}

          {error ? <ErrorState error={error} title="The deck could not be generated" /> : null}
        </div>
      ) : null}

      {phase === 'review' || phase === 'saving' ? (
        <div className="generator-review">
          <Callout tone="info" title={`${drafts.length} slides ready to review`}>
            Nothing has been saved yet. Add them to the deck and you can edit any slide afterwards,
            or discard them and try a different topic.
          </Callout>

          <ol className="generator-review__list">
            {drafts.map((draft) => (
              <li key={`${draft.position}-${draft.title}`} className="generator-review__item">
                <p className="generator-review__caption">
                  <span className="generator-review__position">Slide {draft.position}</span>
                  <span>{draft.title}</span>
                  {draft.type === SLIDE_TYPE.poll ? (
                    <span className="generator-review__tag">Poll</span>
                  ) : null}
                </p>
                <SlideStage slide={draft} compact showPollQuestion />
                {draft.type === SLIDE_TYPE.poll ? (
                  <ul className="preview-options">
                    {draft.options.map((option) => (
                      <li key={option} className="preview-options__item">
                        {option}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>

          {error ? <ErrorState error={error} title="Those slides could not be saved" /> : null}

          <div className="generator-review__actions">
            <Button
              onClick={handleAccept}
              variant="primary"
              icon="plus"
              isPending={phase === 'saving'}
              pendingLabel={`Saving slide ${savedCount + 1} of ${drafts.length}`}
            >
              Add {drafts.length} slides to the deck
            </Button>
            <Button onClick={handleDiscard} variant="ghost" disabled={phase === 'saving'}>
              Discard
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
};
