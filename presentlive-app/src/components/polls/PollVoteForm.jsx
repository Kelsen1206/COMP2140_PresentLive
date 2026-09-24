import { useState } from 'react';
import { Button } from '../ui/Button.jsx';
import { Callout } from '../ui/Callout.jsx';
import { ErrorState } from '../ui/States.jsx';

/**
 * The answer form an audience member sees on a poll slide.
 *
 * Once an answer is submitted it is final, so the options become a read-only
 * summary rather than an editable list. That rule is enforced here in the only
 * place a poll answer can be created.
 *
 * @param {{
 *   slide: object,
 *   existingAnswer?: string|null,
 *   isSubmitting?: boolean,
 *   error?: Error|null,
 *   onSubmit: (option: string) => void,
 * }} props
 */
export const PollVoteForm = ({
  slide,
  existingAnswer = null,
  isSubmitting = false,
  error,
  onSubmit,
}) => {
  const [selected, setSelected] = useState(existingAnswer ?? '');
  const [showRequired, setShowRequired] = useState(false);
  const options = Array.isArray(slide.options) ? slide.options : [];

  if (existingAnswer) {
    return (
      <div className="poll-vote poll-vote--locked">
        <p className="poll-vote__question">{slide.question}</p>
        <ul className="poll-vote__summary">
          {options.map((option) => (
            <li
              key={option}
              className={`poll-vote__summary-item ${
                option === existingAnswer ? 'is-chosen' : ''
              }`.trim()}
            >
              {option}
              {option === existingAnswer ? (
                <span className="poll-vote__chosen-tag">Your answer</span>
              ) : null}
            </li>
          ))}
        </ul>
        <Callout tone="info">
          Like a show of hands in the room, an answer cannot be taken back once it is given.
        </Callout>
      </div>
    );
  }

  /**
   * Submit the chosen option, or prompt for one if nothing is selected.
   *
   * @param {React.FormEvent} event
   */
  const handleSubmit = (event) => {
    event.preventDefault();
    if (selected === '') {
      setShowRequired(true);
      return;
    }
    onSubmit(selected);
  };

  return (
    <form className="poll-vote" onSubmit={handleSubmit} noValidate>
      <fieldset className="poll-vote__fieldset">
        <legend className="poll-vote__question">{slide.question}</legend>

        <div className="poll-vote__options">
          {options.map((option) => (
            <label
              key={option}
              className={`poll-option ${selected === option ? 'poll-option--selected' : ''}`.trim()}
            >
              <input
                type="radio"
                name="poll-answer"
                value={option}
                checked={selected === option}
                onChange={() => {
                  setSelected(option);
                  setShowRequired(false);
                }}
                disabled={isSubmitting}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {showRequired ? (
        <p className="field__error" role="alert">
          Choose one of the options to continue.
        </p>
      ) : null}

      {error ? <ErrorState error={error} title="Your answer was not saved" /> : null}

      <Button
        type="submit"
        variant="primary"
        icon="check"
        isPending={isSubmitting}
        pendingLabel="Saving your answer"
        fullWidth
      >
        Submit answer
      </Button>
    </form>
  );
};
