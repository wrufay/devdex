import blessed from "neo-blessed";
import { supabase } from "../db/connection.js";
import { dueCards } from "../db/queries.js";
import { capHeight } from "../lib/responsive.js";

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
    height: 20,
    border: { type: "line" },
    style: { border: { fg: "#3DA5D9" } },
    tags: true,
    label: " devDex.git ",
  });

  // Menu rows. `null` = a blank spacer. Each real row is { label, run }.
  const rows = [
    {
      label: `Review now {gray-fg}(${dueCount} due){/gray-fg}`,
      run: () => navigate("decks", { pick: "review" }),
    },
    { label: "New card", run: () => navigate("decks", { pick: "create" }) },
    { label: "My decks", run: () => navigate("decks") },
    null,
    {
      label: "Sign out",
      run: async () => {
        await supabase.auth.signOut();
        navigate("auth");
      },
    },
    {
      label: "QUIT",
      run: () => {
        screen.destroy();
        process.exit(0);
      },
    },
  ];

  const MARKER = "ꕤ "; // shown in front of the selected row
  const PAD = " ".repeat(MARKER.length); // keep unselected rows aligned

  const list = blessed.list({
    parent: box,
    top: 4,
    left: 2,
    right: 2,
    bottom: 1,
    keys: false, // we drive nav so the marker follows the cursor + hops the spacer
    tags: true,
    style: {
      selected: { bg: "#2364AA", fg: "white" },
      item: { fg: "white" },
    },
  });

  let sel = 0; // current row index (never a null spacer)

  // Rebuild the rows so only the selected one wears the marker.
  function draw() {
    list.setItems(
      rows.map((r, i) =>
        r === null ? "" : (i === sel ? MARKER : PAD) + r.label
      )
    );
    list.select(sel);
    screen.render();
  }

  // Move selection, skipping over any null spacer rows.
  function step(dir) {
    let i = sel;
    do {
      i = (i + dir + rows.length) % rows.length;
    } while (rows[i] === null);
    sel = i;
    draw();
  }

  box.setContent(
    `{#3DA5D9-fg}{bold}welcome back, ${name}{/bold}{/#3DA5D9-fg}\n` +
      `{gray-fg}arrow keys + Enter to select · Ctrl-C to quit{/gray-fg}`
  );

  screen.append(box);
  capHeight(screen, box, 20); // up to 20 rows, but shrinks on short terminals
  list.focus();

  list.key(["up", "k"], () => step(-1));
  list.key(["down", "j"], () => step(1));
  list.key(["enter"], () => rows[sel]?.run());

  draw();
}
