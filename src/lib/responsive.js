// Make an element's height responsive: it grows up to `max` rows, but shrinks to
// fit when the terminal is shorter. Updates live on resize, and removes its own
// listener when the element is detached (navigate() removes it), so nothing leaks.
export function capHeight(screen, el, max) {
  const apply = () => {
    el.height = Math.min(max, screen.height - 2); // leave a row top + bottom
  };
  apply();

  const onResize = () => {
    apply();
    screen.render();
  };
  screen.on("resize", onResize);
  el.on("detach", () => screen.removeListener("resize", onResize));
}
