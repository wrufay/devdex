import blessed from "neo-blessed";
import { supabase } from "../db/connection.js";
import { dueCards } from "../db/queries.js";

export async function renderMenu(screen, navigate) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const name = user?.user_metadata?.user_name || user?.email || "you";

  let dueCount = 0;
  try {
    dueCount = (await dueCards()).length;
  } catch {}

  // Entire login container
  const box = blessed.box({
    top: "center",
    left: "center",
    width: "50%",
    height: 20,
    border: { type: "line" },
    style: { border: { fg: "cyan" } },
    tags: true,
    label: " tui_cards.git ",
  });

  const list = blessed.list({
    parent: box,
    top: 4,
    left: 2,
    right: 2,
    bottom: 1,
    keys: true,
    vi: true,
    tags: true,
    style: {
      selected: { bg: "blue", fg: "white" },
      item: { fg: "white" },
    },
    items: [
      `review due cards  {gray-fg}(${dueCount} due){/gray-fg}`,
      "new card",
      "my decks",
      "SIGN OUT",
      "QUIT",
    ],
  });

  box.setContent(
    `{cyan-fg}{bold}welcome back, ${name}{/bold}{/cyan-fg}\n` +
      `{gray-fg}arrow keys + Enter to select · Ctrl-C to quit{/gray-fg}`
  );

  screen.append(box);
  list.focus();

  list.on("select", async (_item, index) => {
    switch (index) {
      case 0:
        // Pick a deck to review (the decks screen offers an "all decks" option).
        navigate("decks", { pick: "review" });
        break;
      case 1:
        // Pick a deck to add the new card to.
        navigate("decks", { pick: "create" });
        break;
      case 2:
        navigate("decks");
        break;
      case 3:
        await supabase.auth.signOut();
        navigate("auth");
        break;
      case 4:
        screen.destroy();
        process.exit(0);
    }
  });

  screen.render();
}
