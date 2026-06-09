import blessed from "neo-blessed";
import { listDecks, createDeck, updateDeck, deleteDeck } from "../db/queries.js";

// The decks screen has three modes, set via the `pick` prop:
//   undefined  -> manage: Enter opens a deck, d deletes a deck
//   "create"   -> Enter chooses a deck to add a new card to
//   "review"   -> Enter chooses a deck to review (with an "all decks" option)
export async function renderDecks(screen, navigate, { pick } = {}) {
  const title =
    pick === "review"
      ? "pick a deck to review"
      : pick === "create"
        ? "pick a deck for your new card"
        : "my decks";

  const box = blessed.box({
    top: "center",
    left: "center",
    width: "70%",
    height: "80%",
    border: { type: "line" },
    style: { border: { fg: "cyan" } },
    tags: true,
    label: ` ${title} `,
  });

  const hint = pick
    ? "{gray-fg}Enter = choose  ·  n = new deck  ·  Esc = back{/gray-fg}"
    : "{gray-fg}Enter = open  ·  n = new deck  ·  e = rename  ·  d = delete  ·  Esc = back{/gray-fg}";
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

  const showAll = pick === "review"; // prepend an "all decks" row in review mode
  let decks = [];
  let armedId = null; // deck id pending delete confirmation

  async function refresh() {
    try {
      decks = await listDecks();
    } catch (err) {
      status.setContent(`{red-fg}${err.message}{/red-fg}`);
      screen.render();
      return;
    }

    const items = [];
    if (showAll) {
      const totalDue = decks.reduce((n, d) => n + d.due, 0);
      items.push(`{cyan-fg}all decks{/cyan-fg}  {gray-fg}(${totalDue} due){/gray-fg}`);
    }
    if (decks.length === 0 && !showAll) {
      items.push("{gray-fg}no decks yet. press n to create one.{/gray-fg}");
    } else {
      for (const d of decks) {
        items.push(
          `${d.name}  {gray-fg}(${d.total} cards · ${d.due} due){/gray-fg}`
        );
      }
    }
    list.setItems(items);
    list.select(0);
    screen.render();
  }

  // Map a list row index back to a deck (accounting for the "all decks" row).
  function deckAt(index) {
    if (decks.length === 0 && !showAll) return null;
    return showAll ? (index === 0 ? null : decks[index - 1]) : decks[index];
  }

  function newDeck() {
    const input = blessed.textbox({
      parent: box,
      bottom: 3,
      left: 2,
      right: 2,
      height: 3,
      border: { type: "line" },
      style: { border: { fg: "cyan" } },
      label: " new deck name ",
      inputOnFocus: true,
    });
    screen.render();
    input.focus();

    const close = () => {
      box.remove(input);
      list.focus();
      screen.render();
    };
    input.key(["escape"], close);
    input.on("submit", async () => {
      const name = input.getValue().trim();
      close();
      if (!name) return;
      try {
        await createDeck(name);
        await refresh();
      } catch (err) {
        status.setContent(`{red-fg}${err.message}{/red-fg}`);
        screen.render();
      }
    });
  }

  function renameDeck(deck) {
    const input = blessed.textbox({
      parent: box,
      bottom: 3,
      left: 2,
      right: 2,
      height: 3,
      border: { type: "line" },
      style: { border: { fg: "cyan" } },
      label: " rename deck ",
      inputOnFocus: true,
    });
    input.setValue(deck.name);
    screen.render();
    input.focus();

    const close = () => {
      box.remove(input);
      list.focus();
      screen.render();
    };
    input.key(["escape"], close);
    input.on("submit", async () => {
      const name = input.getValue().trim();
      close();
      if (!name || name === deck.name) return;
      try {
        await updateDeck(deck.id, name);
        await refresh();
      } catch (err) {
        status.setContent(`{red-fg}${err.message}{/red-fg}`);
        screen.render();
      }
    });
  }

  list.on("select", (_item, index) => {
    if (showAll && index === 0) {
      navigate("review", { all: true });
      return;
    }
    const deck = deckAt(index);
    if (!deck) return;
    if (pick === "review") navigate("review", { deck });
    else if (pick === "create") navigate("create", { deck });
    else navigate("deck", { deck });
  });

  list.key(["n"], newDeck);

  if (!pick) {
    list.key(["e"], () => {
      const deck = deckAt(list.selected);
      if (!deck) return;
      armedId = null; // cancel any pending delete
      renameDeck(deck);
    });

    list.key(["d"], async () => {
      const deck = deckAt(list.selected);
      if (!deck) return;
      if (armedId !== deck.id) {
        armedId = deck.id;
        status.setContent(
          `{red-fg}press d again to delete "${deck.name}" and its cards · Esc cancels{/red-fg}`
        );
        screen.render();
        return;
      }
      armedId = null;
      status.setContent("{gray-fg}deleting...{/gray-fg}");
      screen.render();
      try {
        await deleteDeck(deck.id);
        await refresh();
        status.setContent(hint);
        screen.render();
      } catch (err) {
        status.setContent(`{red-fg}${err.message}{/red-fg}`);
        screen.render();
      }
    });
  }

  list.key(["escape"], () => {
    if (armedId) {
      armedId = null;
      status.setContent(hint);
      screen.render();
      return;
    }
    navigate("menu");
  });

  list.focus();
  await refresh();
}
