import blessed from "neo-blessed";
import { createCard } from "../db/queries.js";

export function renderCreate(screen, navigate) {
  const box = blessed.box({
    top: "center",
    left: "center",
    width: "60%",
    height: 16,
    border: { type: "double" },
    style: { border: { fg: "blue" } },
    tags: true,
    label: " Create card ",
  });

  blessed.text({ parent: box, top: 1, left: 2, content: "Front:" });
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

  blessed.text({ parent: box, top: 6, left: 2, content: "Back:" });
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
    content:
      "{gray-fg}Tab/Enter to move between fields. Esc to cancel.{/gray-fg}",
  });

  screen.append(box);

  async function save() {
    const front = frontInput.getValue().trim();
    const back = backInput.getValue().trim();
    if (!front || !back) {
      status.setContent("{red-fg}Both front and back are required.{/red-fg}");
      screen.render();
      frontInput.focus();
      return;
    }
    status.setContent("{gray-fg}Saving...{/gray-fg}");
    screen.render();
    try {
      await createCard(front, back);
      navigate("menu");
    } catch (err) {
      status.setContent(`{red-fg}${err.message}{/red-fg}`);
      screen.render();
      frontInput.focus();
    }
  }

  // Field navigation.
  frontInput.key(["escape"], () => navigate("menu"));
  backInput.key(["escape"], () => navigate("menu"));
  frontInput.on("submit", () => backInput.focus());
  backInput.on("submit", save);

  frontInput.focus();
  screen.render();
}
