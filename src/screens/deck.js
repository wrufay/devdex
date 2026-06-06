import blessed from "neo-blessed";
import { listCards, deleteCard } from "../db/queries.js";

// A single deck's cards. Reached from the decks manager.
export async function renderDeck(screen, navigate, { deck }) {
  const box = blessed.box({
    top: "center",
    left: "center",
    width: "70%",
    height: "80%",
    border: { type: "line" },
    style: { border: { fg: "cyan" } },
    tags: true,
    label: ` ☆ ${deck.name} `,
  });

  const hint =
    "{gray-fg}n = new card  ·  r = review deck  ·  d = delete card  ·  esc = back{/gray-fg}";
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
      selected: { bg: "blue", fg: "white" },
      item: { fg: "white" },
    },
  });

  screen.append(box);

  let cards = [];

  async function refresh() {
    try {
      cards = await listCards(deck.id);
    } catch (err) {
      status.setContent(`{red-fg}${err.message}{/red-fg}`);
      screen.render();
      return;
    }
    if (cards.length === 0) {
      list.setItems(["{gray-fg}no cards yet — press n to add one{/gray-fg}"]);
    } else {
      list.setItems(
        cards.map((c) => `{bold}${c.front}{/bold}  {gray-fg}→ ${c.back}{/gray-fg}`)
      );
    }
    list.select(0);
    screen.render();
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
    } catch (err) {
      status.setContent(`{red-fg}${err.message}{/red-fg}`);
      screen.render();
    }
  }

  list.key(["escape"], () => navigate("decks"));
  list.key(["n"], () => navigate("create", { deck }));
  list.key(["r"], () => navigate("review", { deck }));
  list.key(["d"], removeSelected);

  list.focus();
  await refresh();
}
