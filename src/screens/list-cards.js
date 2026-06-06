import blessed from "neo-blessed";
import { listCards, deleteCard } from "../db/queries.js";

export async function renderList(screen, navigate) {
  const box = blessed.box({
    top: "center",
    left: "center",
    width: "70%",
    height: "80%",
    border: { type: "double" },
    style: { border: { fg: "blue" } },
    tags: true,
    label: " My cards ",
  });

  const status = blessed.text({
    parent: box,
    bottom: 1,
    left: 2,
    right: 2,
    tags: true,
    content: "{gray-fg}Enter/d = delete  ·  Esc = back{/gray-fg}",
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
      cards = await listCards();
    } catch (err) {
      status.setContent(`{red-fg}${err.message}{/red-fg}`);
      screen.render();
      return;
    }
    if (cards.length === 0) {
      list.setItems([
        "{gray-fg}No cards yet. Create one from the menu.{/gray-fg}",
      ]);
    } else {
      list.setItems(
        cards.map(
          (c) => `{bold}${c.front}{/bold}  {gray-fg}→ ${c.back}{/gray-fg}`
        )
      );
    }
    list.select(0);
    screen.render();
  }

  async function removeSelected() {
    const index = list.selected;
    const card = cards[index];
    if (!card) return;
    status.setContent("{gray-fg}Deleting...{/gray-fg}");
    screen.render();
    try {
      await deleteCard(card.id);
      status.setContent(
        "{green-fg}Deleted.{/green-fg} {gray-fg}Enter/d = delete · Esc = back{/gray-fg}"
      );
      await refresh();
    } catch (err) {
      status.setContent(`{red-fg}${err.message}{/red-fg}`);
      screen.render();
    }
  }

  list.key(["escape"], () => navigate("menu"));
  list.key(["d"], removeSelected);
  list.on("select", removeSelected);

  list.focus();
  await refresh();
}
