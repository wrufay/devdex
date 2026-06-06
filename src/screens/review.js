import blessed from "neo-blessed";
import { dueCards, applyReview } from "../db/queries.js";
import { schedule } from "../engine/sm2.js";

// Rating keys mapped to SM-2 quality scores.
const RATINGS = [
  { key: "1", label: "Again", quality: 0, color: "red" },
  { key: "2", label: "Hard", quality: 3, color: "yellow" },
  { key: "3", label: "Good", quality: 4, color: "green" },
  { key: "4", label: "Easy", quality: 5, color: "cyan" },
];

export async function renderReview(screen, navigate) {
  const box = blessed.box({
    top: "center",
    left: "center",
    width: "70%",
    height: "60%",
    border: { type: "double" },
    style: { border: { fg: "blue" } },
    tags: true,
    label: " Review ",
  });

  const content = blessed.text({
    parent: box,
    top: 2,
    left: 2,
    right: 2,
    bottom: 3,
    tags: true,
    align: "center",
    valign: "middle",
  });

  const footer = blessed.text({
    parent: box,
    bottom: 1,
    left: 2,
    right: 2,
    tags: true,
    align: "center",
  });

  screen.append(box);
  box.focus();

  let cards;
  try {
    cards = await dueCards();
  } catch (err) {
    content.setContent(`{red-fg}${err.message}{/red-fg}`);
    footer.setContent("{gray-fg}Esc = back{/gray-fg}");
    box.key(["escape"], () => navigate("menu"));
    screen.render();
    return;
  }

  if (cards.length === 0) {
    content.setContent(
      "{green-fg}{bold}All caught up!{/bold}{/green-fg}\n\nNo cards are due for review."
    );
    footer.setContent("{gray-fg}Esc = back to menu{/gray-fg}");
    box.key(["escape"], () => navigate("menu"));
    screen.render();
    return;
  }

  let index = 0;
  let showingBack = false;

  function showFront() {
    showingBack = false;
    const card = cards[index];
    content.setContent(
      `{gray-fg}Card ${index + 1} of ${cards.length}{/gray-fg}\n\n` +
        `{bold}${card.front}{/bold}`
    );
    footer.setContent(
      "{gray-fg}Space/Enter = show answer  ·  Esc = back{/gray-fg}"
    );
    screen.render();
  }

  function showBack() {
    showingBack = true;
    const card = cards[index];
    content.setContent(
      `{gray-fg}Card ${index + 1} of ${cards.length}{/gray-fg}\n\n` +
        `{bold}${card.front}{/bold}\n\n{cyan-fg}${card.back}{/cyan-fg}`
    );
    footer.setContent(
      RATINGS.map(
        (r) => `{${r.color}-fg}[${r.key}] ${r.label}{/${r.color}-fg}`
      ).join("   ")
    );
    screen.render();
  }

  async function rate(quality) {
    const card = cards[index];
    footer.setContent("{gray-fg}Saving...{/gray-fg}");
    screen.render();
    try {
      await applyReview(card.id, schedule(card, quality));
    } catch (err) {
      footer.setContent(`{red-fg}${err.message}{/red-fg}`);
      screen.render();
      return;
    }
    index += 1;
    if (index >= cards.length) {
      content.setContent(
        "{green-fg}{bold}Session complete!{/bold}{/green-fg}\n\nYou reviewed every due card."
      );
      footer.setContent("{gray-fg}Esc = back to menu{/gray-fg}");
      screen.render();
      return;
    }
    showFront();
  }

  box.key(["escape"], () => navigate("menu"));
  box.key(["space", "enter"], () => {
    if (!showingBack) showBack();
  });
  for (const r of RATINGS) {
    box.key([r.key], () => {
      if (showingBack) rate(r.quality);
    });
  }

  showFront();
}
