import blessed from "neo-blessed";
import { createCard } from "../db/queries.js";

export function renderCreate(screen, navigate, { deck }) {
  const back = () => navigate("deck", { deck });

  const box = blessed.box({
    top: "center",
    left: "center",
    width: "60%",
    height: 16,
    border: { type: "line" },
    style: { border: { fg: "cyan" } },
    tags: true,
    label: ` ✍︎ new card in ${deck.name} `,
  });

  blessed.text({ parent: box, top: 1, left: 2, content: "front:" });
  const frontInput = blessed.textbox({
    parent: box,
    top: 2,
    left: 2,
    right: 2,
    height: 3,
    border: { type: "line" },
    inputOnFocus: true,
    style: { border: { fg: "gray" }, focus: { border: { fg: "cyan" } } },
  });

  blessed.text({ parent: box, top: 6, left: 2, content: "back:" });
  const backInput = blessed.textbox({
    parent: box,
    top: 7,
    left: 2,
    right: 2,
    height: 3,
    border: { type: "line" },
    inputOnFocus: true,
    style: { border: { fg: "gray" }, focus: { border: { fg: "cyan" } } },
  });

  const status = blessed.text({
    parent: box,
    bottom: 1,
    left: 2,
    right: 2,
    tags: true,
    content: "{gray-fg}enter to move between fields · esc to cancel{/gray-fg}",
  });

  screen.append(box);

  async function save() {
    const front = frontInput.getValue().trim();
    const backText = backInput.getValue().trim();
    if (!front || !backText) {
      status.setContent("{red-fg}both front and back are required.{/red-fg}");
      screen.render();
      frontInput.focus();
      return;
    }
    status.setContent("{gray-fg}saving...{/gray-fg}");
    screen.render();
    try {
      await createCard(deck.id, front, backText);
      back();
    } catch (err) {
      status.setContent(`{red-fg}${err.message}{/red-fg}`);
      screen.render();
      frontInput.focus();
    }
  }

  // Field navigation.
  frontInput.key(["escape"], back);
  backInput.key(["escape"], back);
  frontInput.on("submit", () => backInput.focus());
  backInput.on("submit", save);

  frontInput.focus();
  screen.render();
}
