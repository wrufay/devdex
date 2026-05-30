import blessed from 'neo-blessed';
import { getUserProgress } from '../db/queries.js';
import { supabase } from '../db/connection.js';
import { calculateLevel, getLevelTitle } from '../engine/xp.js';

export const HEADER_HEIGHT = 5;

export function createHeader(screen) {
  const header = blessed.box({
    top: 0, left: 0, width: '100%', height: HEADER_HEIGHT,
    border: { type: 'double' },
    style: { border: { fg: 'blue' } },
    tags: true,
    content: '{cyan-fg}{bold}Study Terminal{/bold}{/cyan-fg}',
  });

  Promise.all([getUserProgress(), supabase.auth.getUser()])
    .then(([progress, { data: { user } }]) => {
      const levelInfo = calculateLevel(progress.total_xp);
      const title = getLevelTitle(levelInfo.level);
      const username = user?.user_metadata?.user_name || user?.user_metadata?.full_name || user?.email || '';
      const barWidth = 20;
      const filled = Math.round((levelInfo.currentXp / levelInfo.xpToNext) * barWidth);
      const bar = '#'.repeat(filled) + '-'.repeat(barWidth - filled);

      header.setContent(
        `{cyan-fg}{bold}Study Terminal{/bold}{/cyan-fg}   {gray-fg}hey, ${username}{/gray-fg}\n` +
        `{yellow-fg}Lv.${levelInfo.level}{/yellow-fg} {gray-fg}${title}{/gray-fg}   {red-fg}Streak: ${progress.current_streak} day${progress.current_streak !== 1 ? 's' : ''}{/red-fg}\n` +
        `{green-fg}XP: ${levelInfo.currentXp}/${levelInfo.xpToNext}{/green-fg} {gray-fg}${bar}{/gray-fg}`
      );
      screen.render();
    })
    .catch(console.error);

  return header;
}
