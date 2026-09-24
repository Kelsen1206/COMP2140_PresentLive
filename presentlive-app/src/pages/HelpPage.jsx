import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { PRESENTMD_CHEATSHEET } from '../lib/presentMD.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Callout } from '../components/ui/Callout.jsx';

/** The presenter's path through the app, start to finish. */
const PRESENTER_STEPS = [
  {
    title: 'Create the presentation',
    body: 'Give it a title, a short description and your name. Leave it as a Draft while you work; nobody can join a draft.',
  },
  {
    title: 'Add your slides',
    body: 'Write each slide in presentMD and watch the preview beside the editor. Set a slide type to Poll to ask the room a question with two to six answers.',
  },
  {
    title: 'Or let the generator draft them',
    body: 'Type a topic into the deck generator and the language model writes a set of slides, including a poll. You review them on screen and nothing is saved until you say so.',
  },
  {
    title: 'Put them in order',
    body: 'Use the arrows beside each slide to move it up or down. The order on the deck screen is the order your audience sees.',
  },
  {
    title: 'Publish and share',
    body: 'Set the status to Published, then copy the presentation link and send it to your audience. The edit link is for anyone helping you write the deck.',
  },
  {
    title: 'Watch the answers arrive',
    body: 'Poll results appear as charts on the deck screen and update by themselves as people answer. The audience screen lists everyone who joined and what each of them chose.',
  },
];

/** The audience member's path, which is deliberately much shorter. */
const AUDIENCE_STEPS = [
  {
    title: 'Open the link',
    body: 'The welcome screen tells you what the talk is, who is presenting and how many slides there are. No account, no download.',
  },
  {
    title: 'Enter a display name',
    body: 'This is what the presenter sees beside your answers. A first name is plenty.',
  },
  {
    title: 'Step through the deck',
    body: 'One slide per page, at your own pace. As in a live talk, you cannot go back to a slide you have passed.',
  },
  {
    title: 'Answer the polls',
    body: 'When a poll appears, choose an option and submit it. Answers are final once given, and you need to answer before moving on.',
  },
  {
    title: 'Finish',
    body: 'The last slide ends with a thank-you screen that shows your own answers back to you.',
  },
];

/**
 * A plain-language walkthrough of both workflows.
 *
 * Linked from the header and the home page so that someone who has never seen
 * the app can find out what it expects of them without having to experiment.
 */
export const HelpPage = () => {
  useDocumentTitle('How it works');

  return (
    <div className="page page--narrow">
      <PageHeader
        eyebrow="Walkthrough"
        title="How PresentLive works"
        description="Two people use this app: the presenter who writes the deck, and the audience who step through it. Here is what each of them does."
      />

      <Card title="If you are presenting" description="Six steps from an empty screen to live results.">
        <ol className="steps">
          {PRESENTER_STEPS.map((step, index) => (
            <li className="steps__item" key={step.title}>
              <span className="steps__number" aria-hidden="true">
                {index + 1}
              </span>
              <div className="steps__body">
                <h3 className="steps__title">{step.title}</h3>
                <p className="steps__text">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="help__cta">
          <Button to="/presentations/new" variant="primary" icon="plus">
            Create a presentation
          </Button>
        </div>
      </Card>

      <Card
        title="If you are in the audience"
        description="You will normally arrive on a link rather than here."
      >
        <ol className="steps">
          {AUDIENCE_STEPS.map((step, index) => (
            <li className="steps__item" key={step.title}>
              <span className="steps__number" aria-hidden="true">
                {index + 1}
              </span>
              <div className="steps__body">
                <h3 className="steps__title">{step.title}</h3>
                <p className="steps__text">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <Callout tone="info" title="Why you cannot go back">
          A presentation is a live event. Letting people wander back through the deck would make the
          poll results meaningless, so the flow only moves forward -- and your place is saved, so
          closing the tab does not lose it.
        </Callout>
      </Card>

      <Card
        title="Writing slides in presentMD"
        description="A small markdown dialect. Anything not listed here is shown as ordinary text."
      >
        <dl className="cheatsheet__list cheatsheet__list--wide">
          {PRESENTMD_CHEATSHEET.map((entry) => (
            <div className="cheatsheet__row" key={entry.syntax}>
              <dt>
                <code>{entry.syntax}</code>
              </dt>
              <dd>{entry.meaning}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
};
