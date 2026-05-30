import blessed from 'neo-blessed';
import { createHeader, HEADER_HEIGHT } from '../components/header.js';
import { getDueCards, processReview } from '../engine/scheduler.js';
import { updateStreak, incrementSessionCount } from '../db/queries.js';

export async function renderStudySession(screen, navigate) {
  const header = createHeader(screen);
  screen.append(header);

  const content = blessed.box({
    top: HEADER_HEIGHT, left: 0, width: '100%', height: `100%-${HEADER_HEIGHT}`,
    tags: true, padding: { left: 2, right: 2, top: 1 },
  });
  screen.append(content);
  content.focus();

  content.setContent('{gray-fg}Loading cards...{/gray-fg}');
  screen.render();

  const cards = await getDueCards(30);

  if (cards.length > 0) updateStreak().catch(console.error);

  let currentIndex = 0;
  let showAnswer = false;
  let sessionXp = 0;
  let sessionCorrect = 0;

  content.key(['escape'], () => navigate('menu'));

  function render() {
    if (cards.length === 0) {
      content.setContent(
        '{green-fg}{bold}No cards due!{/bold}{/green-fg}\n\n' +
        'You\'re all caught up. Come back later.\n\n' +
        '{gray-fg}Press ESC to go back{/gray-fg}'
      );
      screen.render();
      return;
    }

    if (currentIndex >= cards.length) {
      const accuracy = Math.round((sessionCorrect / cards.length) * 100);
      incrementSessionCount().catch(console.error);
      content.setContent(
        '{green-fg}{bold}Session Complete!{/bold}{/green-fg}\n\n' +
        `Cards reviewed: {bold}${cards.length}{/bold}\n` +
        `Correct: {green-fg}{bold}${sessionCorrect}/${cards.length}{/bold}{/green-fg} (${accuracy}%)\n` +
        `XP earned: {yellow-fg}{bold}+${sessionXp}{/bold}{/yellow-fg}\n\n` +
        '{gray-fg}Press Enter or ESC to continue{/gray-fg}'
      );
      content.removeAllListeners('keypress');
      content.key(['enter', 'return', 'escape'], () => navigate('menu'));
      screen.render();
      return;
    }

    const card = cards[currentIndex];
    const cardType = card.type === 'elaboration' ? 'Deep Think' : 'Flashcard';

    if (!showAnswer) {
      content.setContent(
        `{blue-fg}${card.deck_name}{/blue-fg}  {gray-fg}[${currentIndex + 1}/${cards.length}] ${cardType}{/gray-fg}\n\n` +
        `{white-fg}{bold}${card.front}{/bold}{/white-fg}\n\n` +
        '{gray-fg}Press Space or Enter to reveal answer  |  ESC to quit{/gray-fg}\n' +
        `{gray-fg}XP: +${sessionXp} this session{/gray-fg}`
      );
    } else {
      content.setContent(
        `{blue-fg}${card.deck_name}{/blue-fg}  {gray-fg}[${currentIndex + 1}/${cards.length}] ${cardType}{/gray-fg}\n\n` +
        `{white-fg}{bold}${card.front}{/bold}{/white-fg}\n\n` +
        `{green-fg}${card.back}{/green-fg}\n\n` +
        '{bold}How well did you know this?{/bold}\n' +
        '{red-fg}1:Again{/red-fg}  {yellow-fg}2:Hard{/yellow-fg}  {white-fg}3:Good{/white-fg}  {green-fg}4:Easy{/green-fg}  {cyan-fg}5:Perfect{/cyan-fg}\n\n' +
        `{gray-fg}XP: +${sessionXp} this session{/gray-fg}`
      );
    }
    screen.render();
  }

  content.on('keypress', async (ch) => {
    if (currentIndex >= cards.length) return;

    if (!showAnswer) {
      if (ch === ' ' || ch === '\r' || ch === '\n') {
        showAnswer = true;
        render();
      }
      return;
    }

    const rating = parseInt(ch);
    if (rating >= 1 && rating <= 5) {
      const { xpEarned } = await processReview(cards[currentIndex].id, rating).catch(() => ({ xpEarned: 0 }));
      sessionXp += xpEarned;
      if (rating >= 3) sessionCorrect++;
      currentIndex++;
      showAnswer = false;
      render();
    }
  });

  render();
}
