import blessed from 'neo-blessed';
import { createHeader, HEADER_HEIGHT } from '../components/header.js';
import { getAllDecks, deleteDeck, getCardsByDeck } from '../db/queries.js';

export async function renderDeckBrowser(screen, navigate) {
  async function showDeckList() {
    screen.children.slice().forEach(c => c.destroy());

    const header = createHeader(screen);
    screen.append(header);

    const decks = await getAllDecks();

    if (decks.length === 0) {
      const box = blessed.box({
        top: HEADER_HEIGHT, left: 0, width: '100%', height: `100%-${HEADER_HEIGHT}`,
        tags: true, padding: { left: 2, top: 1 },
        content: '{yellow-fg}{bold}Deck Browser{/bold}{/yellow-fg}\n\nNo decks yet. Create a flashcard to get started!\n\n{gray-fg}Press ESC to go back{/gray-fg}',
      });
      box.key(['escape'], () => navigate('menu'));
      box.focus();
      screen.append(box);
      screen.render();
      return;
    }

    const label = blessed.text({
      top: HEADER_HEIGHT + 1, left: 2, tags: true,
      content: '{cyan-fg}{bold}Deck Browser{/bold}{/cyan-fg}  {gray-fg}(ESC to go back){/gray-fg}',
    });
    screen.append(label);

    const list = blessed.list({
      top: HEADER_HEIGHT + 3, left: 2, width: '50%',
      height: `100%-${HEADER_HEIGHT + 4}`,
      items: decks.map(d => `${d.name}  (${d.card_count} cards)`),
      keys: true, vi: true, mouse: true,
      style: {
        selected: { bg: 'blue', fg: 'white', bold: true },
        item: { fg: 'white' },
      },
    });

    screen.append(list);
    list.focus();
    screen.render();

    list.key(['escape'], () => navigate('menu'));
    list.on('select', (_, index) => showDeckDetail(decks[index]));
  }

  async function showDeckDetail(deck) {
    screen.children.slice().forEach(c => c.destroy());

    const header = createHeader(screen);
    screen.append(header);

    const cards = await getCardsByDeck(deck.id);
    const mastered = cards.filter(c => c.interval >= 21).length;
    const flashcards = cards.filter(c => c.type === 'flashcard').length;
    const mcqs = cards.filter(c => c.type === 'mcq').length;
    const elab = cards.filter(c => c.type === 'elaboration').length;

    const info = blessed.box({
      top: HEADER_HEIGHT, left: 0, width: '60%', height: `100%-${HEADER_HEIGHT}`,
      tags: true, padding: { left: 2, top: 1 },
      content:
        `{cyan-fg}{bold}${deck.name}{/bold}{/cyan-fg}\n\n` +
        `Created: {gray-fg}${deck.created_at}{/gray-fg}\n\n` +
        `Total cards: {bold}${cards.length}{/bold}\n` +
        `  {cyan-fg}Flashcards: ${flashcards}{/cyan-fg}\n` +
        `  {magenta-fg}MCQ: ${mcqs}{/magenta-fg}\n` +
        `  {yellow-fg}Deep Questions: ${elab}{/yellow-fg}\n` +
        `  {green-fg}Mastered: ${mastered}/${cards.length}{/green-fg}\n`,
    });
    screen.append(info);

    const actions = blessed.list({
      top: HEADER_HEIGHT + 3, left: '60%', width: '35%',
      height: 6,
      items: ['Delete Deck', 'Back'],
      keys: true, vi: true, mouse: true,
      border: { type: 'line' },
      style: {
        border: { fg: 'gray' },
        selected: { bg: 'blue', fg: 'white' },
        item: { fg: 'white' },
      },
    });
    screen.append(actions);
    actions.focus();
    screen.render();

    actions.key(['escape'], () => showDeckList());
    actions.on('select', (_, index) => {
      if (index === 0) confirmDelete(deck);
      else showDeckList();
    });
  }

  async function confirmDelete(deck) {
    screen.children.slice().forEach(c => c.destroy());

    const box = blessed.box({
      top: 'center', left: 'center', width: '50%', height: 8,
      border: { type: 'line' },
      style: { border: { fg: 'red' } },
      tags: true,
      content:
        `{red-fg}{bold}Delete "${deck.name}"?{/bold}{/red-fg}\n\n` +
        'This will remove all cards permanently.\n\n' +
        'Press {bold}y{/bold} to confirm, {bold}n{/bold} to cancel',
    });
    screen.append(box);
    box.focus();
    screen.render();

    box.once('keypress', async (ch) => {
      if (ch === 'y') {
        await deleteDeck(deck.id).catch(console.error);
        showDeckList();
      } else {
        showDeckDetail(deck);
      }
    });
  }

  showDeckList();
}
