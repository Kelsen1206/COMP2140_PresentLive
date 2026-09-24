# PresentLive

**COMP2140 Assessment 2 — React Web Project**
Theme 1: PresentLive, an interactive presentation platform.

Student: Kelsen Ze Yang Gho (s4942544)

---

## What this application is

PresentLive lets a presenter write a slide deck in the browser, share it through a link, and see what the audience made of it. Two different people use it:

- **The presenter** creates a presentation, writes slides in the `presentMD` markdown dialect, marks some of them as polls, orders the deck, publishes it and shares a link. Their dashboard shows how many people joined, how far each got, and how every poll was answered.
- **An audience member** opens the presentation link on their own device, enters a display name, and steps through the deck one slide per page, answering polls as they appear. They cannot go back, and an answer cannot be changed once given.

Everything created by the audience flows back to the presenter: the names, the progress, and the answers, shown as counts, as charts, and as a written summary produced by a language model.

---

## Setup

> **Marking the submitted zip? Use the quick start.** The zip already contains a configured `.env`, and the API entities and sample data already exist on the account it points to. You only need two commands, from inside the `presentlive-app` folder:
>
> ```bash
> npm install
> npm run dev
> ```
>
> Then open <http://localhost:5173> and go to the [Testing Guide](#testing-guide). **Skip steps 3–5 below**, and do not run `cp .env.example .env`: it would replace the working `.env` with blank values.
>
> Steps 1–6 are the full setup for a fresh copy with no `.env`, such as a clone of the source repository.

### 1. Requirements

- Node.js 20.19 or newer (developed on 22.14) and npm 10.

### 2. Install

```bash
cd presentlive-app
npm install
```

### 3. Create the API entities

Open <https://comp2140-3ea651da.uqcloud.net/config/entities> and create the four entities below. Field names, types and the `Required` ticks matter — the app sends exactly these names.

**`presentations`**

| Field | Type | Required | Default |
| --- | --- | --- | --- |
| `title` | string | yes | |
| `description` | string | yes | |
| `presenter_name` | string | yes | |
| `status` | string | yes | |
| `ai_summary` | string | no | |

**`slides`**

| Field | Type | Required | Default |
| --- | --- | --- | --- |
| `presentation_id` | string | yes | |
| `title` | string | yes | |
| `body` | string | yes | |
| `type` | string | yes | |
| `position` | number | yes | |
| `question` | string | no | |
| `options` | json | no | |

**`attendees`** — tick **Broadcast live events for this entity**

| Field | Type | Required | Default |
| --- | --- | --- | --- |
| `presentation_id` | string | yes | |
| `display_name` | string | yes | |
| `status` | string | yes | |
| `current_position` | number | no | `1` |

**`poll_responses`** — tick **Broadcast live events for this entity**

| Field | Type | Required | Default |
| --- | --- | --- | --- |
| `presentation_id` | string | yes | |
| `slide_id` | string | yes | |
| `attendee_id` | string | yes | |
| `option` | string | yes | |

> The two **Broadcast live events** ticks are what make the presenter's dashboard update by itself while a session is running (Advanced Feature, see below). The app still works correctly without them — the figures simply need a refresh.

### 4. Add your credentials

```bash
cp .env.example .env
```

Then open `.env` and fill in two values:

- `VITE_API_TOKEN` — from the **Access token** page of the API config site.
- `VITE_AI_KEY` — from the **AI** page of the same site (starts with `sk-uq-`).

If either is missing the app says so in a banner at the top of every screen rather than failing silently.

### 5. Load the sample data

```bash
npm run seed
```

This creates two presentations, nine slides, six audience members and their poll answers, so every screen has something on it immediately. Use `npm run seed -- --wipe` to clear everything and start again.

### 6. Run it

```bash
npm run dev
```

Open <http://localhost:5173>.

Other scripts: `npm run build` (production build), `npm run lint` (oxlint, which reports no warnings), `npm run preview` (serve the production build).

---

## Testing Guide

Follow these in order. The sample data from step 5 above is assumed. Times are approximate; the whole guide takes about ten minutes.

### Workflow A — The presenter (Primary Management Workflow)

1. Open <http://localhost:5173>. The home page names both kinds of user and has two entry points. Click **Create a presentation**.
2. You are on `/presentations/new`. Leave **Title** empty, click into **Description**, then click back out of it — a validation message appears under Title. This is the controlled-form validation.
3. Fill the form in:
   - Title: `Testing PresentLive`
   - Description: `A deck created while following the testing guide.`
   - Presenter name: `Marker`
   - Status: leave on **Draft**
4. Click **Create presentation**. A green confirmation appears in the bottom corner and you land on the deck workspace at `/presentations/<id>`.
5. Click **Add slide**. Type a title, then edit the body — the preview on the right redraws as you type. Try `# Hello`, then a line `- a bullet`, then `**bold**`. Click **Add slide**.
6. Click **Add slide** again. Set **Slide type** to **Poll** — the poll question and answer options appear only now. Enter a question, fill both options, then click **Add option** and fill a third. Try removing an option down to one: the remove button disables at two, and clearing an option's text produces the message "Add at least two answer options." Fill them back in and save.
7. Back on the deck, use the **up / down arrows** beside a slide to reorder it. The position numbers renumber immediately and the new order is saved.
8. Click **Edit** on a slide, change its title, and save. Click **Delete** on a slide — a confirmation dialog appears and warns that poll answers go with it. Cancel it, or confirm to see the deletion confirmation message.
9. Click **Edit details**, set **Status** to **Published**, and save.
10. In the **Share this deck** panel on the right, click **Copy** beside **Presentation link**. A confirmation appears. Keep this link for Workflow B.

_Covers: 1.2 (list views, add/edit/delete), 1.3 (controlled shared forms, validation, confirmation feedback), 1.4 (the workflow end to end), 1.5 (the link)._

### Workflow B — The audience (Guided Multi-step Workflow, Unique Link Access)

11. Open a **new private/incognito window** — this proves the link needs no sign-in and nothing from the first tab. Paste the presentation link you copied in step 10.
12. You get a **welcome screen**: the title, the presenter, how many slides, how many polls, and the three rules of the flow. Click **Start the presentation** without typing a name — the display-name field is validated.
13. Enter `Test Viewer` and click **Start the presentation**.
14. You are on `/present/<id>/slide/1`. There is a progress bar, one slide, and a single **Next slide** button. **Now edit the address bar** and try to jump ahead, e.g. change `/slide/1` to `/slide/3`. You are sent straight back to slide 1 — progression is controlled by the Attendee record, not the URL.
15. Click **Next slide** until you reach the poll slide. The **Next slide** button is disabled and the hint says "Answer the poll above to continue."
16. Choose an option and click **Submit answer**. The options become a read-only summary with your answer marked, and a note explains it cannot be taken back. Underneath, **How the room answered** appears: a live bar chart of everyone's answers to this poll so far, including yours. It only appears after you have answered, so seeing the results cannot sway your vote. **Press the browser back button** — you are returned to the slide you are on, not the previous one.
17. Continue to the last slide and click **Finish presentation**.
18. The **thank-you screen** shows what was recorded and reads your own answers back to you. Navigating back into the deck sends you here again.

_Covers: 1.5 (works pasted into a fresh session, loads from the URL parameter), 1.6 (welcome screen, identity capture, controlled progression persisted via the API, clear end), 2.2 (reachable with no prior knowledge)._

### Workflow C — The round trip and derived information

19. Go back to the **first window**, on the deck workspace, and refresh if needed.
20. The four tiles at the top now include your new audience member and their answer. **Poll answers** and **Audience** are links — click **Audience**.
21. `/presentations/<id>/audience` is the Attendee list view: every person who joined, their status, how far they got, and a column per poll showing what each of them chose. `Test Viewer` from Workflow B is in the table.
22. Filter by **Viewing** and **Finished** using the buttons in the card header.
23. Scroll down to **Poll answers**. This is the PollResponse list view: one row per answer, most recent first, showing when it was given, who gave it, which slide it belongs to and what they chose. Your answer from step 16 is at the top. The rows are deliberately read-only — an answer is final once given, which is what the audience is told before they vote — and responses are removed by deleting the audience member or the slide they belong to.
24. Go back to the deck. The **Poll results** card draws a bar chart per poll slide, including your answer from step 16.
25. Open the seeded deck **Designing for the Back Row** from `/presentations` to see the same screens with a fuller set of data (six attendees, two polls). Slide 4, **Before and after**, shows an image rendered from presentMD with `![alt](/images/readable-slides.svg)` — the file is served from the app's own `public/` folder, so it needs no internet connection.

_Covers: 1.7 (data created by the presenter is acted on by the audience and flows back; counts, statuses and tallies are derived and link through to the screens behind them), 1.2 (the Attendee list view)._

### Feature D — AI Integration (Rubric 4.1)

There are **two** AI features, both operating on the application's own data.

**D1. Generate a starter deck** (on the deck workspace, right column)

26. Open any presentation. In **Generate a starter deck**, enter a topic such as `Why bridges fall down`, optionally an audience, choose 4 slides, and leave. **Include an audience poll slide** ticked.
27. Click **Generate slides**. While the model works, the panel reports the stage it has reached, and a **Cancel** button is available throughout — this is the long-running-operation progress feedback.
28. The generated slides appear **for review, unsaved**, rendered exactly as the audience would see them. Click **Add N slides to the deck**; the button counts the slides as they are written to the API one by one.
29. The new slides appear in the slide list and can be edited like any other. Click **Discard** instead if you want to try another topic.
30. To see the failure path, put a wrong value in `VITE_AI_KEY`, restart the dev server and try again: the panel shows a plain-language message rather than an error code.

**D2. Summarise the audience** (on the deck workspace, main column)

31. Open **Designing for the Back Row**, which has seeded poll answers.
32. Scroll to **Summarise the audience** and click **Summarise responses**. The reply is **streamed**, so the text is written into the panel word by word rather than appearing after a silent wait. **Stop** cancels it mid-stream.
33. When it finishes, the summary is **saved onto the presentation record** via the API — refresh the page and it is still there.
34. On a deck with no answers yet, the button is disabled and a note explains why, so the feature never runs on nothing.

### Feature E — Advanced Feature (Rubric 4.2)

**Interactive poll charts (Recharts) updating live over Server-Sent Events.**

Two documented integrations, both beyond the core requirements and separate from the AI above:

- **Recharts** (third-party React library) draws the horizontal bar charts: in the presenter's **Poll results** card, and for the audience in **How the room answered** after they vote. Both use the same chart component, with a custom tooltip showing the count and percentage for a bar, per-option colouring and value labels. It is loaded on demand with `React.lazy`, so an audience member only downloads the charting library once a chart is actually shown to them.
- **Server-Sent Events** (browser `EventSource` API) keep both charts current without a refresh. A refresh happens in the background, so the charts update in place instead of the page flashing back to a loading spinner.

To see the live update:

35. Put two windows side by side: the **deck workspace** for a published deck in one, and the **presentation link** for the same deck in the other (use a private window).
36. In the private window, join and answer a poll.
37. **Without touching the first window**, watch the **Poll answers** tile and the bar chart change within about a second. A green **Live** pill in the Poll results header shows the stream is connected.
38. It works the other way too. Keep the private window on the poll you just answered, open the presentation link in a **different browser** (for example Edge if you are using Chrome — private windows in one browser share storage and would count as the same person), join with another name and answer the same poll. The **How the room answered** chart in the first private window updates by itself.

> This needs the **Broadcast live events** tick on `attendees` and `poll_responses` (setup step 3). Without it the charts still work, they just do not update on their own.

### Other things worth clicking

- **`/help`** — a plain-language walkthrough of both workflows and the presentMD syntax, linked from the header and the home page.
- **Responsive layout** — narrow the window to phone width. The header collapses behind a menu, the deck workspace becomes one column, the slide editor stacks the preview under the form, and the audience flow stays a single column.
- **Error handling** — stop your internet connection and click **Refresh** on the audience screen: a readable message with a **Try again** button, not a stack trace. Put a wrong `VITE_API_TOKEN` in `.env` and restart: a banner explains exactly which value is wrong.
- **Bad URLs** — open `/presentations/not-a-real-id` for a handled failure state, or `/nonsense` for the not-found page.
- **Keyboard and screen readers** — tab from the top of any page to reach the "Skip to content" link; form fields are labelled and errors are announced.

---

## Where each Functionality requirement is demonstrated

| Requirement | Where to find it |
| --- | --- |
| App design and navigation | Header and footer on every screen (`src/components/layout/`), client-side routing in `src/App.jsx` |
| 3+ related entities, all data via the RESTful API | `presentations`, `slides`, `attendees`, `poll_responses`; every call goes through `src/lib/api/client.js` |
| List views with main details | Presentations at `/presentations` (cards), Slides on the deck workspace, Attendees and PollResponses at `/presentations/:id/audience` (two tables) |
| Add, edit, delete | Presentations and slides throughout Workflow A; audience members on the audience screen |
| Required fields, validated with friendly messages | `src/lib/validation.js` with `src/hooks/useForm.js`; steps 2, 6 and 12 |
| Loading, empty and failure states | `DataState` in `src/components/ui/States.jsx`, used by every screen that loads data |
| Appropriate use of colour, images, icons, instructions | Design tokens in `src/styles/tokens.css`, custom SVG icon set in `src/components/ui/Icon.jsx`, the diagram on slide 4 of the seeded deck, and the `/help` walkthrough |
| All data used, nothing write-only | Workflow C; every stored field is read back somewhere |
| Derived summary information that links through | The stat tiles on the deck workspace and audience screen |
| Round trip between user types | Workflow C, steps 19–24 |
| Two distinct workflows, one guided multi-step | Workflow A and Workflow B |
| Unique link access | Steps 10–11, route `/present/:presentationId` |
| AI integration | Feature D (deck generation and streamed poll summary) |
| Advanced feature | Feature E (Recharts + Server-Sent Events) |

---

## How the code is organised

```
src/
  config.js              Environment values and the allowed field values
  lib/
    api/client.js        The only place fetch is called against the API
    api/index.js         One CRUD resource per entity, plus cross-entity helpers
    ai.js                Language-model calls: deck generation, streamed summary
    liveEvents.js        Server-Sent Events subscription
    presentMD.js         Parser for the slide markdown dialect
    statistics.js        Derived counts and poll tallies
    validation.js        Composable form rules
    format.js            Date, percentage and text display helpers
    slideRecord.js       Form values to API record
  hooks/                 useAsyncData, useMutation, useForm, useLiveUpdates, ...
  context/               Toast notifications
  components/
    layout/              Header, footer, error boundary, scroll restoration
    ui/                  Button, Card, Badge, States, Dialog, Toast, Icon, ...
    forms/               Shared field components and the form frame
    presentations/       Presentation card, form, share links
    slides/              presentMD renderer, slide stage, slide form and list
    polls/               Poll chart, poll answer form
    ai/                  Deck generator panel, poll summary panel
    attendee/            Audience table, step progress
  pages/                 One component per route
  styles/                Design tokens, base, layout, components, pages
scripts/seed.mjs         Sample data loader
```

Three decisions worth pointing out in the code review:

1. **All API access is centralised.** `createResource(entity)` in `src/lib/api/client.js` builds the five CRUD methods once, so no component contains a `fetch` call, an `Authorization` header or its own error handling.
2. **Loading, empty and failure are one component.** `DataState` takes the result of `useAsyncData` and decides what to render, so no screen re-implements it.
3. **The guided flow is controlled by data, not the URL.** The Attendee record's `current_position` is the source of truth; `src/pages/attendee/SlidePage.jsx` redirects any mismatched address back to it, which is what makes skipping ahead and going back impossible.

The only class component in the project is `ErrorBoundary`, because React provides no hook equivalent of `componentDidCatch`. Everything else is a function component.

---

## Declaration of Generative AI use

Generative AI was used substantially in producing this project, as permitted by the assessment brief, and is declared here in full.

**Tool used:** Claude Code (Anthropic Claude Opus 5), run locally against this repository, September 2026.

**What it was used for:**

- Scaffolding the project structure and generating the initial implementation of the components, hooks, library modules, pages and stylesheets in `src/`.
- Writing the `presentMD` parser in `src/lib/presentMD.js`.
- Writing the API client and resource helpers in `src/lib/api/`.
- Writing the language-model integration in `src/lib/ai.js`, including the prompt text used for deck generation and poll summarisation.
- Writing the CSS design system in `src/styles/`.
- Writing the sample data in `scripts/seed.mjs` and this Readme.

**What was done by hand:** reviewing, testing and correcting the generated code, defining the data model and the entity schema, choosing the workflows and the feature set, and verifying every step of the Testing Guide above against the running application.

**In-code attribution:** the code is not individually annotated, because AI assistance applied broadly across the `src/` directory rather than to isolated functions. This declaration covers the project as a whole.

AI is also used *at runtime* as an assessed feature of the application itself (see Feature D). That is a functional requirement of the brief and is separate from the authoring assistance declared above.

---

## References

Anthropic. (2025). Claude. Claude.Ai. https://claude.ai/new

Meta Platforms. (2025). *React documentation*. https://react.dev/

Recharts Group. (2025). *Recharts documentation*. https://recharts.org/

Remix Software. (2025). *React Router documentation*. https://reactrouter.com/

Mozilla. (2026). *Using server-sent events*. MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events

Mozilla. (2026). *Clipboard API*. MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API

OpenAI. (2026). *Chat completions API reference*. https://platform.openai.com/docs/api-reference/chat

The visual design, colour palette, component structure and all copy are original to this project. No external template, theme or UI kit was used.

---

## Known limitations

- The app has no authentication, as the brief specifies. Anyone with a presentation id can open the management screens for that deck; this is by design for a coursework project and would not be acceptable in production.
- An audience member is identified by a value in that browser's local storage. Clearing site data or switching device starts a new attendee record.
- The API has no cascading delete, so deleting a presentation issues one request per child record. On a very large deck this takes a moment.
- The deck generator is capped at six slides because the course AI proxy limits a response to 1,024 tokens.
