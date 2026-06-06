import { renderAuth } from "./screens/auth.js";
import { renderMenu } from "./screens/menu.js";
import { renderCreate } from "./screens/create-card.js";
import { renderDecks } from "./screens/decks.js";
import { renderDeck } from "./screens/deck.js";
import { renderReview } from "./screens/review.js";

const routes = {
  auth: renderAuth,
  menu: renderMenu,
  create: renderCreate,
  decks: renderDecks,
  deck: renderDeck,
  review: renderReview,
};

// Returns a navigate(name, props) function that clears the screen and renders a
// route. `props` is passed through to the screen so we can carry context like
// the selected deck between screens.
export function createNavigate(screen) {
  function navigate(name, props = {}) {
    // Tear down whatever is currently mounted.
    for (const child of [...screen.children]) screen.remove(child);
    screen.realloc();

    const render = routes[name];
    if (!render) throw new Error(`Unknown route: ${name}`);
    render(screen, navigate, props);
    screen.render();
  }
  return navigate;
}
