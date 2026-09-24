/**
 * Sample data loader.
 *
 * Creates two presentations, their slides, a small audience and the answers
 * that audience gave, so every screen in the app has something to show before
 * a marker has clicked anything.
 *
 * Usage:
 *   npm run seed           create the sample data
 *   npm run seed -- --wipe delete every record first, then create it again
 *
 * The API token is read from .env, exactly as the app reads it.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, '..');

/** Entity names, which must match the ones defined in the API config panel. */
const ENTITIES = ['presentations', 'slides', 'attendees', 'poll_responses'];

/**
 * Read the .env file into a plain object.
 *
 * @returns {Record<string, string>}
 */
const readEnv = () => {
  const raw = (() => {
    try {
      return readFileSync(join(projectRoot, '.env'), 'utf8');
    } catch {
      console.error('No .env file found. Copy .env.example to .env and add your API token.');
      process.exit(1);
    }
  })();

  return raw.split(/\r?\n/).reduce((env, line) => {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!match) return env;
    return { ...env, [match[1]]: match[2].trim().replace(/^["']|["']$/g, '') };
  }, {});
};

const env = readEnv();
const BASE_URL = env.VITE_API_BASE_URL ?? 'https://comp2140-3ea651da.uqcloud.net/api';
const TOKEN = env.VITE_API_TOKEN ?? '';

if (TOKEN === '') {
  console.error('VITE_API_TOKEN is empty in .env. Paste your access token in and run this again.');
  process.exit(1);
}

/**
 * Call the API, failing loudly with the server's own explanation.
 *
 * @param {string} path
 * @param {{method?: string, body?: unknown}} [options]
 * @returns {Promise<unknown>}
 */
const api = async (path, { method = 'GET', body } = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) return null;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = payload?.details ? ` ${JSON.stringify(payload.details)}` : '';
    throw new Error(`${method} ${path} failed with ${response.status}: ${payload?.error ?? ''}${detail}`);
  }

  return payload;
};

/**
 * Stop early, with instructions, if the entities have not been defined yet.
 */
const checkEntities = async () => {
  const payload = await api('/');
  // Each entry is an object describing one entity, not a bare name.
  const defined = Array.isArray(payload?.data)
    ? payload.data.map((entity) => (typeof entity === 'string' ? entity : entity?.name))
    : [];
  const missing = ENTITIES.filter((name) => !defined.includes(name));

  if (missing.length > 0) {
    console.error('These entities have not been created yet:', missing.join(', '));
    console.error('Create them on https://comp2140-3ea651da.uqcloud.net/config/entities');
    console.error('The exact field list is in the Readme, under "Set up the API".');
    process.exit(1);
  }
};

/** Remove every record of every entity. */
const wipe = async () => {
  for (const entity of [...ENTITIES].reverse()) {
    const payload = await api(`/${entity}?limit=200`);
    const records = Array.isArray(payload?.data) ? payload.data : [];
    for (const record of records) {
      await api(`/${entity}/${record.id}`, { method: 'DELETE' });
    }
    console.log(`  cleared ${records.length} ${entity}`);
  }
};

/** The decks, slides and audience the sample data is built from. */
const SAMPLE = [
  {
    presentation: {
      title: 'Designing for the Back Row',
      description:
        'A short talk on making slides readable from anywhere in the room, with two audience polls along the way.',
      presenter_name: 'Dr Alex Chen',
      status: 'Published',
      ai_summary: '',
    },
    slides: [
      {
        title: 'Welcome',
        type: 'Content',
        body: '# Designing for the Back Row\n\n## Slides people can actually read\n\n- Why the back row matters\n- Three rules that fix most decks\n- What this room thinks',
      },
      {
        title: 'The problem',
        type: 'Content',
        body: '# One slide, one idea\n\nMost decks fail because a slide is asked to do two jobs at once.\n\n- The speaker reads it\n- The audience reads it\n\n> Nobody can listen and read at the same time.',
      },
      {
        title: 'Poll: what loses a room',
        type: 'Poll',
        body: '# Your turn\n\nThink of the last talk that lost you.\n\nWhat was on the screen?',
        question: 'Which slide loses a room the fastest?',
        options: ['A wall of text', 'A tiny unreadable chart', 'No clear point', 'Too many animations'],
      },
      {
        title: 'Before and after',
        type: 'Content',
        // Demonstrates the presentMD image syntax. The file is served from the
        // app's own public folder, so it works offline and cannot break.
        body: '# The same slide, twice\n\n![Two slides compared: one crowded with small text, one with a single heading and three short bullets](/images/readable-slides.svg)\n\n> Cut it down until the back row can read it.',
      },
      {
        title: 'The three rules',
        type: 'Content',
        body: '# Three rules\n\n1. One idea per slide\n2. Type big enough to read standing up\n3. Ask more than you tell\n\nEverything else is decoration.',
      },
      {
        title: 'Poll: what will you change',
        type: 'Poll',
        body: '# Before you go\n\nPick the one change you will actually make this week.',
        question: 'What will you change in your next deck?',
        options: ['Cut the text', 'Make the type bigger', 'Add a poll', 'Nothing, my decks are fine'],
      },
      {
        title: 'Thank you',
        type: 'Content',
        body: '# Thank you\n\nQuestions are welcome.\n\n*The results of both polls are on the screen behind me.*',
      },
    ],
    audience: [
      { display_name: 'Priya', status: 'Finished', answers: ['A wall of text', 'Cut the text'] },
      { display_name: 'Tom', status: 'Finished', answers: ['A wall of text', 'Add a poll'] },
      { display_name: 'Mei', status: 'Finished', answers: ['No clear point', 'Cut the text'] },
      {
        display_name: 'Jordan',
        status: 'Finished',
        answers: ['A tiny unreadable chart', 'Make the type bigger'],
      },
      { display_name: 'Sam', status: 'Viewing', position: 4, answers: ['A wall of text'] },
      { display_name: 'Ana', status: 'Viewing', position: 3, answers: [] },
    ],
  },
  {
    presentation: {
      title: 'Sprint 7 Retrospective',
      description:
        'A draft deck for the team retro. Still being written, so the audience cannot join it yet.',
      presenter_name: 'Robin Patel',
      status: 'Draft',
      ai_summary: '',
    },
    slides: [
      {
        title: 'What went well',
        type: 'Content',
        body: '# What went well\n\n- Shipped the search rewrite\n- Zero incidents in production\n- Onboarded two new reviewers',
      },
      {
        title: 'Poll: biggest blocker',
        type: 'Poll',
        body: '# Where did we lose time?\n\nBe honest, this is anonymous to everyone but me.',
        question: 'What slowed us down most this sprint?',
        options: ['Unclear requirements', 'Waiting on review', 'Flaky tests'],
      },
    ],
    audience: [],
  },
];

/** Create every sample record, in dependency order. */
const seed = async () => {
  for (const group of SAMPLE) {
    const presentation = await api('/presentations', {
      method: 'POST',
      body: group.presentation,
    });
    console.log(`  created presentation "${presentation.title}"`);

    const slides = [];
    for (const [index, slide] of group.slides.entries()) {
      const created = await api('/slides', {
        method: 'POST',
        body: {
          presentation_id: presentation.id,
          title: slide.title,
          body: slide.body,
          type: slide.type,
          position: index + 1,
          question: slide.question ?? '',
          options: slide.options ?? [],
        },
      });
      slides.push(created);
    }
    console.log(`    added ${slides.length} slides`);

    const pollSlides = slides.filter((slide) => slide.type === 'Poll');

    for (const person of group.audience) {
      const attendee = await api('/attendees', {
        method: 'POST',
        body: {
          presentation_id: presentation.id,
          display_name: person.display_name,
          status: person.status,
          current_position: person.status === 'Finished' ? slides.length : (person.position ?? 1),
        },
      });

      for (const [index, option] of person.answers.entries()) {
        const slide = pollSlides[index];
        if (!slide) continue;
        await api('/poll_responses', {
          method: 'POST',
          body: {
            presentation_id: presentation.id,
            slide_id: slide.id,
            attendee_id: attendee.id,
            option,
          },
        });
      }
    }

    if (group.audience.length > 0) {
      console.log(`    added ${group.audience.length} audience members and their answers`);
    }
  }
};

const main = async () => {
  console.log(`Using API at ${BASE_URL}`);
  await checkEntities();

  if (process.argv.includes('--wipe')) {
    console.log('Clearing existing records...');
    await wipe();
  }

  console.log('Creating sample data...');
  await seed();
  console.log('\nDone. Start the app with "npm run dev" and open http://localhost:5173');
};

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
