import blessed from 'neo-blessed';
import { createHeader, HEADER_HEIGHT } from '../components/header.js';
import { getLeaderboard, getUserProfile, getPublicDecks, saveDeck } from '../db/queries.js';
import { calculateLevel, getLevelTitle } from '../engine/xp.js';
import { supabase } from '../db/connection.js';

export async function renderSocial(screen, navigate) {
  async function showLeaderboard() {
    screen.children.slice().forEach(c => c.destroy());

    const header = createHeader(screen);
    screen.append(header);

    const label = blessed.text({
      top: HEADER_HEIGHT + 1, left: 2, tags: true,
      content: '{cyan-fg}{bold}Leaderboard{/bold}{/cyan-fg}  {gray-fg}Top players by XP  (ESC to go back){/gray-fg}',
    });
    screen.append(label);

    const loading = blessed.text({
      top: HEADER_HEIGHT + 3, left: 2, tags: true,
      content: '{gray-fg}Loading...{/gray-fg}',
    });
    screen.append(loading);
    screen.render();

    const [rows, { data: { user } }] = await Promise.all([
      getLeaderboard(20),
      supabase.auth.getUser(),
    ]);

    loading.destroy();

    const items = rows.map((row, i) => {
      const levelInfo = calculateLevel(row.total_xp);
      const isYou = row.user_id === user.id;
      const rank = i + 1;
      const name = row.username || 'Anonymous';
      return `${rank}. ${name}${isYou ? ' (you)' : ''}  Lv.${levelInfo.level}  ${row.total_xp} XP  ${row.current_streak}d streak`;
    });

    const list = blessed.list({
      top: HEADER_HEIGHT + 3, left: 2, width: '100%-4',
      height: `100%-${HEADER_HEIGHT + 5}`,
      items,
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
    list.on('select', (_, index) => showProfile(rows[index]));
  }

  async function showProfile(row) {
    screen.children.slice().forEach(c => c.destroy());

    const header = createHeader(screen);
    screen.append(header);

    const decks = await getPublicDecks(row.user_id);
    const levelInfo = calculateLevel(row.total_xp);
    const title = getLevelTitle(levelInfo.level);
    const { data: { user } } = await supabase.auth.getUser();
    const isOwnProfile = row.user_id === user.id;

    const info = blessed.box({
      top: HEADER_HEIGHT, left: 0, width: '55%', height: `100%-${HEADER_HEIGHT}`,
      tags: true, padding: { left: 2, top: 1 },
      content:
        `{cyan-fg}{bold}${row.username || 'Anonymous'}{/bold}{/cyan-fg}\n\n` +
        `{yellow-fg}Lv.${levelInfo.level}{/yellow-fg} {gray-fg}${title}{/gray-fg}\n` +
        `XP: {bold}${row.total_xp}{/bold}\n` +
        `Streak: {red-fg}${row.current_streak} days{/red-fg}\n` +
        `Cards reviewed: {bold}${row.total_cards_reviewed}{/bold}\n` +
        `Sessions: {bold}${row.total_sessions}{/bold}\n\n` +
        `{cyan-fg}Public Decks (${decks.length}){/cyan-fg}`,
    });
    screen.append(info);

    const deckItems = decks.length > 0
      ? decks.map(d => `${d.name}  (${d.card_count} cards)`)
      : ['No public decks'];

    const deckList = blessed.list({
      top: HEADER_HEIGHT + 10, left: 2, width: '53%',
      height: `100%-${HEADER_HEIGHT + 12}`,
      items: deckItems,
      keys: true, vi: true, mouse: true,
      style: {
        selected: decks.length > 0 ? { bg: 'blue', fg: 'white' } : { fg: 'gray' },
        item: { fg: 'white' },
      },
    });
    screen.append(deckList);

    const actions = blessed.list({
      top: HEADER_HEIGHT + 3, left: '57%', width: '38%',
      height: 5,
      items: ['Back to Leaderboard'],
      keys: true, vi: true, mouse: true,
      border: { type: 'line' },
      style: {
        border: { fg: 'gray' },
        selected: { bg: 'blue', fg: 'white' },
        item: { fg: 'white' },
      },
    });
    screen.append(actions);

    deckList.focus();
    screen.render();

    actions.key(['escape'], () => showLeaderboard());
    actions.on('select', () => showLeaderboard());

    deckList.key(['escape'], () => showLeaderboard());
    deckList.key(['tab'], () => { actions.focus(); screen.render(); });
    actions.key(['tab'], () => { deckList.focus(); screen.render(); });

    if (!isOwnProfile && decks.length > 0) {
      deckList.on('select', (_, index) => saveDeckPrompt(decks[index], row));
    }
  }

  async function saveDeckPrompt(deck, row) {
    screen.children.slice().forEach(c => c.destroy());

    const box = blessed.box({
      top: 'center', left: 'center', width: '55%', height: 9,
      border: { type: 'line' },
      style: { border: { fg: 'cyan' } },
      tags: true,
      content:
        `{cyan-fg}{bold}Save Deck?{/bold}{/cyan-fg}\n\n` +
        `"{bold}${deck.name}{/bold}" by ${row.username || 'Anonymous'}\n` +
        `${deck.card_count} cards\n\n` +
        'This will copy it to your library.\n\n' +
        'Press {bold}y{/bold} to save, {bold}n{/bold} to cancel',
    });
    screen.append(box);
    box.focus();
    screen.render();

    box.once('keypress', async (ch) => {
      if (ch === 'y') {
        await saveDeck(deck.id).catch(console.error);
        showSaveSuccess(deck, row);
      } else {
        showProfile(row);
      }
    });
  }

  function showSaveSuccess(deck, row) {
    screen.children.slice().forEach(c => c.destroy());

    const box = blessed.box({
      top: 'center', left: 'center', width: '50%', height: 7,
      border: { type: 'line' },
      style: { border: { fg: 'green' } },
      tags: true,
      content:
        `{green-fg}{bold}Deck Saved!{/bold}{/green-fg}\n\n` +
        `"${deck.name}" added to your library.\n\n` +
        '{gray-fg}Press any key to go back{/gray-fg}',
    });
    screen.append(box);
    box.focus();
    screen.render();

    box.once('keypress', () => showProfile(row));
  }

  showLeaderboard();
}
