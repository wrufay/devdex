import blessed from 'neo-blessed';
import { createHeader, HEADER_HEIGHT } from '../components/header.js';
import {
  getUserProgress, getDueCardCount, getTotalCardCount,
  getMasteredCardCount, getUpcomingReviewCounts, getAllDecks,
} from '../db/queries.js';
import { calculateLevel, getLevelTitle } from '../engine/xp.js';

export async function renderDashboard(screen, navigate) {
  const header = createHeader(screen);
  screen.append(header);

  const content = blessed.box({
    top: HEADER_HEIGHT, left: 0, width: '100%', height: `100%-${HEADER_HEIGHT}`,
    tags: true, padding: { left: 2, right: 2, top: 1 },
  });
  screen.append(content);
  content.setContent('{gray-fg}Loading...{/gray-fg}');
  content.focus();
  screen.render();

  const [progress, dueCount, totalCards, mastered, upcoming, decks] = await Promise.all([
    getUserProgress(), getDueCardCount(), getTotalCardCount(),
    getMasteredCardCount(), getUpcomingReviewCounts(), getAllDecks(),
  ]);

  const levelInfo = calculateLevel(progress.total_xp);
  const title = getLevelTitle(levelInfo.level);
  const barWidth = 25;
  const filled = Math.round((levelInfo.currentXp / levelInfo.xpToNext) * barWidth);
  const bar = '#'.repeat(filled) + '-'.repeat(barWidth - filled);
  const accuracy = totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0;

  content.setContent(
    '{cyan-fg}{bold}Dashboard & Stats{/bold}{/cyan-fg}\n\n' +
    `{yellow-fg}{bold}Level ${levelInfo.level}{/bold}{/yellow-fg} {gray-fg}- ${title}{/gray-fg}\n` +
    `{green-fg}${bar}{/green-fg} {gray-fg}${levelInfo.currentXp}/${levelInfo.xpToNext} XP{/gray-fg}\n` +
    `{red-fg}Streak: ${progress.current_streak} day${progress.current_streak !== 1 ? 's' : ''}{/red-fg}  {gray-fg}(Best: ${progress.longest_streak}){/gray-fg}\n\n` +
    '{green-fg}{bold}Today{/bold}{/green-fg}\n' +
    `  Cards due: {bold}${dueCount}{/bold}\n` +
    `  Total XP: {yellow-fg}{bold}${progress.total_xp}{/bold}{/yellow-fg}\n\n` +
    '{cyan-fg}{bold}All Time{/bold}{/cyan-fg}\n' +
    `  Reviews: {bold}${progress.total_cards_reviewed}{/bold}\n` +
    `  Sessions: {bold}${progress.total_sessions}{/bold}\n` +
    `  Mastered: {green-fg}{bold}${mastered}/${totalCards}{/bold}{/green-fg}${totalCards > 0 ? ` (${accuracy}%)` : ''}\n` +
    `  Decks: {bold}${decks.length}{/bold}\n\n` +
    '{yellow-fg}{bold}Upcoming Reviews{/bold}{/yellow-fg}\n' +
    `  Tomorrow: {bold}${upcoming.tomorrow}{/bold} cards\n` +
    `  This week: {bold}${upcoming.thisWeek}{/bold} cards\n\n` +
    '{gray-fg}Press ESC to go back{/gray-fg}'
  );

  content.key(['escape', 'return'], () => navigate('menu'));
  screen.render();
}
