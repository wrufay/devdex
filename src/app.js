import { renderAuth } from './screens/auth.js';
import { renderMainMenu } from './screens/main-menu.js';
import { renderStudySession } from './screens/study-session.js';
import { renderQuizMode } from './screens/quiz-mode.js';
import { renderDashboard } from './screens/dashboard.js';
import { renderDeckBrowser } from './screens/deck-browser.js';
import { renderCreateCard } from './screens/create-card.js';
import { renderCramMode } from './screens/cram-mode.js';

const screens = {
  auth: renderAuth,
  menu: renderMainMenu,
  study: renderStudySession,
  quiz: renderQuizMode,
  cram: renderCramMode,
  dashboard: renderDashboard,
  decks: renderDeckBrowser,
  create: renderCreateCard,
};

export function createNavigate(screen) {
  function navigate(name) {
    if (name === 'quit') {
      screen.destroy();
      process.exit(0);
    }

    screen.children.slice().forEach(c => c.destroy());

    const fn = screens[name];
    if (!fn) return;

    fn(screen, navigate).catch(err => {
      try { screen.destroy(); } catch (_) {}
      process.stderr.write(`\nError in ${name}: ${err?.stack || err}\n`);
      process.exit(1);
    });
  }

  return navigate;
}
