import { useEffect, useRef, useState } from 'react';
import { isAiConfigured } from '../../config.js';
import { summarisePollResults } from '../../lib/ai.js';
import { presentations as presentationsApi } from '../../lib/api/index.js';
import { formatDateTime } from '../../lib/format.js';
import { useToast } from '../../context/toastContext.js';
import { Button } from '../ui/Button.jsx';
import { Callout } from '../ui/Callout.jsx';
import { Card } from '../ui/Card.jsx';
import { Icon } from '../ui/Icon.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { ErrorState } from '../ui/States.jsx';

/**
 * Summarise what the audience said, using the course language model.
 *
 * The reply is streamed, so the presenter watches the summary being written
 * rather than staring at a spinner. Once it finishes it is saved back onto the
 * presentation record, which means it survives a refresh and is there the next
 * time the deck is opened.
 *
 * @param {{
 *   presentation: object,
 *   slides: object[],
 *   responses: object[],
 *   attendees: object[],
 *   onSaved: (summary: string) => void,
 * }} props
 */
export const PollSummaryPanel = ({ presentation, slides, responses, attendees, onSaved }) => {
  const [summary, setSummary] = useState(presentation.ai_summary ?? '');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const { notifySuccess, notifyError } = useToast();

  // Stop the stream if the presenter leaves the screen mid-summary.
  useEffect(() => () => abortRef.current?.abort(), []);

  const hasAnswers = responses.length > 0;

  /** Stream a fresh summary, then store it on the presentation record. */
  const handleSummarise = async () => {
    const controller = new AbortController();
    abortRef.current = controller;

    setIsStreaming(true);
    setError(null);
    setSummary('');

    try {
      const finished = await summarisePollResults({
        presentation,
        slides,
        responses,
        attendees,
        signal: controller.signal,
        onToken: (chunk) => setSummary((current) => current + chunk),
      });

      setIsStreaming(false);
      setIsSaving(true);

      await presentationsApi.update(presentation.id, { ai_summary: finished });
      onSaved(finished);
      notifySuccess('Summary saved to this presentation.');
    } catch (caught) {
      if (caught?.name === 'AbortError') {
        setSummary('');
        return;
      }
      setError(caught);
      notifyError('The summary could not be produced.');
    } finally {
      abortRef.current = null;
      setIsStreaming(false);
      setIsSaving(false);
    }
  };

  /** Abandon a summary that is still being written. */
  const handleCancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  };

  if (!isAiConfigured()) {
    return (
      <Card title="Summarise the audience" description="Powered by the course language model.">
        <Callout tone="warning" title="AI key not configured">
          Add <code>VITE_AI_KEY</code> to the <code>.env</code> file and restart the dev server to
          use this feature.
        </Callout>
      </Card>
    );
  }

  return (
    <Card
      title={
        <span className="card__title-with-icon">
          <Icon name="sparkles" size={18} />
          Summarise the audience
        </span>
      }
      description="Turns the poll tallies into a short read on what the room thought and what to do about it."
      actions={
        isStreaming ? (
          <Button onClick={handleCancel} variant="ghost" size="sm">
            Stop
          </Button>
        ) : (
          <Button
            onClick={handleSummarise}
            variant="primary"
            size="sm"
            icon="sparkles"
            disabled={!hasAnswers}
            isPending={isSaving}
            pendingLabel="Saving"
          >
            {summary ? 'Write a new summary' : 'Summarise responses'}
          </Button>
        )
      }
    >
      {!hasAnswers ? (
        <Callout tone="info" title="No answers to summarise yet">
          Once your audience has answered at least one poll, this will turn their responses into a
          short briefing for you.
        </Callout>
      ) : null}

      {isStreaming ? (
        <p className="ai-summary__status" role="status" aria-live="polite">
          <Spinner size={16} />
          <span>Reading {responses.length} answers and writing your summary...</span>
        </p>
      ) : null}

      {summary ? (
        <div className="ai-summary">
          <div className="ai-summary__text">
            {summary
              .split(/\n{2,}/)
              .map((paragraph) => paragraph.trim())
              .filter(Boolean)
              .map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            {isStreaming ? <span className="ai-summary__caret" aria-hidden="true" /> : null}
          </div>

          {!isStreaming && !isSaving ? (
            <p className="ai-summary__meta">
              Written by the course language model from {responses.length} answers. Saved to this
              presentation on {formatDateTime(presentation.updated_at)}.
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <ErrorState error={error} title="The summary could not be written" /> : null}
    </Card>
  );
};
