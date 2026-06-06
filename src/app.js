import { renderAuth } from "./screens/auth.js";
import { renderMenu } from "./screens/menu.js";
import { renderCreate } from "./screens/create-card.js";
import { renderList } from "./screens/list-cards.js";
import { renderReview } from "./screens/review.js";

const routes = {
  auth: renderAuth,
  menu: renderMenu,
  create: renderCreate,
  list: renderList,
  review: renderReview,
};

// Returns a navigate(name) function that clears the screen and renders a route.
export function createNavigate(screen) {
  function navigate(name) {
    // Tear down whatever is currently mounted.
    for (const child of [...screen.children]) screen.remove(child);
    screen.realloc();

    const render = routes[name];
    if (!render) throw new Error(`Unknown route: ${name}`);
    render(screen, navigate);
    screen.render();
  }
  return navigate;
}
