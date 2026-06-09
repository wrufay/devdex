import blessed from "neo-blessed";
import { listCards, deleteCard } from "../db/queries.js";
import { attachMarker } from "../lib/marker.js";

// A single deck's cards. Reached from the decks manager.
export async function renderDeck(screen, navigate, { deck }) {
  const box = blessed.box({
    top: "center",
    left: "center",
    width: "70%",
    height: "80%",
    border: { type: "line" },
    style: { border: { fg: "#3DA5D9" } },
    tags: true,
    label: ` ${deck.name} `,
  });

  const hint =
    "{gray-fg}n = new  ·  e = edit  ·  r = review  ·  d = delete  ·  Esc = back{/gray-fg}";
  const status = blessed.text({
    parent: box,
    bottom: 1,
    left: 2,
    right: 2,
    tags: true,
    content: hint,
  });

  const list = blessed.list({
    parent: box,
    top: 1,
    left: 2,
    right: 2,
    bottom: 2,
    keys: true,
    vi: true,
    tags: true,
    style: {
      selected: { bg: "#2364AA", fg: "white" },
      item: { fg: "white" },
    },
  });

  screen.append(box);
  const marker = attachMarker(screen, list);

  let cards = [];

  async function refresh() {
    try {
      cards = await listCards(deck.id);
    } catch (err) {
      status.setContent(`{red-fg}${err.message}{/red-fg}`);
      screen.render();
      return;
    }
    const labels =
      cards.length === 0
        ? ["{gray-fg}no cards yet. press n to add one.{/gray-fg}"]
        : cards.map(
            (c) => `{bold}${c.front}{/bold}  {gray-fg}→ ${c.back}{/gray-fg}`
          );
    marker.setItems(labels);
  }

  async function removeSelected() {
    const card = cards[list.selected];
    if (!card) return;
    status.setContent("{gray-fg}deleting...{/gray-fg}");
    screen.render();
    try {
      await deleteCard(card.id);
      await refresh();
      status.setContent(`{green-fg}deleted.{/green-fg} ${hint}`);
      screen.render();
    } catch (err) {
      status.setContent(`{red-fg}${err.message}{/red-fg}`);
      screen.render();
    }
  }

  list.key(["escape"], () => navigate("decks"));
  list.key(["n"], () => navigate("create", { deck }));
  list.key(["e"], () => {
    const card = cards[list.selected];
    if (card) navigate("create", { deck, card });
  });
  list.key(["r"], () => navigate("review", { deck }));
  list.key(["d"], removeSelected);

  list.focus();
  await refresh();
}
