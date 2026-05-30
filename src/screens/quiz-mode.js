import blessed from 'neo-blessed';
import { createHeader, HEADER_HEIGHT } from '../components/header.js';
import { getMcqCards, addXp, updateStreak, incrementSessionCount } from '../db/queries.js';
import { XP_VALUES } from '../engine/xp.js';

export async function renderQuizMode(screen, navigate) {
  const header = createHeader(screen);
  screen.append(header);

  const content = blessed.box({
    top: HEADER_HEIGHT, left: 0, width: '100%', height: `100%-${HEADER_HEIGHT}`,
    tags: true, padding: { left: 2, right: 2, top: 1 },
  });
  screen.append(content);
  content.setContent('{gray-fg}Loading quiz...{/gray-fg}');
  screen.render();

  const questions = await getMcqCards(null, 10);
  if (questions.length > 0) updateStreak().catch(console.error);

  if (questions.length === 0) {
    content.setContent(
      '{yellow-fg}{bold}No Quiz Questions{/bold}{/yellow-fg}\n\nCreate some MCQ cards first.\n\n{gray-fg}Press ESC to go back{/gray-fg}'
    );
    content.key(['escape'], () => navigate('menu'));
    content.focus();
    screen.render();
    return;
  }

  let currentIndex = 0;
  let score = 0;
  let xpEarned = 0;

  content.key(['escape'], () => navigate('menu'));

  function renderQuestion() {
    content.children.slice().forEach(c => c.destroy());
    content.setContent('');

    if (currentIndex >= questions.length) {
      incrementSessionCount().catch(console.error);
      const accuracy = Math.round((score / questions.length) * 100);
      content.setContent(
        '{green-fg}{bold}Quiz Complete!{/bold}{/green-fg}\n\n' +
        `Score: {green-fg}{bold}${score}/${questions.length}{/bold}{/green-fg} (${accuracy}%)\n` +
        `XP earned: {yellow-fg}{bold}+${xpEarned}{/bold}{/yellow-fg}\n\n` +
        '{gray-fg}Press ESC to go back{/gray-fg}'
      );
      screen.render();
      return;
    }

    const q = questions[currentIndex];
    const choices = Array.isArray(q.choices) ? q.choices : JSON.parse(q.choices || '[]');

    const info = blessed.text({
      top: 0, left: 0, tags: true,
      content: `{magenta-fg}{bold}Quiz{/bold}{/magenta-fg}  {gray-fg}Q${currentIndex + 1}/${questions.length} | Score: ${score}{/gray-fg}`,
    });
    content.append(info);

    const question = blessed.text({
      top: 2, left: 0, width: '100%-4', tags: true,
      content: `{white-fg}{bold}${q.front}{/bold}{/white-fg}`,
    });
    content.append(question);

    const list = blessed.list({
      top: 5, left: 0, width: '80%',
      height: choices.length + 2,
      items: choices,
      keys: true, vi: true, mouse: true,
      border: { type: 'line' },
      style: {
        border: { fg: 'gray' },
        selected: { bg: 'blue', fg: 'white' },
        item: { fg: 'white' },
      },
    });
    content.append(list);
    list.focus();
    screen.render();

    list.once('select', async (_, index) => {
      const isCorrect = index === q.correct_choice;
      if (isCorrect) {
        score++;
        await addXp(XP_VALUES.QUIZ_CORRECT).catch(console.error);
        xpEarned += XP_VALUES.QUIZ_CORRECT;
      }

      list.destroy();
      const feedback = blessed.text({
        top: 5, left: 0, tags: true,
        content: isCorrect
          ? `{green-fg}{bold}Correct! +${XP_VALUES.QUIZ_CORRECT} XP{/bold}{/green-fg}\n\n{gray-fg}Press Enter to continue{/gray-fg}`
          : `{red-fg}{bold}Incorrect{/bold}{/red-fg}\n{green-fg}Correct answer: ${choices[q.correct_choice]}{/green-fg}\n\n{gray-fg}Press Enter to continue{/gray-fg}`,
      });
      content.append(feedback);
      content.focus();
      screen.render();

      content.once('keypress', (_ch, key) => {
        if (key.name === 'return' || key.name === 'enter') {
          currentIndex++;
          renderQuestion();
        }
      });
    });
  }

  renderQuestion();
}
