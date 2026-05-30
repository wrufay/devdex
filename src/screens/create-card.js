import blessed from 'neo-blessed';
import { createHeader, HEADER_HEIGHT } from '../components/header.js';
import { createDeck, createCard, getAllDecks, addXp } from '../db/queries.js';

export async function renderCreateCard(screen, navigate) {
  async function showDeckSelect() {
    screen.children.slice().forEach(c => c.destroy());

    const header = createHeader(screen);
    screen.append(header);

    const decks = await getAllDecks();

    const label = blessed.text({
      top: HEADER_HEIGHT + 1, left: 2, tags: true,
      content: '{cyan-fg}{bold}Create a Flashcard{/bold}{/cyan-fg}  {gray-fg}Select a deck:{/gray-fg}',
    });
    screen.append(label);

    const items = [
      ...decks.map(d => `${d.name}  (${d.card_count} cards)`),
      '+ Create New Deck',
      '<- Back to Menu',
    ];

    const list = blessed.list({
      top: HEADER_HEIGHT + 3, left: 2, width: '60%',
      height: `100%-${HEADER_HEIGHT + 4}`,
      items, keys: true, vi: true, mouse: true,
      style: {
        selected: { bg: 'blue', fg: 'white', bold: true },
        item: { fg: 'white' },
      },
    });

    screen.append(list);
    list.focus();
    screen.render();

    list.key(['escape'], () => navigate('menu'));
    list.on('select', (_, index) => {
      if (index === items.length - 1) { navigate('menu'); return; }
      if (index === items.length - 2) { showNewDeck(); return; }
      showFront(decks[index].id);
    });
  }

  async function showNewDeck() {
    screen.children.slice().forEach(c => c.destroy());

    const header = createHeader(screen);
    screen.append(header);

    const label = blessed.text({
      top: HEADER_HEIGHT + 1, left: 2, tags: true,
      content: '{cyan-fg}{bold}Create a New Deck{/bold}{/cyan-fg}\n\n{gray-fg}Enter deck name:{/gray-fg}',
    });
    screen.append(label);

    const input = blessed.textbox({
      top: HEADER_HEIGHT + 5, left: 2, width: '60%', height: 3,
      border: { type: 'line' },
      style: { border: { fg: 'cyan' }, focus: { border: { fg: 'cyan' } } },
      inputOnFocus: true, keys: true,
    });
    screen.append(input);
    input.focus();
    screen.render();

    input.key(['escape'], () => showDeckSelect());
    input.once('submit', async (value) => {
      if (!value?.trim()) { showNewDeck(); return; }
      const id = await createDeck(value.trim(), value.trim()).catch(console.error);
      showFront(id);
    });
    input.readInput();
  }

  function showFront(deckId) {
    screen.children.slice().forEach(c => c.destroy());

    const header = createHeader(screen);
    screen.append(header);

    const label = blessed.text({
      top: HEADER_HEIGHT + 1, left: 2, tags: true,
      content: '{cyan-fg}{bold}Create a Flashcard{/bold}{/cyan-fg}\n\n{gray-fg}Question (front of card):{/gray-fg}',
    });
    screen.append(label);

    const input = blessed.textbox({
      top: HEADER_HEIGHT + 5, left: 2, width: '80%', height: 3,
      border: { type: 'line' },
      style: { border: { fg: 'cyan' }, focus: { border: { fg: 'cyan' } } },
      inputOnFocus: true, keys: true,
    });
    screen.append(input);
    input.focus();
    screen.render();

    input.key(['escape'], () => navigate('menu'));
    input.once('submit', (value) => {
      if (!value?.trim()) { showFront(deckId); return; }
      showBack(deckId, value.trim());
    });
    input.readInput();
  }

  function showBack(deckId, front) {
    screen.children.slice().forEach(c => c.destroy());

    const header = createHeader(screen);
    screen.append(header);

    const label = blessed.text({
      top: HEADER_HEIGHT + 1, left: 2, tags: true,
      content:
        '{cyan-fg}{bold}Create a Flashcard{/bold}{/cyan-fg}\n\n' +
        `{yellow-fg}Question: ${front}{/yellow-fg}\n\n` +
        '{gray-fg}Answer (back of card):{/gray-fg}',
    });
    screen.append(label);

    const input = blessed.textbox({
      top: HEADER_HEIGHT + 7, left: 2, width: '80%', height: 3,
      border: { type: 'line' },
      style: { border: { fg: 'green' }, focus: { border: { fg: 'green' } } },
      inputOnFocus: true, keys: true,
    });
    screen.append(input);
    input.focus();
    screen.render();

    input.key(['escape'], () => navigate('menu'));
    input.once('submit', async (value) => {
      if (!value?.trim()) { showBack(deckId, front); return; }
      await createCard(deckId, 'flashcard', front, value.trim(), { tags: ['manual'] }).catch(console.error);
      await addXp(5).catch(console.error);
      showSuccess(deckId, front, value.trim());
    });
    input.readInput();
  }

  function showSuccess(_deckId, front, back) {
    screen.children.slice().forEach(c => c.destroy());

    const header = createHeader(screen);
    screen.append(header);

    const info = blessed.box({
      top: HEADER_HEIGHT, left: 0, width: '100%', height: `100%-${HEADER_HEIGHT}`,
      tags: true, padding: { left: 2, top: 1 },
      content:
        '{green-fg}{bold}Flashcard Created!{/bold}{/green-fg}\n\n' +
        `{gray-fg}Front: ${front}{/gray-fg}\n` +
        `{gray-fg}Back: ${back}{/gray-fg}\n\n` +
        '{cyan-fg}+5 XP earned{/cyan-fg}\n',
    });
    screen.append(info);

    const actions = blessed.list({
      top: HEADER_HEIGHT + 8, left: 2, width: '40%', height: 4,
      items: ['Create Another Card', 'Back to Menu'],
      keys: true, vi: true, mouse: true,
      style: {
        selected: { bg: 'blue', fg: 'white', bold: true },
        item: { fg: 'white' },
      },
    });
    screen.append(actions);
    actions.focus();
    screen.render();

    actions.on('select', (_, index) => {
      if (index === 0) showDeckSelect();
      else navigate('menu');
    });
  }

  showDeckSelect();
}
