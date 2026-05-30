import blessed from 'neo-blessed';
import { createHeader, HEADER_HEIGHT } from '../components/header.js';
import { getDueCardCount, getMcqCards } from '../db/queries.js';

export async function renderMainMenu(screen, navigate) {
  const [dueCount, mcqs] = await Promise.all([getDueCardCount(), getMcqCards(null, 999)]);

  const header = createHeader(screen);
  screen.append(header);

  const label = blessed.text({
    top: HEADER_HEIGHT + 1, left: 2,
    tags: true,
    content: '{white-fg}{bold}What would you like to do?{/bold}{/white-fg}',
  });
  screen.append(label);

  const items = [
    dueCount > 0 ? `Study  (${dueCount} cards due)` : 'Study',
    mcqs.length > 0 ? `Quiz Mode  (${mcqs.length} questions)` : 'Quiz Mode',
    'Cram Mode',
    'Create Flashcard',
    'Browse Decks',
    'Dashboard & Stats',
    'Quit',
  ];

  const list = blessed.list({
    top: HEADER_HEIGHT + 3, left: 2,
    width: '50%',
    height: `100%-${HEADER_HEIGHT + 4}`,
    items,
    keys: true,
    vi: true,
    mouse: true,
    style: {
      selected: { bg: 'blue', fg: 'white', bold: true },
      item: { fg: 'white' },
    },
  });

  screen.append(list);
  list.focus();
  screen.render();

  const values = ['study', 'quiz', 'cram', 'create', 'decks', 'dashboard', 'quit'];
  list.on('select', (_, index) => navigate(values[index]));
}
