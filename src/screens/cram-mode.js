import blessed from 'neo-blessed';
import { createHeader, HEADER_HEIGHT } from '../components/header.js';
import { getAllDecks, getCardsByDeck } from '../db/queries.js';

export async function renderCramMode(screen, navigate) {
  async function showDeckSelect() {
    screen.children.slice().forEach(c => c.destroy());

    const header = createHeader(screen);
    screen.append(header);

    const decks = await getAllDecks();

    if (decks.length === 0) {
      const box = blessed.box({
        top: HEADER_HEIGHT, left: 0, width: '100%', height: `100%-${HEADER_HEIGHT}`,
        tags: true, padding: { left: 2, top: 1 },
        content: '{red-fg}No decks found. Create some cards first.{/red-fg}\n\n{gray-fg}Press ESC to go back{/gray-fg}',
      });
      box.key(['escape'], () => navigate('menu'));
      box.focus();
      screen.append(box);
      screen.render();
      return;
    }

    const label = blessed.text({
      top: HEADER_HEIGHT + 1, left: 2, tags: true,
      content: '{magenta-fg}{bold}Cram Mode{/bold}{/magenta-fg}  {gray-fg}Study all cards until you know them all!{/gray-fg}',
    });
    screen.append(label);

    const list = blessed.list({
      top: HEADER_HEIGHT + 3, left: 2, width: '60%',
      height: `100%-${HEADER_HEIGHT + 4}`,
      items: [...decks.map(d => `${d.name}  (${d.card_count} cards)`), '<- Back to Menu'],
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
    list.on('select', async (_, index) => {
      if (index === decks.length) { navigate('menu'); return; }
      const deck = decks[index];
      const allCards = (await getCardsByDeck(deck.id)).filter(c => c.type !== 'mcq');
      if (allCards.length === 0) { navigate('menu'); return; }
      const shuffled = [...allCards].sort(() => Math.random() - 0.5);
      startCram(deck, shuffled);
    });
  }

  function startCram(deck, initialCards) {
    let cards = initialCards;
    let currentIndex = 0;
    let incorrectCards = [];
    let round = 1;
    let firstTryCorrect = 0;
    const originalCount = initialCards.length;

    function showCard() {
      screen.children.slice().forEach(c => c.destroy());

      if (currentIndex >= cards.length) {
        if (incorrectCards.length === 0) {
          showComplete();
          return;
        }
        cards = [...incorrectCards].sort(() => Math.random() - 0.5);
        incorrectCards = [];
        currentIndex = 0;
        round++;
        showCard();
        return;
      }

      const header = createHeader(screen);
      screen.append(header);

      const card = cards[currentIndex];

      const info = blessed.text({
        top: HEADER_HEIGHT + 1, left: 2, tags: true,
        content:
          `{magenta-fg}{bold}Cram Mode{/bold}{/magenta-fg} {gray-fg}- ${deck.name}{/gray-fg}\n` +
          `{gray-fg}Round ${round} • Card ${currentIndex + 1}/${cards.length}${incorrectCards.length > 0 ? ` • ${incorrectCards.length} to review` : ''}{/gray-fg}`,
      });
      screen.append(info);

      const front = blessed.box({
        top: HEADER_HEIGHT + 4, left: 2, width: '100%-4', height: 5,
        border: { type: 'line' },
        style: { border: { fg: 'cyan' } },
        tags: true, padding: { left: 1 },
        content: card.front,
      });
      screen.append(front);

      const hint = blessed.text({
        top: HEADER_HEIGHT + 10, left: 2, tags: true,
        content: '{gray-fg}Press Enter to reveal answer  |  ESC to quit{/gray-fg}',
      });
      screen.append(hint);
      front.focus();
      screen.render();

      front.key(['escape'], () => navigate('menu'));
      front.once('keypress', (_ch, key) => {
        if (key.name === 'enter' || key.name === 'return') showAnswer(card);
      });
    }

    function showAnswer(card) {
      screen.children.slice().forEach(c => c.destroy());

      const header = createHeader(screen);
      screen.append(header);

      const info = blessed.text({
        top: HEADER_HEIGHT + 1, left: 2, tags: true,
        content:
          `{magenta-fg}{bold}Cram Mode{/bold}{/magenta-fg} {gray-fg}- ${deck.name}{/gray-fg}\n` +
          `{gray-fg}Round ${round} • Card ${currentIndex + 1}/${cards.length}{/gray-fg}`,
      });
      screen.append(info);

      const front = blessed.box({
        top: HEADER_HEIGHT + 4, left: 2, width: '100%-4', height: 4,
        border: { type: 'line' }, style: { border: { fg: 'cyan' } },
        tags: true, padding: { left: 1 }, content: `{cyan-fg}${card.front}{/cyan-fg}`,
      });
      screen.append(front);

      const back = blessed.box({
        top: HEADER_HEIGHT + 9, left: 2, width: '100%-4', height: 4,
        border: { type: 'line' }, style: { border: { fg: 'green' } },
        tags: true, padding: { left: 1 }, content: `{green-fg}${card.back}{/green-fg}`,
      });
      screen.append(back);

      const actions = blessed.list({
        top: HEADER_HEIGHT + 14, left: 2, width: '40%', height: 4,
        items: ['[Y] I know this', '[N] Review again'],
        keys: true, vi: true, mouse: true,
        style: {
          selected: { bg: 'blue', fg: 'white', bold: true },
          item: { fg: 'white' },
        },
      });
      screen.append(actions);
      actions.focus();
      screen.render();

      actions.key(['escape'], () => navigate('menu'));
      actions.once('select', (_, index) => {
        if (index === 0) {
          if (round === 1) firstTryCorrect++;
        } else {
          incorrectCards.push(card);
        }
        currentIndex++;
        showCard();
      });
    }

    function showComplete() {
      screen.children.slice().forEach(c => c.destroy());

      const header = createHeader(screen);
      screen.append(header);

      const accuracy = originalCount > 0 ? Math.round((firstTryCorrect / originalCount) * 100) : 0;

      const info = blessed.box({
        top: HEADER_HEIGHT, left: 0, width: '100%', height: `100%-${HEADER_HEIGHT}`,
        tags: true, padding: { left: 2, top: 1 },
        content:
          '{green-fg}{bold}Cram Session Complete!{/bold}{/green-fg}\n\n' +
          `{cyan-fg}Deck: ${deck.name}{/cyan-fg}\n` +
          `Total cards: {bold}${originalCount}{/bold}\n` +
          `Rounds needed: {bold}${round}{/bold}\n` +
          `First-try accuracy: {bold}${accuracy}%{/bold}\n`,
      });
      screen.append(info);

      const actions = blessed.list({
        top: HEADER_HEIGHT + 8, left: 2, width: '40%', height: 4,
        items: ['Cram Another Deck', 'Back to Menu'],
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

    showCard();
  }

  showDeckSelect();
}
