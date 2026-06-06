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

  const box = blessed.box({
    top: "center",
    left: "center",
    width: "50%",
    height: 14,
    border: { type: "double" },
    style: { border: { fg: "red" } },
    tags: true,
    label: " Flashcards ",
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
      `Review due cards  {gray-fg}(${dueCount} due){/gray-fg}`,
      "Create a card",
      "My cards",
      "Log out",
      "Quit",
    ],
  });

  box.setContent(
    `{cyan-fg}{bold}Signed in as ${name}{/bold}{/cyan-fg}\n` +
      `{gray-fg}Use arrow keys + Enter. Ctrl-C to quit.{/gray-fg}`
  );

  screen.append(box);
  list.focus();

  list.on("select", async (_item, index) => {
    switch (index) {
      case 0:
        navigate("review");
        break;
      case 1:
        navigate("create");
        break;
      case 2:
        navigate("list");
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
